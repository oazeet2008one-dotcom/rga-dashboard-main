import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCPC() {
  try {
    const keywords = await prisma.seoTopKeywords.findMany({
      take: 5,
      select: { keyword: true, position: true, volume: true }
    });
    console.log('SEO Top Keywords CPC data:');
    console.log(JSON.stringify(keywords, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCPC();
