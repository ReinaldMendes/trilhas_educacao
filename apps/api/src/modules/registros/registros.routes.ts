import { Router, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { Readable } from 'stream'
import prisma from '../../config/prisma'
import cloudinary from '../../config/cloudinary'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'
import { audit } from '../../utils/audit'

const router = Router()
router.use(authenticate)

// Multer com memoryStorage — arquivo vai direto para o Cloudinary, sem disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'video/mp4']
    cb(null, allowed.includes(file.mimetype))
  },
})

async function uploadToCloudinary(buffer: Buffer, mimetype: string, originalname: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('video/') ? 'video' : mimetype === 'application/pdf' ? 'raw' : 'image'
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trilhas_educacao/registros',
        resource_type: resourceType,
        public_id: `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error('Cloudinary upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
  })
}

const registroSchema = z.object({
  alunoId: z.string().uuid(),
  turmaId: z.string().uuid(),
  date: z.string(),
  observacao: z.string().min(10),
})

// GET /api/registros?alunoId=&turmaId=
router.get('/', async (req: AuthRequest, res: Response) => {
  const { alunoId, turmaId } = req.query
  const role = req.user!.role
  const userId = req.user!.sub

  const where: any = {}
  if (alunoId) where.alunoId = alunoId
  if (turmaId) where.turmaId = turmaId
  if (role === 'professor' || role === 'corregente') where.professorId = userId

  const registros = await prisma.registro.findMany({
    where,
    include: {
      professor: { select: { id: true, name: true } },
      aluno: { select: { id: true, name: true } },
      anexos: true,
    },
    orderBy: { date: 'desc' },
  })
  res.json(registros)
})

// GET /api/registros/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const registro = await prisma.registro.findUnique({
    where: { id: req.params.id },
    include: {
      professor: { select: { id: true, name: true } },
      aluno: { select: { id: true, name: true } },
      turma: { select: { id: true, name: true } },
      anexos: true,
    },
  })
  if (!registro) return res.status(404).json({ error: 'Registro não encontrado' })
  res.json(registro)
})

// POST /api/registros
router.post('/', authorize('professor', 'corregente'), upload.array('anexos', 5), async (req: AuthRequest, res: Response) => {
  const parse = registroSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { alunoId, turmaId, date, observacao } = parse.data
  const files = (req.files as Express.Multer.File[]) || []

  // Upload de cada arquivo para o Cloudinary
  const anexosData = await Promise.all(
    files.map(async (f) => {
      const { url, publicId } = await uploadToCloudinary(f.buffer, f.mimetype, f.originalname)
      return {
        filename: f.originalname,
        mimeType: f.mimetype,
        storageUrl: url,
        publicId,
        sizeBytes: f.size,
      }
    })
  )

  const registro = await prisma.registro.create({
    data: {
      professorId: req.user!.sub,
      alunoId,
      turmaId,
      date: new Date(date),
      observacao,
      anexos: {
        create: anexosData.map(({ filename, mimeType, storageUrl, sizeBytes }) => ({
          filename,
          mimeType,
          storageUrl,
          sizeBytes,
        })),
      },
    },
    include: { anexos: true },
  })

  await audit(req, 'CREATE', 'registro', registro.id)
  res.status(201).json(registro)
})

// PATCH /api/registros/:id/comentario
router.patch('/:id/comentario', authorize('coordenador', 'diretora'), async (req: AuthRequest, res: Response) => {
  const { coordenadorObs, vistado } = req.body
  const registro = await prisma.registro.update({
    where: { id: req.params.id },
    data: {
      ...(coordenadorObs !== undefined ? { coordenadorObs } : {}),
      ...(vistado !== undefined ? { vistado } : {}),
    },
  })

  await prisma.notificacao.create({
    data: {
      userId: registro.professorId,
      title: 'Comentário no registro',
      message: `${req.user!.name} comentou um registro.`,
      link: `/professor/registros/${registro.id}`,
    },
  })

  await audit(req, 'COMENTARIO', 'registro', registro.id)
  res.json(registro)
})

export default router
