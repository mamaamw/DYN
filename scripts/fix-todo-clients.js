const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTodoClients() {
  try {
    console.log('Correction des relations Todo -> NewClient...\n');

    // Récupérer le premier client valide
    const firstClient = await prisma.newClient.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' }
    });

    if (!firstClient) {
      console.log('Aucun client trouvé. Impossible de corriger les todos.');
      return;
    }

    console.log(`Client de référence trouvé: #${firstClient.id} - ${firstClient.firstName || firstClient.nickname || 'Sans nom'}`);
    console.log(`Priorité: ${firstClient.priority}\n`);

    // Récupérer tous les IDs de clients valides
    const validClientIds = await prisma.newClient.findMany({
      where: { deletedAt: null },
      select: { id: true }
    });
    const validIds = validClientIds.map(c => c.id);

    // Trouver tous les todos avec contactId invalide
    const todos = await prisma.todo.findMany({
      where: { 
        deletedAt: null,
        contactId: { notIn: validIds }
      },
      select: {
        id: true,
        contactId: true,
        taskName: true
      }
    });

    console.log(`Todos à corriger: ${todos.length}\n`);

    if (todos.length === 0) {
      console.log('Aucun todo à corriger !');
      return;
    }

    todos.forEach(t => {
      console.log(`  - Todo #${t.id} (contactId invalide: ${t.contactId}): ${t.taskName}`);
    });

    // Si l'argument confirm est passé, on applique les changements
    if (process.argv[2] === 'confirm') {
      console.log('\nApplication des corrections...');
      
      const result = await prisma.todo.updateMany({
        where: {
          deletedAt: null,
          contactId: { notIn: validIds }
        },
        data: {
          contactId: firstClient.id
        }
      });

      console.log(`✅ ${result.count} todos mis à jour avec succès !`);
      
      // Vérification
      const todosWithClient = await prisma.todo.findMany({
        where: { 
          deletedAt: null,
          id: { in: todos.map(t => t.id) }
        },
        include: {
          client: {
            select: { priority: true, firstName: true, nickname: true }
          }
        }
      });

      console.log('\nVérification après correction:');
      todosWithClient.forEach(t => {
        console.log(`  - Todo #${t.id}: ${t.taskName}`);
        console.log(`    Client: ${t.client?.firstName || t.client?.nickname || 'Sans nom'}, Priorité: ${t.client?.priority}`);
      });
    } else {
      console.log('\n⚠️  Pour appliquer ces corrections, exécutez:');
      console.log('node scripts/fix-todo-clients.js confirm');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTodoClients();
