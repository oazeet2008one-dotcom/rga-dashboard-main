import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOffpageData() {
  try {
    const data = await prisma.seoOffpageMetricSnapshots.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      select: { date: true, backlinks: true, referringDomains: true }
    });
    console.log('SEO Offpage Metric Snapshots:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOffpageData();
