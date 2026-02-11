const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateSearchRelations() {
  try {
    console.log('🔄 Migration des relations Search -> SearchClient...');
    
    // 1. Récupérer toutes les anciennes données Search
    const oldSearches = await prisma.$queryRaw`
      SELECT id, "newClientId", "generalReference", "detailedReference", "startDate", "endDate", "createdAt", "updatedAt"
      FROM "Search"
    `;
    
    console.log(`📊 ${oldSearches.length} recherches trouvées`);
    
    // 2. Créer une map pour grouper par (generalReference, detailedReference)
    const searchGroups = new Map();
    
    for (const search of oldSearches) {
      const key = `${search.generalReference || ''}|${search.detailedReference || ''}`;
      
      if (!searchGroups.has(key)) {
        searchGroups.set(key, {
          generalReference: search.generalReference,
          detailedReference: search.detailedReference,
          startDate: search.startDate,
          endDate: search.endDate,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
          clients: []
        });
      }
      
      searchGroups.get(key).clients.push(search.newClientId);
    }
    
    console.log(`🔗 ${searchGroups.size} recherches uniques identifiées`);
    
    // 3. Créer les nouvelles entrées Search et SearchClient
    let createdSearches = 0;
    let createdLinks = 0;
    
    for (const [key, data] of searchGroups) {
      // Créer la recherche unique
      const newSearch = await prisma.search.create({
        data: {
          generalReference: data.generalReference,
          detailedReference: data.detailedReference,
          startDate: data.startDate,
          endDate: data.endDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }
      });
      
      createdSearches++;
      
      // Créer les liens avec tous les clients
      for (const clientId of data.clients) {
        await prisma.searchClient.create({
          data: {
            searchId: newSearch.id,
            newClientId: clientId
          }
        });
        createdLinks++;
      }
    }
    
    console.log(`✅ Migration terminée:`);
    console.log(`   - ${createdSearches} recherches créées`);
    console.log(`   - ${createdLinks} liens créés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSearchRelations();
