const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { username: 'admin' } });
    console.log('User:', user);
  } catch (e) {
    console.error('Error:', e.code, e.message, e.meta);
  } finally {
    await prisma.$disconnect();
  }
}

main();
