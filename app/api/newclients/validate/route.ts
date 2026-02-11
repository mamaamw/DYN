import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactIdentifiers = [], nickname } = body;

    const results: {
      duplicates: any[];
      warnings: any[];
      nicknameExists?: boolean;
      existingNicknameClient?: string;
    } = {
      duplicates: [],
      warnings: []
    };

    // Vérifier le surnom s'il est fourni
    if (nickname && nickname.trim() !== '') {
      const existingNickname = await prisma.newClient.findFirst({
        where: {
          nickname: nickname.trim(),
          deletedAt: null
        },
        select: {
          id: true,
          nickname: true,
          surname: true,
          firstName: true
        }
      });

      if (existingNickname) {
        results.nicknameExists = true;
        results.existingNicknameClient = existingNickname.surname || existingNickname.firstName || `Client #${existingNickname.id}`;
      }
    }

    if (contactIdentifiers.length === 0) {
      return NextResponse.json(results);
    }

    const accountsToCheck = contactIdentifiers
      .map((c: any) => ({ accountNumber: c.accountNumber, accountType: c.accountType }))
      .filter((c: any) => c.accountNumber && c.accountNumber.trim() !== '') as { accountNumber: string; accountType: string }[];
    
    if (accountsToCheck.length === 0) {
      return NextResponse.json({ duplicates: [], warnings: [] });
    }

    // Chercher les doublons exacts (même numéro + même type)
    const existingExact = await prisma.contactIdentifier.findMany({
      where: {
        OR: accountsToCheck.map((c) => ({
          accountNumber: c.accountNumber,
          accountType: c.accountType,
        })),
      },
      include: {
        newClient: {
          select: {
            id: true,
            nickname: true,
            surname: true,
            firstName: true,
          }
        }
      }
    });

    // Chercher les avertissements (même numéro, types différents)
    const uniqueNumbers = Array.from(new Set(accountsToCheck.map((c) => c.accountNumber)));
    const existingSimilar = await prisma.contactIdentifier.findMany({
      where: {
        accountNumber: { in: uniqueNumbers },
        NOT: {
          OR: accountsToCheck.map((c) => ({
            accountNumber: c.accountNumber,
            accountType: c.accountType,
          }))
        }
      },
      include: {
        newClient: {
          select: {
            id: true,
            nickname: true,
            surname: true,
            firstName: true,
          }
        }
      }
    });

    const warnings = existingSimilar.map(c => ({
      accountNumber: c.accountNumber,
      accountType: c.accountType,
      client: c.newClient.nickname || c.newClient.surname || c.newClient.firstName || `Client #${c.newClient.id}`
    }));

    results.warnings = warnings;

    if (existingExact.length > 0) {
      const duplicates = existingExact.map(c => ({
        accountNumber: c.accountNumber,
        accountType: c.accountType,
        client: c.newClient.nickname || c.newClient.surname || c.newClient.firstName || `Client #${c.newClient.id}`
      }));
      results.duplicates = duplicates;
      return NextResponse.json(results);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error validating contacts:', error);
    return NextResponse.json({ duplicates: [] });
  }
}