import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/database/maintenance - Run database maintenance tasks (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Administrateur requis' }, { status: 403 });
    }

    const { task } = await request.json();

    const results: any = {
      task,
      timestamp: new Date().toISOString(),
    };

    switch (task) {
      case 'vacuum':
        try {
          // VACUUM ANALYZE for PostgreSQL
          await prisma.$executeRaw`VACUUM ANALYZE`;
          results.success = true;
          results.message = 'VACUUM ANALYZE exécuté avec succès';
        } catch (error: any) {
          results.success = false;
          results.error = error.message;
        }
        break;

      case 'analyze':
        try {
          await prisma.$executeRaw`ANALYZE`;
          results.success = true;
          results.message = 'ANALYZE exécuté avec succès';
        } catch (error: any) {
          results.success = false;
          results.error = error.message;
        }
        break;

      case 'reindex':
        try {
          // Reindex all tables
          await prisma.$executeRaw`REINDEX DATABASE CONCURRENTLY`;
          results.success = true;
          results.message = 'REINDEX exécuté avec succès';
        } catch (error: any) {
          results.success = false;
          results.error = error.message;
        }
        break;

      case 'prisma-generate':
        try {
          const { stdout, stderr } = await execAsync('npx prisma generate');
          results.success = true;
          results.message = 'Prisma Client regénéré avec succès';
          results.output = stdout;
          if (stderr) results.warnings = stderr;
        } catch (error: any) {
          results.success = false;
          // Special handling for EPERM errors (file locked by running server)
          if (error.message.includes('EPERM') || error.message.includes('operation not permitted')) {
            results.error = 'Impossible de regénérer Prisma pendant que le serveur tourne. Arrêtez le serveur et exécutez "npx prisma generate" manuellement.';
            results.solution = 'Commande à exécuter : Get-Process -Name node | Stop-Process -Force; npx prisma generate';
          } else {
            results.error = error.message;
          }
          if (error.stdout) results.output = error.stdout;
          if (error.stderr) results.warnings = error.stderr;
        }
        break;

      case 'prisma-db-push':
        try {
          const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate');
          results.success = true;
          results.message = 'Schema Prisma synchronisé avec succès';
          results.output = stdout;
          if (stderr) results.warnings = stderr;
        } catch (error: any) {
          results.success = false;
          results.error = error.message;
          results.output = error.stdout;
        }
        break;

      case 'check-schema':
        try {
          const { stdout, stderr } = await execAsync('npx prisma validate');
          results.success = true;
          results.message = 'Schema Prisma valide';
          results.output = stdout;
          if (stderr) results.warnings = stderr;
        } catch (error: any) {
          results.success = false;
          results.error = error.message;
          results.output = error.stdout;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Tâche de maintenance inconnue' },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Database maintenance error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la maintenance', details: error.message },
      { status: 500 }
    );
  }
}
