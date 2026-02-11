const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding currencies...');

  // Créer Bitcoin comme devise par défaut
  const btc = await prisma.currency.upsert({
    where: { code: 'BTC' },
    update: {},
    create: {
      code: 'BTC',
      name: 'Bitcoin',
      symbol: '₿',
      isDefault: true,
      isActive: true
    }
  });

  console.log('Created Bitcoin:', btc);

  // Créer les autres devises
  const currencies = [
    // Devises fiat principales
    { code: 'EUR', name: 'Euro', symbol: '€', isDefault: false, isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', isDefault: false, isActive: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', isDefault: false, isActive: true },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: false, isActive: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', isDefault: false, isActive: true },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', isDefault: false, isActive: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isDefault: false, isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', isDefault: false, isActive: true },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', isDefault: false, isActive: true },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', isDefault: false, isActive: true },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', isDefault: false, isActive: true },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', isDefault: false, isActive: true },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', isDefault: false, isActive: true },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', isDefault: false, isActive: true },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', isDefault: false, isActive: true },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', isDefault: false, isActive: true },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', isDefault: false, isActive: true },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', isDefault: false, isActive: true },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', isDefault: false, isActive: true },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', isDefault: false, isActive: true },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', isDefault: false, isActive: true },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', isDefault: false, isActive: true },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', isDefault: false, isActive: true },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', isDefault: false, isActive: true },
    
    // Cryptomonnaies principales
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', isDefault: false, isActive: true },
    { code: 'USDT', name: 'Tether', symbol: '₮', isDefault: false, isActive: true },
    { code: 'USDC', name: 'USD Coin', symbol: 'USDC', isDefault: false, isActive: true },
    { code: 'BNB', name: 'Binance Coin', symbol: 'BNB', isDefault: false, isActive: true },
    { code: 'XRP', name: 'Ripple', symbol: 'XRP', isDefault: false, isActive: true },
    { code: 'ADA', name: 'Cardano', symbol: '₳', isDefault: false, isActive: true },
    { code: 'SOL', name: 'Solana', symbol: '◎', isDefault: false, isActive: true },
    { code: 'DOT', name: 'Polkadot', symbol: 'DOT', isDefault: false, isActive: true },
    { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', isDefault: false, isActive: true },
    { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX', isDefault: false, isActive: true },
    { code: 'MATIC', name: 'Polygon', symbol: 'MATIC', isDefault: false, isActive: true },
    { code: 'LTC', name: 'Litecoin', symbol: 'Ł', isDefault: false, isActive: true },
    { code: 'UNI', name: 'Uniswap', symbol: 'UNI', isDefault: false, isActive: true },
    { code: 'LINK', name: 'Chainlink', symbol: 'LINK', isDefault: false, isActive: true },
    { code: 'XLM', name: 'Stellar', symbol: 'XLM', isDefault: false, isActive: true },
    { code: 'ATOM', name: 'Cosmos', symbol: 'ATOM', isDefault: false, isActive: true },
    { code: 'XMR', name: 'Monero', symbol: 'XMR', isDefault: false, isActive: true },
    { code: 'ALGO', name: 'Algorand', symbol: 'ALGO', isDefault: false, isActive: true },
    { code: 'BCH', name: 'Bitcoin Cash', symbol: 'BCH', isDefault: false, isActive: true },
    { code: 'TRX', name: 'TRON', symbol: 'TRX', isDefault: false, isActive: true }
  ];

  for (const currency of currencies) {
    const created = await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency
    });
    console.log('Created currency:', created);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
