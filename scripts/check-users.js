const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany();

    console.log('Utilisateurs dans la base de données:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username || 'N/A'}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });

    // Mettre à jour le username s'il est null
    for (const user of users) {
      if (!user.username) {
        const newUsername = user.email.split('@')[0];
        await prisma.user.update({
          where: { id: user.id },
          data: { username: newUsername }
        });
        console.log(`✅ Username mis à jour pour ${user.email}: ${newUsername}`);
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
