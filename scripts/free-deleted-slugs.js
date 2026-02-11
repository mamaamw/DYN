const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function freeDeletedSlugs() {
  try {
    console.log('🔍 Recherche des clients supprimés avec des slugs...\n');

    // Trouver tous les clients supprimés
    const deletedClients = await prisma.newClient.findMany({
      where: {
        deletedAt: {
          not: null
        },
        slug: {
          not: null
        }
      },
      select: {
        id: true,
        slug: true,
        nickname: true,
        firstName: true,
        deletedAt: true
      }
    });

    console.log(`📊 ${deletedClients.length} clients supprimés trouvés avec des slugs\n`);

    if (deletedClients.length === 0) {
      console.log('✅ Aucun slug à libérer');
      return;
    }

    // Afficher les clients trouvés
    deletedClients.forEach(client => {
      console.log(`   #${client.id}: "${client.slug}" (${client.nickname || client.firstName || 'Sans nom'}) - Supprimé le ${client.deletedAt?.toLocaleDateString()}`);
    });

    console.log('\n⚠️  Les slugs vont être modifiés pour permettre leur réutilisation\n');

    // Si argument 'confirm' n'est pas passé, ne pas appliquer
    if (!process.argv.includes('confirm')) {
      console.log('ℹ️  Pour appliquer ces changements, exécutez:');
      console.log('   node scripts/free-deleted-slugs.js confirm\n');
      return;
    }

    console.log('🔄 Application des modifications...\n');

    let updated = 0;
    for (const client of deletedClients) {
      // Ajouter un suffixe au slug pour le libérer
      const newSlug = `${client.slug}_deleted_${client.id}`;
      
      await prisma.newClient.update({
        where: { id: client.id },
        data: { slug: newSlug }
      });

      console.log(`   ✓ #${client.id}: "${client.slug}" → "${newSlug}"`);
      updated++;
    }

    console.log(`\n✅ ${updated} slugs libérés avec succès!`);
    console.log('💡 Vous pouvez maintenant réutiliser ces nicknames pour de nouveaux clients\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

freeDeletedSlugs();
