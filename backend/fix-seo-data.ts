import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSeoData() {
  try {
    console.log('=== Fix SEO Data Date Range ===');
    
    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant?.id;
    
    // Generate offpage data for missing dates (2026-01-13)
    const missingDate = new Date('2026-01-13');
    
    const existing = await prisma.seoOffpageMetricSnapshots.findFirst({
      where: { tenantId, date: missingDate }
    });
    
    if (!existing) {
      await prisma.seoOffpageMetricSnapshots.create({
        data: {
          tenantId,
          date: missingDate,
          ur: 21.3 + Math.random() * 5,
          dr: 34.3 + Math.random() * 10,
          backlinks: 500 + Math.floor(Math.random() * 200),
          referringDomains: 200 + Math.floor(Math.random() * 100),
          keywords: 1000 + Math.floor(Math.random() * 500),
          trafficCost: 200000 + Math.floor(Math.random() * 100000),
          organicTraffic: 8000 + Math.floor(Math.random() * 4000),
          organicTrafficValue: 200000 + Math.floor(Math.random() * 100000),
          newReferringDomains: Math.floor(Math.random() * 10),
          newBacklinks: Math.floor(Math.random() * 20),
          lostReferringDomains: Math.floor(Math.random() * 5),
          lostBacklinks: Math.floor(Math.random() * 10)
        }
      });
      console.log('✅ Created offpage data for 2026-01-13');
    } else {
      console.log('ℹ️ Offpage data for 2026-01-13 already exists');
    }
    
    // Generate top keywords for missing dates
    const keywords = [
      'rga marketing', 'seo dashboard', 'marketing analytics', 'performance report',
      'digital marketing agency', 'seo audit', 'keyword research', 'technical seo',
      'backlink analysis', 'organic traffic'
    ];
    
    for (let j = 0; j < keywords.length; j++) {
      const existingKeyword = await prisma.seoTopKeywords.findFirst({
        where: { tenantId, date: missingDate, keyword: keywords[j] }
      });
      
      if (!existingKeyword) {
        await prisma.seoTopKeywords.create({
          data: {
            tenantId,
            date: missingDate,
            keyword: keywords[j],
            position: Math.floor(Math.random() * 50) + 1,
            volume: Math.floor(Math.random() * 10000) + 100,
            traffic: Math.floor(Math.random() * 1000) + 10,
            trafficPercentage: Math.random() * 100,
            url: `https://example.com/page/${j}`,
            change: Math.floor(Math.random() * 20) - 10
          }
        });
      }
    }
    
    console.log('✅ Fixed SEO data date range');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeoData();
