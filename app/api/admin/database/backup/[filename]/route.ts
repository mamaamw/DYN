import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { filename } = await params;
    if (!filename.match(/^dyn_backup_\d{8}_\d{6}\.(sql|sql\.zip)$/)) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(backupPath);
    const contentType = filename.endsWith('.zip') ? 'application/zip' : 'application/sql';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return NextResponse.json({ error: 'Erreur lors du téléchargement du fichier' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { filename } = await params;
    if (!filename.match(/^dyn_backup_\d{8}_\d{6}\.(sql|sql\.zip)$/)) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const backupPath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    fs.unlinkSync(backupPath);

    return NextResponse.json({ success: true, message: 'Sauvegarde supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du fichier' }, { status: 500 });
  }
}
