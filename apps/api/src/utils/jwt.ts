import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/prisma'

const ACCESS_SECRET = process.env.JWT_SECRET || 'trilhas-secret-dev'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'trilhas-refresh-secret-dev'

export interface TokenPayload {
  sub: string
  email: string
  role: string
  name: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '8h' })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return token
}

export async function rotateRefreshToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const record = await prisma.refreshToken.findUnique({ where: { token: oldToken }, include: { user: true } })
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.refreshToken.delete({ where: { token: oldToken } })
    return null
  }
  await prisma.refreshToken.delete({ where: { token: oldToken } })
  const payload: TokenPayload = { sub: record.user.id, email: record.user.email, role: record.user.role, name: record.user.name }
  const accessToken = signAccessToken(payload)
  const refreshToken = await createRefreshToken(record.user.id)
  return { accessToken, refreshToken }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } })
}
