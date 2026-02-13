import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAiInsights() {
  try {
    const data = await prisma.aiInsight.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('AI Insights data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAiInsights();
