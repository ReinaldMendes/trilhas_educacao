import { Router, Response } from 'express'
import { z } from 'zod'
import OpenAI from 'openai'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'
import { audit } from '../../utils/audit'

const router = Router()
router.use(authenticate)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente pedagógico especializado em Educação Infantil.
Seu papel é ajudar professoras a organizar suas observações em pareceres descritivos, claros e fundamentados na abordagem da documentação pedagógica.
Escreva sempre em português brasileiro, com linguagem acolhedora, respeitosa e sem julgamentos.
O parecer deve valorizar as conquistas, os percursos e as singularidades da criança.
Nunca invente informações além do que foi fornecido nos registros.
Organize o texto em parágrafos fluidos, sem tópicos ou marcadores. Limite o parecer a 3-4 parágrafos.`

// GET /api/pareceres?alunoId=&period=
router.get('/', async (req: AuthRequest, res: Response) => {
  const { alunoId, period } = req.query
  const role = req.user!.role
  const where: any = {}
  if (alunoId) where.alunoId = alunoId
  if (period) where.period = period
  if (role === 'professor' || role === 'corregente') where.professorId = req.user!.sub

  const pareceres = await prisma.parecer.findMany({
    where,
    include: {
      professor: { select: { id: true, name: true } },
      aluno: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(pareceres)
})

// GET /api/pareceres/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const parecer = await prisma.parecer.findUnique({
    where: { id: req.params.id },
    include: {
      professor: { select: { id: true, name: true } },
      aluno: { select: { id: true, name: true } },
    },
  })
  if (!parecer) return res.status(404).json({ error: 'Parecer não encontrado' })
  res.json(parecer)
})

// POST /api/pareceres/gerar  — streams the AI response
router.post('/gerar', authorize('professor','corregente','coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = z.object({
    alunoId: z.string().uuid(),
    period: z.string(),
    registroIds: z.array(z.string().uuid()).min(1).max(20),
  }).safeParse(req.body)

  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos' })
  const { alunoId, period, registroIds } = parse.data

  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { name: true } })
  const registros = await prisma.registro.findMany({
    where: { id: { in: registroIds } },
    select: { date: true, observacao: true },
    orderBy: { date: 'asc' },
  })

  if (!aluno || registros.length === 0) {
    return res.status(404).json({ error: 'Aluno ou registros não encontrados' })
  }

  const registrosText = registros
    .map((r, i) => `[Registro ${i + 1} - ${new Date(r.date).toLocaleDateString('pt-BR')}]\n${r.observacao}`)
    .join('\n\n')

  const userMessage = `Com base nos seguintes registros de observação da criança ${aluno.name}, referentes ao período ${period}, redija um parecer descritivo trimestral:\n\n${registrosText}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 1500,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    })

    let fullText = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      fullText += delta
      res.write(`data: ${JSON.stringify({ delta })}\n\n`)
    }
    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`)
    res.end()
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// POST /api/pareceres  — save final parecer
router.post('/', authorize('professor','corregente','coordenador'), async (req: AuthRequest, res: Response) => {
  const parse = z.object({
    alunoId: z.string().uuid(),
    period: z.string(),
    textIa: z.string().optional(),
    textFinal: z.string().min(10),
    header: z.string().optional(),
    intro: z.string().optional(),
    status: z.enum(['rascunho','finalizado']).default('rascunho'),
  }).safeParse(req.body)

  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos' })

  const role = req.user!.role
  const isSubst = role === 'coordenador'

  const parecer = await prisma.parecer.create({
    data: {
      ...parse.data,
      professorId: req.user!.sub,
      geradoEmSubst: isSubst,
      substitutoPor: isSubst ? req.user!.name : null,
    },
  })

  await audit(req, 'CREATE', 'parecer', parecer.id)
  res.status(201).json(parecer)
})

// PATCH /api/pareceres/:id
router.patch('/:id', authorize('professor','corregente','coordenador'), async (req: AuthRequest, res: Response) => {
  const parecer = await prisma.parecer.update({ where: { id: req.params.id }, data: req.body })
  await audit(req, 'UPDATE', 'parecer', parecer.id)
  res.json(parecer)
})

export default router
