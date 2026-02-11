import { prisma } from './prisma';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogData {
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  level?: LogLevel;
}

/**
 * Enregistre un événement dans les logs système
 */
export async function createSystemLog(data: LogData) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        level: data.level || 'INFO',
      },
    });
  } catch (error) {
    // Ne pas faire échouer l'opération si le logging échoue
    console.error('Failed to create system log:', error);
  }
}

/**
 * Extrait l'adresse IP de la requête
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  return ip || undefined;
}

/**
 * Extrait le User-Agent de la requête
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
