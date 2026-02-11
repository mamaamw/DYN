/**
 * Script pour vérifier les customId dans les TODOs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTodoIds() {
  try {
    console.log('🔍 Vérification des customId dans les TODOs...\n');

    const todos = await prisma.todo.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        contactId: true,
        customId: true,
        taskName: true,
        accountNumber: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`📊 Trouvé ${todos.length} TODOs actifs\n`);

    if (todos.length === 0) {
      console.log('Aucun TODO trouvé.');
      return;
    }

    console.log('ID TODO | Contact ID | Custom ID    | Tâche');
    console.log('-'.repeat(70));
    
    todos.forEach(todo => {
      console.log(
        `${String(todo.id).padEnd(8)} | ${String(todo.contactId).padEnd(10)} | ${(todo.customId || 'NULL').padEnd(12)} | ${todo.taskName}`
      );
    });

    // Vérifier les contacts correspondants
    console.log('\n\n🔍 Vérification des contacts correspondants...\n');
    
    const contactIds = [...new Set(todos.map(t => t.contactId))];
    const contacts = await prisma.contactIdentifier.findMany({
      where: {
        id: { in: contactIds }
      },
      include: {
        newClient: {
          select: {
            id: true,
            createdAt: true
          }
        }
      }
    });

    console.log('Contact ID | Position | Client ID | Année | Format attendu');
    console.log('-'.repeat(70));

    contacts.forEach(contact => {
      const year = new Date(contact.newClient.createdAt).getFullYear().toString().slice(-2);
      const expectedId = `${year}-${contact.newClient.id}-${contact.position || '?'}`;
      console.log(
        `${String(contact.id).padEnd(10)} | ${String(contact.position || 'NULL').padEnd(8)} | ${String(contact.newClient.id).padEnd(9)} | ${year.padEnd(5)} | ${expectedId}`
      );
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkTodoIds()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Le script a échoué:', error);
    process.exit(1);
  });
