const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Insertion de clients de test...');

  // Récupérer le premier utilisateur (admin)
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Créez d\'abord un admin.');
    return;
  }

  console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

  // Supprimer les anciens clients de test s'ils existent
  await prisma.client.deleteMany({
    where: {
      email: {
        in: [
          'jean.dupont@example.com',
          'marie.martin@example.com',
          'pierre.durand@example.com'
        ]
      }
    }
  });

  // Créer 3 clients de test
  const clients = await prisma.client.createMany({
    data: [
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        phone1: '+33 6 12 34 56 78',
        userId: user.id
      },
      {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        phone1: '+33 6 98 76 54 32',
        userId: user.id
      },
      {
        firstName: 'Pierre',
        lastName: 'Durand',
        email: 'pierre.durand@example.com',
        phone1: '+33 6 11 22 33 44',
        userId: user.id
      }
    ]
  });

  console.log(`✅ ${clients.count} clients créés avec succès !`);

  // Afficher les clients créés
  const allClients = await prisma.client.findMany({
    where: {
      email: {
        in: [
          'jean.dupont@example.com',
          'marie.martin@example.com',
          'pierre.durand@example.com'
        ]
      }
    }
  });

  console.log('\n📋 Clients créés:');
  allClients.forEach(client => {
    console.log(`   - ${client.firstName} ${client.lastName} (${client.email})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
