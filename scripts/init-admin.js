const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier s'il y a déjà des utilisateurs
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('Des utilisateurs existent déjà dans la base. Aucun admin créé.');
      return;
    }

    const roles = [
      'ADMIN', 'MANAGER', 'SHARK', 'GESTIONAIRE', 'JELLY', 'USER', 'VIEWER'
    ];
    const now = new Date();
    for (const role of roles) {
      const username = role.charAt(0) + role.slice(1).toLowerCase();
      const password = `${username}@123`;
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `${username.toLowerCase()}@dyn.com`;
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName: username,
          lastName: 'DYN',
          role,
          isActive: true,
          emailVerified: true,
          lastLogin: now,
          updatedAt: now,
        },
      });
      console.log(`✅ Utilisateur ${role} créé: ${username} / ${password}`);
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
