const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    name: 'entreprise',
    label: 'Entreprise',
    description: 'Clients entreprises et sociétés',
    color: 'blue',
    icon: 'building'
  },
  {
    name: 'particulier',
    label: 'Particulier',
    description: 'Clients particuliers et individuels',
    color: 'green',
    icon: 'user'
  },
  {
    name: 'freelance',
    label: 'Freelance',
    description: 'Travailleurs indépendants et consultants',
    color: 'purple',
    icon: 'briefcase'
  },
  {
    name: 'association',
    label: 'Association',
    description: 'Associations et organisations à but non lucratif',
    color: 'orange',
    icon: 'users'
  },
  {
    name: 'startup',
    label: 'Startup',
    description: 'Jeunes entreprises et startups',
    color: 'red',
    icon: 'rocket'
  },
  {
    name: 'grand_compte',
    label: 'Grand Compte',
    description: 'Grandes entreprises et multinationales',
    color: 'indigo',
    icon: 'office-building'
  },
  {
    name: 'pme',
    label: 'PME/PMI',
    description: 'Petites et moyennes entreprises',
    color: 'yellow',
    icon: 'home'
  },
  {
    name: 'international',
    label: 'International',
    description: 'Clients internationaux et export',
    color: 'teal',
    icon: 'globe'
  }
];

async function createCategories() {
  try {
    console.log('🔄 Création des catégories...\n');
    
    // Créer les catégories
    const createdCategories = [];
    for (const category of categories) {
      try {
        const created = await prisma.category.create({
          data: category
        });
        createdCategories.push(created);
        console.log(`✅ Catégorie créée: ${created.label} (${created.name})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Catégorie déjà existante: ${category.label}`);
          // Récupérer la catégorie existante
          const existing = await prisma.category.findUnique({
            where: { name: category.name }
          });
          if (existing) {
            createdCategories.push(existing);
          }
        } else {
          console.error(`❌ Erreur lors de la création de ${category.label}:`, error.message);
        }
      }
    }

    console.log(`\n📊 ${createdCategories.length} catégories disponibles\n`);

    // Récupérer l'utilisateur Admin
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'Admin@dyn.com' },
          { username: 'Admin' }
        ]
      }
    });

    if (!adminUser) {
      console.error('❌ Utilisateur Admin non trouvé');
      return;
    }

    console.log(`👤 Utilisateur Admin trouvé: ${adminUser.username} (ID: ${adminUser.id})\n`);

    // Assigner toutes les catégories à l'Admin
    console.log('🔄 Attribution des catégories à l\'Admin...\n');
    
    for (const category of createdCategories) {
      try {
        await prisma.userCategory.create({
          data: {
            userId: adminUser.id,
            categoryId: category.id
          }
        });
        console.log(`✅ Catégorie "${category.label}" assignée à l'Admin`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Catégorie "${category.label}" déjà assignée à l'Admin`);
        } else {
          console.error(`❌ Erreur lors de l'assignation de ${category.label}:`, error.message);
        }
      }
    }

    // Vérifier les assignations
    console.log('\n🔍 Vérification des assignations...\n');
    
    const userCategories = await prisma.userCategory.findMany({
      where: { userId: adminUser.id },
      include: { category: true }
    });

    console.log(`📈 L'Admin a accès à ${userCategories.length} catégories:`);
    userCategories.forEach(uc => {
      console.log(`   • ${uc.category.label} (${uc.category.name})`);
    });

    console.log('\n✅ Configuration des catégories terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCategories();