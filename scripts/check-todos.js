const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.todo.count();
  console.log(`\nNombre total de TODOs: ${count}\n`);
  
  if (count > 0) {
    const todos = await prisma.todo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Derniers TODOs:');
    todos.forEach(todo => {
      console.log(`- ID: ${todo.id}, Tâche: ${todo.taskName}, Statut: ${todo.status}`);
    });
  } else {
    console.log('Aucun TODO trouvé dans la base de données.');
    console.log('Les TODOs sont créés automatiquement lorsque vous validez des tâches dans /tasks');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
