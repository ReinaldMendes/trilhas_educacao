import { Router, Response } from 'express'
import prisma from '../../config/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

const CAMPOS_EXPERIENCIA = [
  { id: 'o_eu_outro_nos', label: 'O Eu, o Outro e o Nós' },
  { id: 'corpo_gestos_movimentos', label: 'Corpo, Gestos e Movimentos' },
  { id: 'tracos_sons_cores_formas', label: 'Traços, Sons, Cores e Formas' },
  { id: 'escuta_fala_pensamento_imaginacao', label: 'Escuta, Fala, Pensamento e Imaginação' },
  { id: 'espacos_tempos_quantidades', label: 'Espaços, Tempos, Quantidades, Relações e Transformações' },
]

// GET /api/dashboards/professor  (própria turma)
router.get('/professor', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.sub

  const vinculos = await prisma.professorTurma.findMany({
    where: { professorId: userId, ativo: true },
    select: { turmaId: true },
  })
  const turmaIds = vinculos.map((v) => v.turmaId)

  const [planejamentos, registros, alunos] = await Promise.all([
    prisma.planejamento.findMany({ where: { professorId: userId }, select: { camposExperiencia: true, propostas: true } }),
    prisma.registro.findMany({ where: { professorId: userId }, select: { alunoId: true, date: true } }),
    prisma.aluno.findMany({ where: { turmaId: { in: turmaIds }, active: true }, select: { id: true, name: true } }),
  ])

  // Campo de experiência mais trabalhados
  const campoCount: Record<string, number> = {}
  for (const p of planejamentos) {
    const campos = p.camposExperiencia as string[]
    for (const c of campos) { campoCount[c] = (campoCount[c] || 0) + 1 }
  }

  // Tipos de proposta
  const tipoCount: Record<string, number> = {}
  const modalidadeCount: Record<string, number> = {}
  for (const p of planejamentos) {
    for (const prop of p.propostas as any[]) {
      tipoCount[prop.tipo] = (tipoCount[prop.tipo] || 0) + 1
      modalidadeCount[prop.modalidade] = (modalidadeCount[prop.modalidade] || 0) + 1
    }
  }

  // Frequência de registros por aluno
  const registrosPorAluno: Record<string, number> = {}
  for (const r of registros) {
    registrosPorAluno[r.alunoId] = (registrosPorAluno[r.alunoId] || 0) + 1
  }

  res.json({
    totalPlanejamentos: planejamentos.length,
    totalRegistros: registros.length,
    totalAlunos: alunos.length,
    camposExperiencia: CAMPOS_EXPERIENCIA.map((c) => ({ ...c, count: campoCount[c.id] || 0 })),
    tiposProposta: Object.entries(tipoCount).map(([tipo, count]) => ({ tipo, count })),
    modalidades: Object.entries(modalidadeCount).map(([modalidade, count]) => ({ modalidade, count })),
    registrosPorAluno: alunos.map((a) => ({ ...a, count: registrosPorAluno[a.id] || 0 })),
  })
})

// GET /api/dashboards/unidade?unidadeId=  (coord/diretora)
router.get('/unidade', async (req: AuthRequest, res: Response) => {
  const { unidadeId } = req.query
  const role = req.user!.role
  if (!['coordenador','diretora','sme'].includes(role)) {
    return res.status(403).json({ error: 'Sem permissão' })
  }

  const where = unidadeId ? { unidade: { id: unidadeId as string } } : {}
  const turmas = await prisma.turma.findMany({
    where: { active: true, ...where },
    select: { id: true, name: true },
  })
  const turmaIds = turmas.map((t) => t.id)

  const [planejamentos, registros, alunos] = await Promise.all([
    prisma.planejamento.findMany({ where: { turmaId: { in: turmaIds } }, select: { camposExperiencia: true, propostas: true, turmaId: true, professorId: true, status: true } }),
    prisma.registro.findMany({ where: { turmaId: { in: turmaIds } }, select: { alunoId: true, date: true } }),
    prisma.aluno.count({ where: { turmaId: { in: turmaIds }, active: true } }),
  ])

  const campoCount: Record<string, number> = {}
  const modalidadeCount: Record<string, number> = {}
  const tipoCount: Record<string, number> = {}

  for (const p of planejamentos) {
    for (const c of p.camposExperiencia as string[]) { campoCount[c] = (campoCount[c] || 0) + 1 }
    for (const prop of p.propostas as any[]) {
      tipoCount[prop.tipo] = (tipoCount[prop.tipo] || 0) + 1
      modalidadeCount[prop.modalidade] = (modalidadeCount[prop.modalidade] || 0) + 1
    }
  }

  const planejamentosPorTurma = turmas.map((t) => ({
    turma: t.name,
    count: planejamentos.filter((p) => p.turmaId === t.id).length,
  }))

  res.json({
    totalTurmas: turmas.length,
    totalAlunos: alunos,
    totalPlanejamentos: planejamentos.length,
    totalRegistros: registros.length,
    camposExperiencia: CAMPOS_EXPERIENCIA.map((c) => ({ ...c, count: campoCount[c.id] || 0 })),
    tiposProposta: Object.entries(tipoCount).map(([tipo, count]) => ({ tipo, count })),
    modalidades: Object.entries(modalidadeCount).map(([modalidade, count]) => ({ modalidade, count })),
    planejamentosPorTurma,
  })
})

// GET /api/dashboards/rede  (SME)
router.get('/rede', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'sme') return res.status(403).json({ error: 'Sem permissão' })

  const [unidades, turmas, alunos, planejamentos, registros, pareceres] = await Promise.all([
    prisma.unidade.count({ where: { active: true } }),
    prisma.turma.count({ where: { active: true } }),
    prisma.aluno.count({ where: { active: true } }),
    prisma.planejamento.count(),
    prisma.registro.count(),
    prisma.parecer.count({ where: { status: 'finalizado' } }),
  ])

  const porUnidade = await prisma.unidade.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      type: true,
      _count: { select: { turmas: true } },
    },
  })

  res.json({
    totais: { unidades, turmas, alunos, planejamentos, registros, pareceresFinalizados: pareceres },
    porUnidade,
  })
})

// GET /api/dashboards/notificacoes
router.get('/notificacoes', async (req: AuthRequest, res: Response) => {
  const notifs = await prisma.notificacao.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  res.json(notifs)
})

// PATCH /api/dashboards/notificacoes/:id/lida
router.patch('/notificacoes/:id/lida', async (req: AuthRequest, res: Response) => {
  await prisma.notificacao.updateMany({
    where: { id: req.params.id, userId: req.user!.sub },
    data: { read: true },
  })
  res.json({ ok: true })
})

export default router
