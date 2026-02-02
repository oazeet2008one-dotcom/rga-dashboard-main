require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const tenantId = 'e12c103c-e2a8-49b1-b440-6a073cdb2a3b';
    const siteUrl = 'sc-domain:demo-domain.com';
    
    // Test GSC aggregation directly
    console.log('📊 Testing GSC data aggregation...');
    const gscAgg = await prisma.searchConsolePerformance.aggregate({
      where: { tenantId, siteUrl, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true },
    });
    
    console.log('GSC Aggregation:', {
      totalClicks: gscAgg._sum.clicks || 0,
      totalImpressions: gscAgg._sum.impressions || 0,
      avgPosition: gscAgg._avg.position || 0,
    });
    
    // Test GA4 aggregation directly
    console.log('\n📈 Testing GA4 data aggregation...');
    const ga4Agg = await prisma.webAnalyticsDaily.aggregate({
      where: { tenantId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { activeUsers: true, sessions: true, screenPageViews: true },
      _avg: { engagementRate: true, bounceRate: true, avgSessionDuration: true },
    });
    
    console.log('GA4 Aggregation:', {
      totalActiveUsers: ga4Agg._sum.activeUsers || 0,
      totalSessions: ga4Agg._sum.sessions || 0,
      totalPageViews: ga4Agg._sum.screenPageViews || 0,
      avgEngagementRate: ga4Agg._avg.engagementRate || 0,
      avgBounceRate: ga4Agg._avg.bounceRate || 0,
      avgSessionDuration: ga4Agg._avg.avgSessionDuration || 0,
    });
    
    // Test top queries
    console.log('\n🔍 Testing top queries...');
    const topQueries = await prisma.searchConsolePerformance.groupBy({
      by: ['query'],
      where: { 
        tenantId, 
        siteUrl, 
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        query: { not: null } 
      },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 5,
    });
    
    console.log('Top 5 Queries:');
    topQueries.forEach((q, i) => {
      console.log(`${i + 1}. ${q.query}: ${q._sum.clicks} clicks, ${q._sum.impressions} impressions`);
    });
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
