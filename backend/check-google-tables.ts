import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoogleAssistantTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%google%' OR table_name LIKE '%assistant%' OR table_name LIKE '%ai%')
    `;
    console.log('Tables related to Google Assistant:');
    console.log(tables);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoogleAssistantTables();
