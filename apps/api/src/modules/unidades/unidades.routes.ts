import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'
import { audit } from '../../utils/audit'

const router = Router()
router.use(authenticate)

const unidadeSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['cmei', 'escola']),
  address: z.string().optional(),
})

// GET /api/unidades
router.get('/', async (req: AuthRequest, res: Response) => {
  const role = req.user!.role
  const userId = req.user!.sub

  const unidades = role === 'sme'
    ? await prisma.unidade.findMany({
        include: { _count: { select: { turmas: true, coordenadores: true } } },
        orderBy: { name: 'asc' },
      })
    : await prisma.unidade.findMany({
        where: { coordenadores: { some: { userId } } },
        include: { _count: { select: { turmas: true, coordenadores: true } } },
        orderBy: { name: 'asc' },
      })

  res.json(unidades)
})

// GET /api/unidades/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const unidade = await prisma.unidade.findUnique({
    where: { id: req.params.id },
    include: {
      turmas: {
        where: { active: true },
        include: { _count: { select: { alunos: true, vinculos: true } } },
        orderBy: { name: 'asc' },
      },
      coordenadores: true,
      _count: { select: { turmas: true } },
    },
  })
  if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' })
  res.json(unidade)
})

// POST /api/unidades — SME cria unidade
router.post('/', authorize('sme'), async (req: AuthRequest, res: Response) => {
  const parse = unidadeSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })
  const unidade = await prisma.unidade.create({ data: parse.data })
  await audit(req, 'CREATE', 'unidade', unidade.id)
  res.status(201).json(unidade)
})

// PATCH /api/unidades/:id — SME edita
router.patch('/:id', authorize('sme'), async (req: AuthRequest, res: Response) => {
  const parse = z.object({
    name: z.string().min(3).optional(),
    type: z.enum(['cmei', 'escola']).optional(),
    address: z.string().optional(),
    active: z.boolean().optional(),
  }).safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos' })
  const data = parse.data as any
  const unidade = await prisma.unidade.update({ where: { id: req.params.id }, data })
  await audit(req, 'UPDATE', 'unidade', unidade.id)
  res.json(unidade)
})

// POST /api/unidades/:id/coordenadores — vincular coord/diretora
router.post('/:id/coordenadores', authorize('sme'), async (req: AuthRequest, res: Response) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId obrigatório' })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !['coordenador', 'diretora'].includes(user.role))
    return res.status(400).json({ error: 'Usuário deve ser coordenador ou diretora' })
  const vinculo = await prisma.unidadeUser.upsert({
    where: { unidadeId_userId: { unidadeId: req.params.id, userId } },
    update: {},
    create: { unidadeId: req.params.id, userId },
  })
  await audit(req, 'VINCULAR_COORDENADOR', 'unidade', req.params.id)
  res.status(201).json(vinculo)
})

// DELETE /api/unidades/:id/coordenadores/:userId — desvincular
router.delete('/:id/coordenadores/:userId', authorize('sme'), async (req: AuthRequest, res: Response) => {
  await prisma.unidadeUser.delete({
    where: { unidadeId_userId: { unidadeId: req.params.id, userId: req.params.userId } },
  })
  await audit(req, 'DESVINCULAR_COORDENADOR', 'unidade', req.params.id)
  res.json({ ok: true })
})

export default router
