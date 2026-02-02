require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const t = await prisma.tenant.findFirst({ select: { id: true, name: true } });
    console.log('First tenant:', t);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
