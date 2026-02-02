require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const cnt = await prisma.searchConsolePerformance.count();
    console.log('search_console_performance rows:', cnt);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
