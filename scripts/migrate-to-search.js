const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToSearch() {
  try {
    console.log('Début de la migration des données vers la table Search...');
    
    // Récupérer tous les clients avec des données de recherche
    const clients = await prisma.newClient.findMany({
      where: {
        OR: [
          { generalReference: { not: null } },
          { detailedReference: { not: null } },
          { searchStartDate: { not: null } },
          { searchEndDate: { not: null } }
        ]
      }
    });

    console.log(`${clients.length} client(s) trouvé(s) avec des données de recherche`);

    // Créer un enregistrement Search pour chaque client
    for (const client of clients) {
      await prisma.search.create({
        data: {
          newClientId: client.id,
          generalReference: client.generalReference,
          detailedReference: client.detailedReference,
          startDate: client.searchStartDate,
          endDate: client.searchEndDate,
        }
      });
      console.log(`✓ Migré recherche pour client ID ${client.id}`);
    }

    console.log('✅ Migration terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToSearch();
