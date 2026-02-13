import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSeoApi() {
  try {
    console.log('=== Test SEO API Logic ===');
    
    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant?.id;
    
    // Simulate getSeoHistory logic
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('Date range:');
    console.log('Start:', startDate.toISOString().split('T')[0]);
    console.log('End:', endDate.toISOString().split('T')[0]);

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
    if (organicData.length > 0) {
      console.log('Sample organic:', organicData[0]);
    }

    // 2. Fetch Offpage Data
    const offpageData = await prisma.seoOffpageMetricSnapshots.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });
    console.log('Offpage data count:', offpageData.length);
    if (offpageData.length > 0) {
      console.log('Sample offpage:', {
        date: offpageData[0].date,
        backlinks: offpageData[0].backlinks,
        referringDomains: offpageData[0].referringDomains,
        keywords: offpageData[0].keywords
      });
    }

    // 3. Test mapping logic
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

    // Test first organic data mapping
    if (organicData.length > 0) {
      const firstDate = organicData[0].date.toISOString().split('T')[0];
      const offpageForDate = offpageMap.get(firstDate);
      console.log('Mapping test for date:', firstDate);
      console.log('Organic sessions:', organicData[0].sessions);
      console.log('Offpage data:', offpageForDate);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSeoApi();
