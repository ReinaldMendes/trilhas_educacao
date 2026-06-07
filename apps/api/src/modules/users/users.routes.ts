import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '../../config/prisma'
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware'

const router = Router()
router.use(authenticate)

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['professor', 'corregente', 'coordenador', 'diretora', 'sme']),
})

// GET /api/users
router.get('/', authorize('coordenador', 'diretora', 'sme'), async (req: AuthRequest, res: Response) => {
  const { role, search } = req.query
  const users = await prisma.user.findMany({
    where: {
      active: true,
      ...(role ? { role: role as any } : {}),
      ...(search ? { name: { contains: search as string, mode: 'insensitive' } } : {}),
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// POST /api/users
router.post('/', authorize('coordenador', 'sme'), async (req: AuthRequest, res: Response) => {
  const parse = createUserSchema.safeParse(req.body)
  if (!parse.success) return res.status(400).json({ error: 'Dados inválidos', details: parse.error.flatten() })

  const { name, email, password, role } = parse.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true },
  })
  res.status(201).json(user)
})

// PATCH /api/users/:id
router.patch('/:id', authorize('coordenador', 'sme'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { name, active } = req.body
  const user = await prisma.user.update({
    where: { id },
    data: { ...(name ? { name } : {}), ...(active !== undefined ? { active } : {}) },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  res.json(user)
})

export default router
