/**
 * Script pour afficher tous les customId générés dans Panda
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAllCustomIds() {
  try {
    console.log('🔍 Affichage de tous les customId dans Panda...\n');

    const contacts = await prisma.contactIdentifier.findMany({
      include: {
        newClient: {
          select: {
            id: true,
            firstName: true,
            surname: true,
            nickname: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Trouvé ${contacts.length} contacts\n`);

    console.log('Contact ID | Position | Client ID | Année | Custom ID | Account Number | Client');
    console.log('-'.repeat(100));

    contacts.forEach(contact => {
      const year = new Date(contact.newClient.createdAt).getFullYear().toString().slice(-2);
      const position = contact.position || '?';
      const customId = `${year}-${contact.newClient.id}-${position}`;
      const clientName = contact.newClient.nickname || 
                         `${contact.newClient.firstName || ''} ${contact.newClient.surname || ''}`.trim() ||
                         'Sans nom';
      
      console.log(
        `${String(contact.id).padEnd(10)} | ${String(position).padEnd(8)} | ${String(contact.newClient.id).padEnd(9)} | ${year.padEnd(5)} | ${customId.padEnd(9)} | ${contact.accountNumber.padEnd(14)} | ${clientName}`
      );
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

showAllCustomIds()
  .then(() => {
    console.log('\n✅ Affichage terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Le script a échoué:', error);
    process.exit(1);
  });
