/**
 * Script de migration pour attribuer une position permanente à tous les contacts existants
 * Cette position sera basée sur l'ordre de création des contacts pour chaque client
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateContactPositions() {
  try {
    console.log('🔄 Démarrage de la migration des positions de contact...\n');

    // Récupérer tous les clients avec leurs contacts
    const clients = await prisma.newClient.findMany({
      include: {
        contactIdentifiers: {
          orderBy: { id: 'asc' } // Trier par ID pour maintenir l'ordre
        }
      }
    });

    console.log(`📊 Trouvé ${clients.length} clients\n`);

    let totalUpdated = 0;
    let totalAlreadySet = 0;

    for (const client of clients) {
      const contacts = client.contactIdentifiers;
      
      if (contacts.length === 0) {
        console.log(`⏭️  Client ${client.id} - Aucun contact, ignoré`);
        continue;
      }

      console.log(`\n📝 Client ${client.id} - ${contacts.length} contact(s)`);

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const position = i + 1; // Position basée sur l'ordre de création

        if (contact.position !== null) {
          console.log(`   ℹ️  Contact ${contact.id} a déjà une position: ${contact.position}`);
          totalAlreadySet++;
          continue;
        }

        // Mettre à jour la position
        await prisma.contactIdentifier.update({
          where: { id: contact.id },
          data: { position }
        });

        console.log(`   ✅ Contact ${contact.id} - Position définie: ${position}`);
        totalUpdated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Migration terminée avec succès!`);
    console.log(`   Contacts mis à jour: ${totalUpdated}`);
    console.log(`   Contacts déjà configurés: ${totalAlreadySet}`);
    console.log(`   Total: ${totalUpdated + totalAlreadySet}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateContactPositions()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Le script a échoué:', error);
    process.exit(1);
  });
