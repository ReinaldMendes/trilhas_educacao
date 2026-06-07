import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

const turmaSchema = z.object({
  name: z.string().min(2),
  year: z.number().int().min(2020).max(2100),
  unidadeId: z.string().uuid(),
})

const vinculoSchema = z.object({
  professorId: z.string().uuid(),
  tipoVinculo: z.enum(['regente', 'corregente']).default('regente'),
  dataInicio: z.string().optional(),
  dataFim: z.string().nullable().optional(),
})

// GET /api/turmas
router.get('/', async (req: AuthRequest, res: Response) => {
  const { unidadeId } = req.query
  const turmas = await prisma.turma.findMany({
    where: {
      active: true,
      ...(unidadeId ? { unidadeId: unidadeId as string } : {}),
    },
    include: {
      unidade: { select: { id: true, name: true } },
      vinculos: {
        where: { ativo: true },
        include: { professor: { select: { id: true, name: true, role: true } } },
      },
      _count: { select: { alunos: { where: { active: true } } } },
    },
    orderBy: { name: 'asc' },
  })
  res.json(turmas)
})

// GET /api/turmas/minhas
router.get('/minhas', authorize('professor', 'corregente'), async (req: AuthRequest, res: Response) => {
  const vinculos = await prisma.professorTurma.findMany({
    where: {
      professorId: req.user!.sub,
      ativo: true,
      OR: [{ dataFim: null }, { dataFim: { gte: new Date() } }],
    },
    include: {
      turma: {
        include: {
          unidade: { select: { id: true, name: true } },
          _count: { select: { alunos: { where: { active: true } } } },
        },
      },
    },
  })
  res.json(vinculos.map((v) => ({ ...v.turma, tipoVinculo: v.tipoVinculo })))
})

// POST /api/turmas
router.post('/', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = turmaSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })
  const turma = await prisma.turma.create({ data: parse.data })
  res.status(201).json(turma)
})

// PATCH /api/turmas/:id
router.patch('/:id', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  const turma = await prisma.turma.update({ where: { id: req.params.id }, data: req.body })
  res.json(turma)
})

// POST /api/turmas/:id/vinculos
router.post('/:id/vinculos', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = vinculoSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos' })

  const { professorId, tipoVinculo, dataInicio, dataFim } = parse.data
  const vinculo = await prisma.professorTurma.create({
    data: {
      professorId,
      turmaId: req.params.id,
      tipoVinculo,
      dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
      dataFim: dataFim ? new Date(dataFim) : null,
    },
    include: { professor: { select: { id: true, name: true, role: true } } },
  })
  res.status(201).json(vinculo)
})

// DELETE /api/turmas/:id/vinculos/:vinculoId
router.delete('/:id/vinculos/:vinculoId', authorize('coordenador'), async (req: AuthRequest, res: Response) => {
  await prisma.professorTurma.update({
    where: { id: req.params.vinculoId },
    data: { ativo: false, dataFim: new Date() },
  })
  res.json({ message: 'Vínculo encerrado' })
})

export default router
