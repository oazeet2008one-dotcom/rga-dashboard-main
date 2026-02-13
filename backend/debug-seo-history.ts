import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSeoHistory() {
  try {
    console.log('=== SEO History Debug ===');
    
    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant?.id;
    console.log('Tenant ID:', tenantId);
    
    // Check date range for getSeoHistory (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log('Date range for getSeoHistory:');
    console.log('Start:', startDate.toISOString().split('T')[0]);
    console.log('End:', endDate.toISOString().split('T')[0]);
    
    // Check offpage data in this range
    const offpageData = await prisma.seoOffpageMetricSnapshots.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' },
      select: { date: true, backlinks: true, referringDomains: true, keywords: true }
    });
    
    console.log('Offpage data in 30-day range:', offpageData.length);
    offpageData.forEach(item => {
      console.log(`  ${item.date.toISOString().split('T')[0]}: backlinks=${item.backlinks}, domains=${item.referringDomains}, keywords=${item.keywords}`);
    });
    
    // Check all offpage data
    const allOffpage = await prisma.seoOffpageMetricSnapshots.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 10,
      select: { date: true, backlinks: true, referringDomains: true, keywords: true }
    });
    
    console.log('Latest 10 offpage records:');
    allOffpage.forEach(item => {
      console.log(`  ${item.date.toISOString().split('T')[0]}: backlinks=${item.backlinks}, domains=${item.referringDomains}, keywords=${item.keywords}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSeoHistory();
