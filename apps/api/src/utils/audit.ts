import prisma from '../config/prisma'
import { Request } from 'express'

export async function audit(
  req: Request & { user?: { sub: string } },
  action: string,
  entity: string,
  entityId?: string
) {
  try {
    if (!req.user?.sub) return
    await prisma.auditLog.create({
      data: {
        userId: req.user.sub,
        action,
        entity,
        entityId,
        ipAddress: req.ip,
      },
    })
  } catch {
    // audit should not break requests
  }
}
