import { NextRequest, NextResponse } from 'next/server';
import { createSystemLog, getClientIp, getUserAgent } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let userId: number | undefined;
  let userName = 'Utilisateur inconnu';

  // Essayer de récupérer l'utilisateur depuis le token
  try {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
        userId = decoded.userId as number;
        userName = (decoded as any).email || 'Utilisateur';
      }
    }
  } catch (error) {
    // Ignorer les erreurs de token
  }

  const response = NextResponse.json({ success: true });
  
  // Clear token cookie
  response.cookies.set('token', '', {
    path: '/',
    maxAge: 0,
  });

  // Log déconnexion
  await createSystemLog({
    userId,
    action: 'LOGOUT',
    entity: 'Auth',
    entityId: userId,
    description: `${userName} s'est déconnecté`,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    level: 'INFO',
  });

  return response;
}
