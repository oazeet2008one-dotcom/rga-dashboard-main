import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugFullApi() {
  try {
    console.log('=== Full API Debug ===');
    
    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant?.id;
    
    // Simulate exact getSeoHistory logic
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('Date range:');
    console.log('Start:', startDate.toISOString());
    console.log('End:', endDate.toISOString());

    // 1. Fetch Organic Data
    const organicData = await prisma.webAnalyticsDaily.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' },
      select: { date: true, sessions: true }
    });
    console.log('Organic data count:', organicData.length);

    // 2. Fetch Offpage Data
    const offpageData = await prisma.seoOffpageMetricSnapshots.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });
    console.log('Offpage data count:', offpageData.length);

    // 3. Create offpage map
    const offpageMap = new Map<string, any>();
    offpageData.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      offpageMap.set(dateStr, {
        backlinks: item.backlinks,
        referringDomains: item.referringDomains,
        keywords: item.keywords,
        trafficCost: item.trafficCost,
        dr: item.dr,
        ur: item.ur,
        organicTrafficValue: item.organicTrafficValue
      });
    });

    // 4. Test mapping for first few dates
    console.log('Mapping test:');
    for (let i = 0; i < Math.min(5, organicData.length); i++) {
      const dateStr = organicData[i].date.toISOString().split('T')[0];
      const offpageForDate = offpageMap.get(dateStr);
      console.log(`  ${dateStr}: organic=${organicData[i].sessions}, offpage=${offpageForDate ? 'FOUND' : 'MISSING'}`);
      if (offpageForDate) {
        console.log(`    backlinks=${offpageForDate.backlinks}, domains=${offpageForDate.referringDomains}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFullApi();
