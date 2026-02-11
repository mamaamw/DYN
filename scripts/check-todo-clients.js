const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTodoClients() {
  try {
    console.log('Vérification des relations Todo -> NewClient...\n');

    // Récupérer tous les todos
    const todos = await prisma.todo.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        contactId: true,
        taskName: true,
        client: {
          select: {
            id: true,
            priority: true,
            firstName: true,
            nickname: true
          }
        }
      }
    });

    console.log(`Total Todos: ${todos.length}`);

    const withClient = todos.filter(t => t.client !== null);
    const withoutClient = todos.filter(t => t.client === null);

    console.log(`Todos avec client valide: ${withClient.length}`);
    console.log(`Todos sans client valide: ${withoutClient.length}\n`);

    if (withClient.length > 0) {
      console.log('Exemples de todos AVEC client:');
      withClient.slice(0, 3).forEach(t => {
        console.log(`  - Todo #${t.id} (contactId: ${t.contactId}): ${t.taskName}`);
        console.log(`    Client: ${t.client.firstName || t.client.nickname || 'Sans nom'}, Priorité: ${t.client.priority}`);
      });
      console.log('');
    }

    if (withoutClient.length > 0) {
      console.log('Exemples de todos SANS client:');
      withoutClient.slice(0, 5).forEach(t => {
        console.log(`  - Todo #${t.id} (contactId: ${t.contactId}): ${t.taskName}`);
      });
      console.log('');

      // Vérifier si ces contactId existent dans NewClient
      const invalidContactIds = [...new Set(withoutClient.map(t => t.contactId))];
      console.log(`ContactId uniques invalides: ${invalidContactIds.join(', ')}`);

      // Vérifier tous les clients existants
      const allClients = await prisma.newClient.findMany({
        select: { id: true, firstName: true, nickname: true }
      });
      console.log(`\nTotal NewClients: ${allClients.length}`);
      
      if (allClients.length > 0) {
        console.log('Premiers clients existants:');
        allClients.slice(0, 5).forEach(c => {
          console.log(`  - Client #${c.id}: ${c.firstName || c.nickname || 'Sans nom'}`);
        });
      }
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodoClients();
