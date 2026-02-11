const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Un administrateur existe déjà:', existingAdmin.username);
      return;
    }

    // Créer un mot de passe hashé
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Créer l'utilisateur admin
    const now = new Date();
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@dyn.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'DYN',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        lastLogin: now,
        updatedAt: now,
      },
    });

    console.log('✅ Administrateur créé avec succès!');
    console.log('Nom d\'utilisateur: admin');
    console.log('Mot de passe: Admin@123');
    console.log('Email:', admin.email);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
