const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.newClient.findMany({
    where: {
      deletedAt: null,
      OR: [
        { nickname: { contains: 'test', mode: 'insensitive' } },
        { surname: { contains: 'test', mode: 'insensitive' } },
        { firstName: { contains: 'test', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      nickname: true,
      firstName: true,
      surname: true
    },
    take: 10
  });
  
  console.log('=== Clients avec TEST ===');
  console.log(JSON.stringify(clients, null, 2));
  console.log('\nNombre total:', clients.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Erreur:', err.message);
    prisma.$disconnect();
    process.exit(1);
  });
