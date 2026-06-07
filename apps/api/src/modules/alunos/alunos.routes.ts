import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

const alunoSchema = z.object({
  name: z.string().min(2),
  turmaId: z.string().uuid(),
  birthDate: z.string().optional(),
})

// GET /api/alunos?turmaId=
router.get('/', async (req: AuthRequest, res: Response) => {
  const { turmaId } = req.query
  const alunos = await prisma.aluno.findMany({
    where: {
      active: true,
      ...(turmaId ? { turmaId: turmaId as string } : {}),
    },
    include: { turma: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  res.json(alunos)
})

// GET /api/alunos/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const aluno = await prisma.aluno.findUnique({
    where: { id: req.params.id },
    include: {
      turma: { select: { id: true, name: true } },
      _count: { select: { registros: true, pareceres: true } },
    },
  })
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' })
  res.json(aluno)
})

// POST /api/alunos
router.post('/', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = alunoSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { name, turmaId, birthDate } = parse.data
  const aluno = await prisma.aluno.create({
    data: { name, turmaId, birthDate: birthDate ? new Date(birthDate) : null },
  })
  res.status(201).json(aluno)
})

// PATCH /api/alunos/:id
router.patch('/:id', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  const { name, birthDate, active, turmaId } = req.body
  const aluno = await prisma.aluno.update({
    where: { id: req.params.id },
    data: {
      ...(name ? { name } : {}),
      ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(turmaId ? { turmaId } : {}),
    },
  })
  res.json(aluno)
})

export default router
