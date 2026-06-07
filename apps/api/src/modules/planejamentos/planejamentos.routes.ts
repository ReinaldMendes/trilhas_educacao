import { Router, Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'
import { audit } from '../../utils/audit'

const router = Router()
router.use(authenticate)

const propostaSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(5),
  tipo: z.enum(['escrita','leitura','jogo','brincadeira','arte','musica','movimento','exploracao','experiencia','roda_conversa','outro']),
  descricao: z.string().min(1),
  modalidade: z.enum(['dirigida','livre','externa']),
})

const planejamentoSchema = z.object({
  turmaId: z.string().uuid(),
  weekStart: z.string(),
  camposExperiencia: z.array(z.string()).default([]),
  objetivos: z.string().optional(),
  conteudos: z.string().optional(),
  mobilizacao: z.string().optional(),
  desenvolvimentoPropostas: z.string().optional(),
  anotacoesFinais: z.string().optional(),
  propostas: z.array(propostaSchema).default([]),
})

// GET /api/planejamentos
router.get('/', async (req: AuthRequest, res: Response) => {
  const { turmaId, weekStart, status } = req.query
  const role = req.user!.role
  const userId = req.user!.sub

  let where: any = {}
  if (turmaId) where.turmaId = turmaId
  if (weekStart) where.weekStart = new Date(weekStart as string)
  if (status) where.status = status

  // professor/corregente: only their own
  if (role === 'professor' || role === 'corregente') {
    where.professorId = userId
  }

  const planejamentos = await prisma.planejamento.findMany({
    where,
    include: {
      professor: { select: { id: true, name: true } },
      turma: { select: { id: true, name: true } },
      propostas: true,
    },
    orderBy: { weekStart: 'desc' },
  })
  res.json(planejamentos)
})

// GET /api/planejamentos/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const plano = await prisma.planejamento.findUnique({
    where: { id: req.params.id },
    include: {
      professor: { select: { id: true, name: true } },
      turma: { select: { id: true, name: true, unidade: { select: { name: true } } } },
      propostas: { orderBy: { dayOfWeek: 'asc' } },
    },
  })
  if (!plano) return res.status(404).json({ error: 'Planejamento não encontrado' })
  res.json(plano)
})

// POST /api/planejamentos
router.post('/', authorize('professor','corregente','coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = planejamentoSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { propostas, ...data } = parse.data
  const plano = await prisma.planejamento.create({
    data: {
      ...data,
      weekStart: new Date(data.weekStart),
      professorId: req.user!.sub,
      status: 'enviado',
      propostas: { create: propostas },
    },
    include: { propostas: true },
  })

  // Notificar coordenadores da unidade
  const turma = await prisma.turma.findUnique({ where: { id: data.turmaId }, include: { unidade: { include: { coordenadores: true } } } })
  if (turma) {
    const coordIds = turma.unidade.coordenadores.map((c) => c.userId)
    await Promise.all(coordIds.map((uid) =>
      prisma.notificacao.create({
        data: {
          userId: uid,
          title: 'Novo planejamento enviado',
          message: `${req.user!.name} enviou o planejamento da turma ${turma.name}`,
          link: `/coordenador/planejamentos/${plano.id}`,
        },
      })
    ))
  }

  await audit(req, 'CREATE', 'planejamento', plano.id)
  res.status(201).json(plano)
})

// PATCH /api/planejamentos/:id
router.patch('/:id', authorize('professor','corregente','coordenador'), async (req: AuthRequest, res: Response) => {
  const plano = await prisma.planejamento.update({
    where: { id: req.params.id },
    data: req.body,
  })
  await audit(req, 'UPDATE', 'planejamento', plano.id)
  res.json(plano)
})

// POST /api/planejamentos/:id/visto  (coord/diretora)
router.post('/:id/visto', authorize('coordenador','diretora'), async (req: AuthRequest, res: Response) => {
  const { obs } = req.body
  const plano = await prisma.planejamento.update({
    where: { id: req.params.id },
    data: { status: 'vistado', coordenadorVisto: true, coordenadorObs: obs, vistadoPor: req.user!.name },
    include: { professor: true },
  })

  // Notificar professor
  await prisma.notificacao.create({
    data: {
      userId: plano.professorId,
      title: 'Planejamento vistado',
      message: obs
        ? `${req.user!.name} vistou seu planejamento e adicionou uma observação.`
        : `${req.user!.name} vistou seu planejamento.`,
      link: `/professor/planejamentos/${plano.id}`,
    },
  })

  await audit(req, 'VISTO', 'planejamento', plano.id)
  res.json(plano)
})

export default router
