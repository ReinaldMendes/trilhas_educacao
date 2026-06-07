import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../../utils/jwt'
import { authenticate, AuthRequest } from '../../middleware/auth.middleware'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { email, password } = parse.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const payload = { sub: user.id, email: user.email, role: user.role, name: user.name }
  const accessToken = signAccessToken(payload)
  const refreshToken = await createRefreshToken(user.id)

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token não fornecido' })

  const result = await rotateRefreshToken(refreshToken)
  if (!result) return res.status(401).json({ error: 'Refresh token inválido ou expirado' })

  res.json(result)
})

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body
  if (refreshToken) await revokeRefreshToken(refreshToken)
  res.json({ message: 'Logout realizado com sucesso' })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
  res.json(user)
})

export default router
