import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { rateLimit } from 'express-rate-limit'

import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/users.routes'
import unidadeRoutes from './modules/unidades/unidades.routes'
import turmaRoutes from './modules/turmas/turmas.routes'
import alunoRoutes from './modules/alunos/alunos.routes'
import planejamentoRoutes from './modules/planejamentos/planejamentos.routes'
import registroRoutes from './modules/registros/registros.routes'
import parecerRoutes from './modules/pareceres/pareceres.routes'
import dashboardRoutes from './modules/dashboards/dashboards.routes'

const app = express()

// ── Health check — antes de qualquer middleware ──────────────────────────────
app.get('/health', (_req, res) => {
  console.log('[HEALTH] ping received')
  res.status(200).json({ status: 'ok', service: 'trilhas-api', ts: Date.now() })
})

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true)
    cb(new Error(`CORS bloqueado: ${origin}`))
  },
  credentials: true,
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false })
app.use(limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
})

// ── Body / logging ────────────────────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/unidades', unidadeRoutes)
app.use('/api/turmas', turmaRoutes)
app.use('/api/alunos', alunoRoutes)
app.use('/api/planejamentos', planejamentoRoutes)
app.use('/api/registros', registroRoutes)
app.use('/api/pareceres', parecerRoutes)
app.use('/api/dashboards', dashboardRoutes)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.stack)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

export default app
