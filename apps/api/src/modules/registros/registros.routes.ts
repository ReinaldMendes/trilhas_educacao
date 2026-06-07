import { Router, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'
import { audit } from '../../utils/audit'

const router = Router()
router.use(authenticate)

// Local storage for dev; swap with S3 in prod
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4']
    cb(null, allowed.includes(file.mimetype))
  },
})

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

  let where: any = {}
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
router.post('/', authorize('professor','corregente'), upload.array('anexos', 5), async (req: AuthRequest, res: Response) => {
  const parse = registroSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { alunoId, turmaId, date, observacao } = parse.data
  const files = req.files as Express.Multer.File[]
  const baseUrl = process.env.API_URL || `http://localhost:3001`

  const registro = await prisma.registro.create({
    data: {
      professorId: req.user!.sub,
      alunoId,
      turmaId,
      date: new Date(date),
      observacao,
      anexos: {
        create: files.map((f) => ({
          filename: f.originalname,
          mimeType: f.mimetype,
          storageUrl: `${baseUrl}/uploads/${f.filename}`,
          sizeBytes: f.size,
        })),
      },
    },
    include: { anexos: true },
  })

  await audit(req, 'CREATE', 'registro', registro.id)
  res.status(201).json(registro)
})

// PATCH /api/registros/:id/comentario  (coord/diretora)
router.patch('/:id/comentario', authorize('coordenador','diretora'), async (req: AuthRequest, res: Response) => {
  const { coordenadorObs, vistado } = req.body
  const registro = await prisma.registro.update({
    where: { id: req.params.id },
    data: {
      ...(coordenadorObs !== undefined ? { coordenadorObs } : {}),
      ...(vistado !== undefined ? { vistado } : {}),
    },
  })

  // Notificar professor
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

// Serve uploads (dev only)
router.use('/files', (req, res) => {
  res.sendFile(path.join(uploadDir, req.path))
})

export default router
