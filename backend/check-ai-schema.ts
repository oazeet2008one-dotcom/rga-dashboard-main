import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAiInsightSchema() {
  try {
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ai_insights' 
      ORDER BY ordinal_position
    `;
    console.log('AI Insights table schema:');
    console.log(schema);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAiInsightSchema();
