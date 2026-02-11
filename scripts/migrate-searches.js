/**
 * Script de migration pour convertir les anciennes recherches
 * en relation many-to-many via SearchClient
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Début de la migration des recherches...');

  try {
    // Vérifier si SearchClient est vide
    const existingLinks = await prisma.searchClient.count();
    
    if (existingLinks > 0) {
      console.log(`ℹ️  ${existingLinks} liens existent déjà. Migration déjà effectuée ?`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        readline.question('Voulez-vous continuer ? (y/n): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Migration annulée');
        return;
      }
    }

    // Récupérer toutes les recherches
    const searches = await prisma.search.findMany({
      include: {
        clients: true
      }
    });

    console.log(`📊 ${searches.length} recherches trouvées`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const search of searches) {
      // Si la recherche a déjà des clients liés, on skip
      if (search.clients.length > 0) {
        console.log(`⏭️  Recherche #${search.id} déjà liée à ${search.clients.length} client(s)`);
        skippedCount++;
        continue;
      }

      console.log(`⚠️  Recherche #${search.id} (${search.generalReference}) n'a pas de clients liés`);
      console.log('   Cette recherche orpheline sera conservée mais nécessitera une action manuelle');
      skippedCount++;
    }

    console.log('\n✅ Migration terminée !');
    console.log(`   - ${migratedCount} recherches migrées`);
    console.log(`   - ${skippedCount} recherches ignorées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
