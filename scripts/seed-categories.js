const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: 'SUPPORT',
    label: 'Support',
    description: 'Équipe de support client',
    color: 'blue',
    icon: '🛟',
  },
  {
    name: 'SALES',
    label: 'Ventes',
    description: 'Équipe commerciale',
    color: 'green',
    icon: '💰',
  },
  {
    name: 'DEVELOPMENT',
    label: 'Développement',
    description: 'Équipe de développement',
    color: 'purple',
    icon: '💻',
  },
  {
    name: 'MANAGEMENT',
    label: 'Management',
    description: 'Équipe de direction',
    color: 'orange',
    icon: '👔',
  },
  {
    name: 'MARKETING',
    label: 'Marketing',
    description: 'Équipe marketing',
    color: 'pink',
    icon: '📢',
  },
  {
    name: 'HR',
    label: 'Ressources Humaines',
    description: 'Équipe RH',
    color: 'teal',
    icon: '👥',
  },
];

async function seedCategories() {
  console.log('🌱 Initialisation des catégories...\n');

  try {
    for (const category of defaultCategories) {
      const existing = await prisma.category.findUnique({
        where: { name: category.name },
      });

      if (!existing) {
        await prisma.category.create({
          data: category,
        });
        console.log(`✅ Catégorie créée: ${category.label}`);
      } else {
        console.log(`⏭️  Catégorie existe déjà: ${category.label}`);
      }
    }

    console.log('\n✨ Initialisation des catégories terminée !');
    
    const count = await prisma.category.count();
    console.log(`📊 Total de catégories en base: ${count}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
