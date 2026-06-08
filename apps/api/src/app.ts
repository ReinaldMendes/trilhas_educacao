import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { rateLimit } from 'express-rate-limit'

import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/users.routes'
import turmaRoutes from './modules/turmas/turmas.routes'
import alunoRoutes from './modules/alunos/alunos.routes'
import planejamentoRoutes from './modules/planejamentos/planejamentos.routes'
import registroRoutes from './modules/registros/registros.routes'
import parecerRoutes from './modules/pareceres/pareceres.routes'
import dashboardRoutes from './modules/dashboards/dashboards.routes'

const app = express()

// ── Health check — FIRST, before all middleware ──────────
// Must respond immediately for Railway healthcheck to pass
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'trilhas-api', time: new Date().toISOString() })
})

// ── Security ────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// ── Rate limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
})

// ── Middleware ───────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}



// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/turmas', turmaRoutes)
app.use('/api/alunos', alunoRoutes)
app.use('/api/planejamentos', planejamentoRoutes)
app.use('/api/registros', registroRoutes)
app.use('/api/pareceres', parecerRoutes)
app.use('/api/dashboards', dashboardRoutes)

// ── 404 handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' })
})

// ── Error handler ────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

export default app
