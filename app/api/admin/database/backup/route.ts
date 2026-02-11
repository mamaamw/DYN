import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { compress = true } = body;

    // Exécuter le script de backup
    const scriptPath = path.join(process.cwd(), 'scripts', 'backup-database.ps1');
    const compressFlag = compress ? '-Compress' : '';
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${compressFlag}`;

    const { stdout, stderr } = await execAsync(command);

    // Extraire le nom du fichier de backup depuis la sortie
    const backupFileMatch = stdout.match(/Fichier: (.+\.sql(?:\.zip)?)/);
    const backupFile = backupFileMatch ? backupFileMatch[1] : null;

    return NextResponse.json({
      success: true,
      message: 'Sauvegarde créée avec succès',
      output: stdout,
      backupFile,
      compressed: compress
    });

  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json({
      error: 'Erreur lors de la sauvegarde de la base de données',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Lister les sauvegardes disponibles
    const backupsDir = path.join(process.cwd(), 'backups');
    
    try {
      await fs.access(backupsDir);
    } catch {
      return NextResponse.json({ backups: [] });
    }

    const files = await fs.readdir(backupsDir);
    const backups = await Promise.all(
      files
        .filter(f => f.startsWith('dyn_backup_') && (f.endsWith('.sql') || f.endsWith('.sql.zip')))
        .map(async (filename) => {
          const filePath = path.join(backupsDir, filename);
          const stats = await fs.stat(filePath);
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            compressed: filename.endsWith('.zip')
          };
        })
    );

    // Trier par date (plus récent en premier)
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    return NextResponse.json({ backups });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des sauvegardes:', error);
    return NextResponse.json({
      error: 'Erreur lors de la récupération des sauvegardes',
      details: error.message
    }, { status: 500 });
  }
}
