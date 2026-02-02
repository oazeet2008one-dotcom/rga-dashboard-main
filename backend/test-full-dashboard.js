require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const tenantId = 'e12c103c-e2a8-49b1-b440-6a073cdb2a3b';
    const siteUrl = 'sc-domain:demo-domain.com';
    
    console.log('📊 Testing Full Dashboard Data...\n');
    
    // 1. Campaign Performance Summary
    console.log('🚀 CAMPAIGN PERFORMANCE:');
    const campaignSummary = await prisma.campaign.aggregate({
      where: { tenantId },
      _count: { id: true },
      _sum: { budget: true },
      _avg: { budget: true }
    });
    console.log(`- Total Campaigns: ${campaignSummary._count.id}`);
    console.log(`- Total Budget: ฿${campaignSummary._sum.budget?.toFixed(2) || 0}`);
    console.log(`- Avg Budget: ฿${campaignSummary._avg.budget?.toFixed(2) || 0}`);
    
    // 2. Ad Groups Summary
    const adGroupSummary = await prisma.adGroup.aggregate({
      where: { tenantId },
      _count: { id: true },
      _sum: { budget: true },
      _avg: { bidAmount: true }
    });
    console.log(`\n📱 AD GROUPS:`);
    console.log(`- Total Ad Groups: ${adGroupSummary._count.id}`);
    console.log(`- Total Budget: ฿${adGroupSummary._sum.budget?.toFixed(2) || 0}`);
    console.log(`- Avg Bid: ฿${adGroupSummary._avg.bidAmount?.toFixed(2) || 0}`);
    
    // 3. Metrics Summary (Last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const metricsSummary = await prisma.metric.aggregate({
      where: { 
        tenantId, 
        date: { gte: thirtyDaysAgo },
        isMockData: true 
      },
      _sum: { 
        impressions: true, 
        clicks: true, 
        conversions: true, 
        spend: true, 
        revenue: true 
      },
      _avg: { 
        ctr: true, 
        conversionRate: true, 
        roas: true,
        bounceRate: true,
        avgSessionDuration: true
      }
    });
    
    console.log(`\n📈 ADVERTISING METRICS (Last 30 days):`);
    console.log(`- Impressions: ${metricsSummary._sum.impressions?.toLocaleString() || 0}`);
    console.log(`- Clicks: ${metricsSummary._sum.clicks?.toLocaleString() || 0}`);
    console.log(`- Conversions: ${metricsSummary._sum.conversions?.toLocaleString() || 0}`);
    console.log(`- Spend: ฿${metricsSummary._sum.spend?.toFixed(2) || 0}`);
    console.log(`- Revenue: ฿${metricsSummary._sum.revenue?.toFixed(2) || 0}`);
    console.log(`- Avg CTR: ${metricsSummary._avg.ctr?.toFixed(2) || 0}%`);
    console.log(`- Avg Conversion Rate: ${metricsSummary._avg.conversionRate?.toFixed(2) || 0}%`);
    console.log(`- Avg ROAS: ${metricsSummary._avg.roas?.toFixed(2) || 0}`);
    console.log(`- Avg Bounce Rate: ${metricsSummary._avg.bounceRate?.toFixed(2) || 0}%`);
    console.log(`- Avg Session Duration: ${metricsSummary._avg.avgSessionDuration || 0}s`);
    
    // 4. GSC Summary (Last 30 days)
    const gscSummary = await prisma.searchConsolePerformance.aggregate({
      where: { 
        tenantId, 
        siteUrl, 
        date: { gte: thirtyDaysAgo }
      },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      _count: { id: true }
    });
    
    console.log(`\n🔍 SEO (GSC) METRICS (Last 30 days):`);
    console.log(`- Total Rows: ${gscSummary._count.id}`);
    console.log(`- Clicks: ${gscSummary._sum.clicks?.toLocaleString() || 0}`);
    console.log(`- Impressions: ${gscSummary._sum.impressions?.toLocaleString() || 0}`);
    console.log(`- Avg CTR: ${gscSummary._avg.ctr?.toFixed(2) || 0}%`);
    console.log(`- Avg Position: ${gscSummary._avg.position?.toFixed(1) || 0}`);
    
    // 5. GA4 Summary (Last 30 days)
    const ga4Summary = await prisma.webAnalyticsDaily.aggregate({
      where: { 
        tenantId, 
        date: { gte: thirtyDaysAgo },
        isMockData: true 
      },
      _sum: { 
        activeUsers: true, 
        newUsers: true, 
        sessions: true, 
        screenPageViews: true 
      },
      _avg: { 
        engagementRate: true, 
        bounceRate: true, 
        avgSessionDuration: true 
      },
      _count: { id: true }
    });
    
    console.log(`\n📊 WEB ANALYTICS (GA4) METRICS (Last 30 days):`);
    console.log(`- Days with Data: ${ga4Summary._count.id}`);
    console.log(`- Total Active Users: ${ga4Summary._sum.activeUsers?.toLocaleString() || 0}`);
    console.log(`- Total New Users: ${ga4Summary._sum.newUsers?.toLocaleString() || 0}`);
    console.log(`- Total Sessions: ${ga4Summary._sum.sessions?.toLocaleString() || 0}`);
    console.log(`- Total Page Views: ${ga4Summary._sum.screenPageViews?.toLocaleString() || 0}`);
    console.log(`- Avg Engagement Rate: ${(ga4Summary._avg.engagementRate * 100)?.toFixed(1) || 0}%`);
    console.log(`- Avg Bounce Rate: ${(ga4Summary._avg.bounceRate * 100)?.toFixed(1) || 0}%`);
    console.log(`- Avg Session Duration: ${ga4Summary._avg.avgSessionDuration || 0}s`);
    
    // 6. Top Performing Campaigns
    const topCampaigns = await prisma.metric.groupBy({
      by: ['campaignId'],
      where: { 
        tenantId, 
        date: { gte: thirtyDaysAgo },
        isMockData: true 
      },
      _sum: { 
        clicks: true, 
        conversions: true, 
        spend: true, 
        revenue: true 
      },
      orderBy: { _sum: { revenue: 'desc' } },
      take: 3
    });
    
    console.log(`\n🏆 TOP 3 CAMPAIGNS BY REVENUE (Last 30 days):`);
    for (let i = 0; i < topCampaigns.length; i++) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: topCampaigns[i].campaignId },
        select: { name: true, platform: true }
      });
      console.log(`${i + 1}. ${campaign?.name} (${campaign?.platform})`);
      console.log(`   Revenue: ฿${topCampaigns[i]._sum.revenue?.toFixed(2) || 0}`);
      console.log(`   Conversions: ${topCampaigns[i]._sum.conversions || 0}`);
      console.log(`   ROAS: ${topCampaigns[i]._sum.spend && topCampaigns[i]._sum.spend > 0 ? (topCampaigns[i]._sum.revenue / topCampaigns[i]._sum.spend).toFixed(2) : 'N/A'}`);
    }
    
    // 7. Platform Performance
    const platformPerformance = await prisma.metric.groupBy({
      by: ['platform'],
      where: { 
        tenantId, 
        date: { gte: thirtyDaysAgo },
        isMockData: true 
      },
      _sum: { 
        impressions: true, 
        clicks: true, 
        conversions: true, 
        spend: true, 
        revenue: true 
      },
      _avg: { ctr: true, conversionRate: true, roas: true }
    });
    
    console.log(`\n📱 PLATFORM PERFORMANCE (Last 30 days):`);
    platformPerformance.forEach(platform => {
      console.log(`${platform.platform}:`);
      console.log(`  - Impressions: ${platform._sum.impressions?.toLocaleString() || 0}`);
      console.log(`  - Clicks: ${platform._sum.clicks?.toLocaleString() || 0}`);
      console.log(`  - Conversions: ${platform._sum.conversions?.toLocaleString() || 0}`);
      console.log(`  - Spend: ฿${platform._sum.spend?.toFixed(2) || 0}`);
      console.log(`  - Revenue: ฿${platform._sum.revenue?.toFixed(2) || 0}`);
      console.log(`  - ROAS: ${platform._avg.roas?.toFixed(2) || 0}`);
    });
    
    // 8. Growth Rates (Compare last 30 days vs previous 30 days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriod = await prisma.metric.aggregate({
      where: { 
        tenantId, 
        date: { 
          gte: sixtyDaysAgo, 
          lt: thirtyDaysAgo 
        },
        isMockData: true 
      },
      _sum: { 
        impressions: true, 
        clicks: true, 
        conversions: true, 
        spend: true, 
        revenue: true 
      }
    });
    
    console.log(`\n📈 GROWTH RATES (Last 30 days vs Previous 30 days):`);
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return 'N/A';
      return ((current - previous) / previous * 100).toFixed(1) + '%';
    };
    
    console.log(`- Impressions Growth: ${calculateGrowth(metricsSummary._sum.impressions || 0, previousPeriod._sum.impressions || 0)}`);
    console.log(`- Clicks Growth: ${calculateGrowth(metricsSummary._sum.clicks || 0, previousPeriod._sum.clicks || 0)}`);
    console.log(`- Conversions Growth: ${calculateGrowth(metricsSummary._sum.conversions || 0, previousPeriod._sum.conversions || 0)}`);
    console.log(`- Revenue Growth: ${calculateGrowth(Number(metricsSummary._sum.revenue || 0), Number(previousPeriod._sum.revenue || 0))}`);
    console.log(`- ROAS Growth: ${calculateGrowth(Number(metricsSummary._avg.roas || 0), Number(previousPeriod._sum.roas || 0))}`);
    
    console.log('\n✅ Full Dashboard Test Complete!');
    console.log('🎯 All data is ready for frontend display with calculated metrics and growth rates.');
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
