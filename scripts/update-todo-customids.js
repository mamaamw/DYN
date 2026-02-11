/**
 * Script pour mettre à jour les customId des TODOs existants
 * en utilisant les positions stockées dans ContactIdentifier
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTodoCustomIds() {
  try {
    console.log('🔄 Mise à jour des customId des TODOs...\n');

    // Récupérer tous les TODOs sans customId
    const todos = await prisma.todo.findMany({
      where: {
        OR: [
          { customId: null },
          { customId: '' }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        contactId: true,
        taskName: true
      }
    });

    console.log(`📊 Trouvé ${todos.length} TODOs sans customId\n`);

    if (todos.length === 0) {
      console.log('✨ Tous les TODOs ont déjà un customId!');
      return;
    }

    let updated = 0;
    let notFound = 0;

    for (const todo of todos) {
      // Récupérer le contact avec le client et la position
      const contact = await prisma.contactIdentifier.findUnique({
        where: { id: todo.contactId },
        include: {
          newClient: {
            select: {
              id: true,
              createdAt: true
            }
          }
        }
      });

      if (!contact) {
        console.log(`⚠️  TODO ${todo.id} - Contact ${todo.contactId} introuvable (peut-être supprimé)`);
        notFound++;
        continue;
      }

      // Générer le customId
      const year = new Date(contact.newClient.createdAt).getFullYear().toString().slice(-2);
      const position = contact.position || 1;
      const customId = `${year}-${contact.newClient.id}-${position}`;

      // Mettre à jour le TODO
      await prisma.todo.update({
        where: { id: todo.id },
        data: { customId }
      });

      console.log(`✅ TODO ${todo.id} (Contact ${todo.contactId}) - customId défini: ${customId}`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Mise à jour terminée!`);
    console.log(`   TODOs mis à jour: ${updated}`);
    console.log(`   Contacts introuvables: ${notFound}`);
    console.log(`   Total traité: ${updated + notFound}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTodoCustomIds()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Le script a échoué:', error);
    process.exit(1);
  });
