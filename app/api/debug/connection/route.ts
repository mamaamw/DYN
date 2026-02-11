import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Informations sur la base de données
    const dbInfo = {
      connected: false,
      userCount: 0,
      adminCount: 0,
      lastLogin: null,
    };

    try {
      // Test de connexion à la base
      await prisma.$connect();
      dbInfo.connected = true;

      // Compter les utilisateurs
      dbInfo.userCount = await prisma.user.count();
      dbInfo.adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      // Dernière connexion réussie
      const lastLog = await prisma.systemLog.findFirst({
        where: { action: 'LOGIN_SUCCESS' },
        orderBy: { createdAt: 'desc' }
      });

      if (lastLog && lastLog.userId) {
        const user = await prisma.user.findUnique({
          where: { id: lastLog.userId },
          select: { username: true }
        });
        dbInfo.lastLogin = {
          username: user?.username || 'Unknown',
          date: lastLog.createdAt
        } as any;
      }

    } catch (dbError) {
      console.error('Erreur base de données:', dbError);
    }

    // Récupérer les derniers logs de connexion
    let recentLoginAttempts: any[] = [];
    try {
      const logs = await prisma.systemLog.findMany({
        where: {
          action: {
            in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_ATTEMPT']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Fetch usernames for logs with userId
      recentLoginAttempts = await Promise.all(logs.map(async (log) => {
        if (log.userId) {
          const user = await prisma.user.findUnique({
            where: { id: log.userId },
            select: { username: true }
          });
          return { ...log, user };
        }
        return log;
      }));
    } catch (error) {
      console.error('Erreur récupération logs:', error);
    }

    // Informations système
    const systemInfo = {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Configuré' : 'Non configuré',
      jwtSecret: process.env.JWT_SECRET ? 'Configuré' : 'Non configuré',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      database: dbInfo,
      recentLoginAttempts,
      system: systemInfo
    });

  } catch (error) {
    console.error('Erreur debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      database: { connected: false },
      system: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  }
}