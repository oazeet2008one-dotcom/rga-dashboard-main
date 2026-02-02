require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const faker = require('@faker-js/faker').faker;

const prisma = new PrismaClient();

// Generate comprehensive demo data
const generateFullDemoData = async (tenantId) => {
  const today = new Date();
  const data = {
    campaigns: [],
    adGroups: [],
    metrics: [],
    gsc: [],
    ga4: [],
    integrations: []
  };

  // 1. Generate campaigns (5 campaigns)
  const platforms = ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK'];
  for (let i = 0; i < 5; i++) {
    const campaignId = faker.string.uuid();
    data.campaigns.push({
      id: campaignId,
      tenantId,
      externalId: faker.string.alphanumeric(10),
      name: faker.company.catchPhrase() + ' Campaign',
      platform: faker.helpers.arrayElement(platforms),
      campaignType: faker.helpers.arrayElement(['SEARCH', 'DISPLAY', 'VIDEO', 'SOCIAL']),
      objective: faker.helpers.arrayElement(['AWARENESS', 'TRAFFIC', 'CONVERSIONS', 'ENGAGEMENT']),
      status: 'ACTIVE',
      budget: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
      budgetType: 'DAILY',
      currency: 'THB',
      startDate: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),  // 30 days from now
      lastSyncedAt: new Date(),
      syncStatus: 'COMPLETED'
    });

    // 2. Generate ad groups for each campaign (2-3 per campaign)
    const adGroupCount = faker.number.int({ min: 2, max: 3 });
    for (let j = 0; j < adGroupCount; j++) {
      data.adGroups.push({
        id: faker.string.uuid(),
        tenantId,
        campaignId,
        externalId: faker.string.alphanumeric(8),
        name: faker.lorem.words(2) + ' Ad Group',
        status: 'ACTIVE',
        budget: faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }),
        bidAmount: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
        bidType: faker.helpers.arrayElement(['CPC', 'CPM', 'CPA']),
        targeting: {
          age: ['18-24', '25-34', '35-44'],
          gender: ['ALL'],
          location: ['Thailand'],
          interests: [faker.lorem.word(), faker.lorem.word()]
        }
      });
    }
  }

  // 3. Generate metrics for last 90 days (daily data)
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.campaigns.forEach(campaign => {
      const baseImpressions = faker.number.int({ min: 1000, max: 10000 });
      const clicks = faker.number.int({ min: Math.floor(baseImpressions * 0.01), max: Math.floor(baseImpressions * 0.1) });
      const conversions = faker.number.int({ min: 0, max: Math.floor(clicks * 0.05) });
      const spend = faker.number.float({ min: 100, max: 2000, fractionDigits: 2 });
      const revenue = conversions * faker.number.float({ min: 500, max: 2000, fractionDigits: 2 });

      data.metrics.push({
        id: faker.string.uuid(),
        tenantId,
        campaignId: campaign.id,
        date,
        platform: campaign.platform,
        impressions: baseImpressions,
        clicks,
        conversions,
        spend,
        costPerClick: clicks > 0 ? spend / clicks : 0,
        costPerMille: baseImpressions > 0 ? (spend / baseImpressions) * 1000 : 0,
        costPerAction: conversions > 0 ? spend / conversions : 0,
        ctr: baseImpressions > 0 ? (clicks / baseImpressions) * 100 : 0,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        roas: spend > 0 ? revenue / spend : 0,
        revenue,
        orders: conversions,
        averageOrderValue: conversions > 0 ? revenue / conversions : 0,
        organicTraffic: faker.number.int({ min: 100, max: 1000 }),
        bounceRate: faker.number.float({ min: 0.2, max: 0.8, fractionDigits: 2 }),
        avgSessionDuration: faker.number.int({ min: 60, max: 300 }),
        isMockData: true
      });
    });
  }

  // 4. Generate GSC data (last 60 days, more detailed)
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const rowsPerDay = faker.number.int({ min: 10, max: 25 });
    for (let j = 0; j < rowsPerDay; j++) {
      const clicks = faker.number.int({ min: 0, max: 100 });
      const impressions = faker.number.int({ min: clicks, max: 1000 });
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const position = faker.number.float({ min: 1, max: 50, fractionDigits: 1 });

      data.gsc.push({
        id: faker.string.uuid(),
        tenantId,
        siteUrl: 'sc-domain:demo-domain.com',
        date,
        page: faker.internet.url(),
        query: faker.lorem.words({ min: 1, max: 4 }),
        device: faker.helpers.arrayElement(['DESKTOP', 'MOBILE', 'TABLET']),
        country: faker.location.countryCode(),
        clicks,
        impressions,
        ctr,
        position,
        externalKey: `${date.toISOString().split('T')[0]}-${faker.string.alphanumeric(8)}`
      });
    }
  }

  // 5. Generate GA4 data (last 60 days)
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.ga4.push({
      id: faker.string.uuid(),
      tenantId,
      propertyId: 'demo-property-id',
      date,
      activeUsers: faker.number.int({ min: 100, max: 1000 }),
      newUsers: faker.number.int({ min: 20, max: 400 }),
      sessions: faker.number.int({ min: 120, max: 1200 }),
      screenPageViews: faker.number.int({ min: 200, max: 2000 }),
      engagementRate: faker.number.float({ min: 0.3, max: 0.9, fractionDigits: 2 }),
      bounceRate: faker.number.float({ min: 0.2, max: 0.7, fractionDigits: 2 }),
      avgSessionDuration: faker.number.int({ min: 60, max: 300 }),
      isMockData: true
    });
  }

  // 6. Generate integrations
  const integrationTypes = ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK'];
  integrationTypes.forEach(type => {
    data.integrations.push({
      id: faker.string.uuid(),
      tenantId,
      type,
      name: `${type.replace('_', ' ')} Integration`,
      provider: type.replace('_', ' ').toLowerCase(),
      credentials: { status: 'connected' },
      config: { syncFrequency: 15 },
      status: 'active',
      isActive: true,
      lastSyncAt: new Date(),
      syncFrequencyMinutes: 15
    });
  });

  return data;
};

async function seedFullDemo() {
  try {
    console.log('🌱 Starting FULL DEMO data seed...');
    
    const tenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
    if (!tenant) {
      throw new Error('No tenant found');
    }
    console.log(`📢 Using tenant: ${tenant.name} (${tenant.id})`);
    
    // Clean existing demo data
    console.log('🧹 Cleaning existing demo data...');
    await prisma.metric.deleteMany({ where: { tenantId: tenant.id, isMockData: true } });
    await prisma.searchConsolePerformance.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.webAnalyticsDaily.deleteMany({ where: { tenantId: tenant.id, isMockData: true } });
    await prisma.adGroup.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.integration.deleteMany({ where: { tenantId: tenant.id } });
    
    // Generate all data
    console.log('📊 Generating comprehensive demo data...');
    const demoData = await generateFullDemoData(tenant.id);
    
    // Insert data in correct order (respecting foreign keys)
    console.log('💾 Inserting campaigns...');
    await prisma.campaign.createMany({ data: demoData.campaigns, skipDuplicates: true });
    
    console.log('📱 Inserting ad groups...');
    await prisma.adGroup.createMany({ data: demoData.adGroups, skipDuplicates: true });
    
    console.log('📈 Inserting metrics...');
    const batchSize = 1000;
    for (let i = 0; i < demoData.metrics.length; i += batchSize) {
      const chunk = demoData.metrics.slice(i, i + batchSize);
      await prisma.metric.createMany({ data: chunk, skipDuplicates: true });
    }
    
    console.log('🔍 Inserting GSC data...');
    for (let i = 0; i < demoData.gsc.length; i += batchSize) {
      const chunk = demoData.gsc.slice(i, i + batchSize);
      await prisma.searchConsolePerformance.createMany({ data: chunk, skipDuplicates: true });
    }
    
    console.log('📊 Inserting GA4 data...');
    await prisma.webAnalyticsDaily.createMany({ data: demoData.ga4, skipDuplicates: true });
    
    console.log('🔌 Inserting integrations...');
    await prisma.integration.createMany({ data: demoData.integrations, skipDuplicates: true });
    
    // Verify counts
    const counts = await prisma.$transaction([
      prisma.campaign.count({ where: { tenantId: tenant.id } }),
      prisma.adGroup.count({ where: { tenantId: tenant.id } }),
      prisma.metric.count({ where: { tenantId: tenant.id, isMockData: true } }),
      prisma.searchConsolePerformance.count({ where: { tenantId: tenant.id } }),
      prisma.webAnalyticsDaily.count({ where: { tenantId: tenant.id, isMockData: true } }),
      prisma.integration.count({ where: { tenantId: tenant.id } })
    ]);
    
    console.log('✅ Full demo data seeded successfully!');
    console.log(`📊 Campaigns: ${counts[0]}`);
    console.log(`📱 Ad Groups: ${counts[1]}`);
    console.log(`📈 Metrics: ${counts[2]}`);
    console.log(`🔍 GSC rows: ${counts[3]}`);
    console.log(`📊 GA4 rows: ${counts[4]}`);
    console.log(`🔌 Integrations: ${counts[5]}`);
    
    // Show calculated metrics
    console.log('\n📊 Calculated Metrics Summary:');
    const totalMetrics = await prisma.metric.aggregate({
      where: { tenantId: tenant.id, isMockData: true },
      _sum: { 
        impressions: true, 
        clicks: true, 
        conversions: true, 
        spend: true, 
        revenue: true 
      },
      _avg: { ctr: true, conversionRate: true, roas: true }
    });
    
    console.log(`Total Impressions: ${totalMetrics._sum.impressions?.toLocaleString() || 0}`);
    console.log(`Total Clicks: ${totalMetrics._sum.clicks?.toLocaleString() || 0}`);
    console.log(`Total Conversions: ${totalMetrics._sum.conversions?.toLocaleString() || 0}`);
    console.log(`Total Spend: ฿${totalMetrics._sum.spend?.toFixed(2) || 0}`);
    console.log(`Total Revenue: ฿${totalMetrics._sum.revenue?.toFixed(2) || 0}`);
    console.log(`Avg CTR: ${totalMetrics._avg.ctr?.toFixed(2) || 0}%`);
    console.log(`Avg Conversion Rate: ${totalMetrics._avg.conversionRate?.toFixed(2) || 0}%`);
    console.log(`Avg ROAS: ${totalMetrics._avg.roas?.toFixed(2) || 0}`);
    
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedFullDemo();
