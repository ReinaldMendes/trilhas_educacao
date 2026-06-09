import { PrismaClient } from '@prisma/client'

// Lazy singleton — don't connect at import time
// This prevents startup crashes when DATABASE_URL is temporarily unavailable
let _prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'minimal',
    })
  }
  return _prisma
}

// Export a proxy so all imports work as before (prisma.user.findMany etc)
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop]
  },
})

export default prisma
