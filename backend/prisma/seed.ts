// prisma/seed.ts (Sprint 4 - Schema v2.0 Compatible - 90 Days Logic)
import {
  PrismaClient,
  UserRole,
  CampaignStatus,
  NotificationChannel,
  AdPlatform,
  AlertSeverity,
  SyncStatus,
  AlertStatus,
  AlertRuleType,
  SubscriptionPlan,
  SubscriptionStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==========================================
// 1. Embedded Mock Data & Generators
// ==========================================

interface MockCampaign {
  externalId: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  platform: AdPlatform;
  campaignType: string;
}

const MOCK_CAMPAIGNS: MockCampaign[] = [
  // Google Ads
  {
    externalId: 'gads-001',
    name: 'Google Search - Brand Keywords',
    status: CampaignStatus.ACTIVE,
    budget: 50000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'search',
  },
  {
    externalId: 'gads-002',
    name: 'Google Search - Generic Keywords',
    status: CampaignStatus.ACTIVE,
    budget: 80000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'search',
  },
  {
    externalId: 'gads-003',
    name: 'Display Remarketing',
    status: CampaignStatus.ACTIVE,
    budget: 30000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'display',
  },
  {
    externalId: 'gads-004',
    name: 'Google Shopping',
    status: CampaignStatus.PAUSED,
    budget: 45000,
    platform: AdPlatform.GOOGLE_ADS,
    campaignType: 'shopping',
  },
  // Facebook
  {
    externalId: 'fb-001',
    name: 'Facebook Lead Gen - Form',
    status: CampaignStatus.ACTIVE,
    budget: 35000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'lead_generation',
  },
  {
    externalId: 'fb-002',
    name: 'Facebook Video Views',
    status: CampaignStatus.ACTIVE,
    budget: 25000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'video',
  },
  {
    externalId: 'fb-003',
    name: 'Facebook Conversions - Website',
    status: CampaignStatus.PAUSED,
    budget: 60000,
    platform: AdPlatform.FACEBOOK,
    campaignType: 'conversions',
  },
  // TikTok
  {
    externalId: 'tiktok-001',
    name: 'TikTok Awareness - Reach',
    status: CampaignStatus.ACTIVE,
    budget: 40000,
    platform: AdPlatform.TIKTOK,
    campaignType: 'reach',
  },
  {
    externalId: 'tiktok-002',
    name: 'TikTok Traffic - Website Visits',
    status: CampaignStatus.ACTIVE,
    budget: 55000,
    platform: AdPlatform.TIKTOK,
    campaignType: 'traffic',
  },
  // LINE Ads
  {
    externalId: 'line-001',
    name: 'LINE Ads - Brand Awareness',
    status: CampaignStatus.ACTIVE,
    budget: 50000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'brand_awareness',
  },
  {
    externalId: 'line-002',
    name: 'LINE Ads - Lead Generation',
    status: CampaignStatus.ACTIVE,
    budget: 75000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'website_conversions',
  },
  {
    externalId: 'line-003',
    name: 'LINE Ads - Retargeting',
    status: CampaignStatus.PAUSED,
    budget: 30000,
    platform: AdPlatform.LINE_ADS,
    campaignType: 'website_conversions',
  },
];

// Helper to generate realistic daily fluctuation
function generateDailyMetrics(platform: AdPlatform) {
  // Variance factors
  const isWeekend = Math.random() > 0.7; // Simulate weekend dip
  const performanceFactor = isWeekend ? 0.8 : 1.0 + (Math.random() * 0.2 - 0.1); // +/- 10%

  // Platform multipliers (Google/FB usually higher volume than Line/TikTok for this demo)
  let volumeMultiplier = 1;
  if (platform === AdPlatform.TIKTOK) volumeMultiplier = 0.8;
  if (platform === AdPlatform.LINE_ADS) volumeMultiplier = 0.6;

  const baseImpressions = Math.floor((Math.random() * 5000 + 1000) * volumeMultiplier * performanceFactor);

  // CTR varies by platform
  let ctrRate = 0.02 + Math.random() * 0.03; // Default 2-5%
  if (platform === AdPlatform.FACEBOOK) ctrRate = 0.01 + Math.random() * 0.02; // 1-3%

  const clicks = Math.floor(baseImpressions * ctrRate);

  // CPC varies
  let avgCpc = 5 + Math.random() * 5; // 5-10 THB
  if (platform === AdPlatform.GOOGLE_ADS) avgCpc = 10 + Math.random() * 15; // 10-25 THB

  const spend = Math.floor(clicks * avgCpc);

  // Conversion Rate
  const cvr = 0.02 + Math.random() * 0.04; // 2-6%
  const conversions = Math.floor(clicks * cvr);

  // Revenue (ROAS 2.0 - 5.0)
  const roasTarget = 2 + Math.random() * 3;
  const revenue = Math.floor(spend * roasTarget);

  return {
    impressions: baseImpressions,
    clicks,
    spend,
    conversions,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
    orders: conversions,
    averageOrderValue: conversions > 0 ? revenue / conversions : 0,
  };
}

// SQL Helper: Escape single quotes
function sqlEscape(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return String(val);
}

// Helper: Insert SeoSearchIntent using Raw SQL
async function insertSeoSearchIntentRaw(data: any[]) {
  if (data.length === 0) return;

  // Batch size of 1000 to prevent query too large
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map(row => {
      return `(gen_random_uuid(), ${sqlEscape(row.tenantId)}, ${sqlEscape(row.date)}, ${sqlEscape(row.type)}, ${row.keywords}, ${row.traffic}, NOW(), NOW())`;
    }).join(',\n');

    await prisma.$executeRawUnsafe(`
            INSERT INTO "seo_search_intent" ("id", "tenant_id", "date", "type", "keywords", "traffic", "created_at", "updated_at")
            VALUES ${values}
            ON CONFLICT DO NOTHING;
        `);
  }
}

// Helper: Insert WebAnalyticsDaily using Raw SQL
async function insertWebAnalyticsDailyRaw(data: any[]) {
  if (data.length === 0) return;

  const batchSize = 500;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const values = batch.map(row => {
      return `(
                gen_random_uuid(), 
                ${sqlEscape(row.tenantId)}, 
                ${sqlEscape(row.propertyId)}, 
                ${sqlEscape(row.gaAccountId)}, 
                ${sqlEscape(row.date)}, 
                ${row.activeUsers || 0}, 
                ${row.newUsers || 0}, 
                ${row.sessions || 0}, 
                ${row.screenPageViews || 0}, 
                ${row.engagementRate}, 
                ${row.bounceRate}, 
                ${row.avgSessionDuration}, 
                ${row.isMockData ? 'true' : 'false'}, 
                ${sqlEscape(row.metadata)}, 
                NOW(), 
                NOW()
            )`;
    }).join(',\n');

    await prisma.$executeRawUnsafe(`
            INSERT INTO "web_analytics_daily" (
                "id", "tenant_id", "property_id", "ga_account_id", "date", 
                "active_users", "new_users", "sessions", "screen_page_views", 
                "engagement_rate", "bounce_rate", "avg_session_duration", 
                "is_mock_data", "metadata", "created_at", "updated_at"
            )
            VALUES ${values}
            ON CONFLICT DO NOTHING;
        `);
  }
}

async function main() {
  console.log('🌱 Starting Robust Seed (90 Days Data)...');

  // 1. Clean up old data
  try {
    console.log('🧹 Cleaning up existing data...');
    // Delete in order to avoid Foreign Key constraints
    await prisma.notification.deleteMany();
    await prisma.alertHistory.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.alertRule.deleteMany();
    await prisma.syncLog.deleteMany();
    await prisma.report.deleteMany();
    await prisma.metric.deleteMany();
    await prisma.webAnalyticsDaily.deleteMany();
    await prisma.adGroup.deleteMany(); // Added AdGroup cleanup
    await prisma.campaign.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.platformToken.deleteMany();
    // Delete accounts
    await prisma.googleAdsAccount.deleteMany();
    await prisma.googleAnalyticsAccount.deleteMany();
    await prisma.facebookAdsAccount.deleteMany();
    await prisma.tikTokAdsAccount.deleteMany();
    await prisma.lineAdsAccount.deleteMany();

    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    console.log('✅ Cleanup complete');
  } catch (e) {
    console.error('⚠️ Cleanup warning (ignore if first run):', e);
  }

  // 2. Create Tenant
  console.log('🏢 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'RGA Demo Company',
      slug: 'rga-demo',
      domain: 'demo.rga.com',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Generic logo
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  // 3. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rga.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'demo@example.com', // As requested
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.CLIENT,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const shouldSeedDemoData = process.env.SEED_DEMO_DATA === 'true';

  if (!shouldSeedDemoData) {
    console.log('⏭️ Skipping demo integrations/accounts/campaigns. Set SEED_DEMO_DATA=true to enable.');
    return;
  }

  // 4. Create Integrations & Accounts (Required for Campaigns)
  console.log('🔗 Creating integrations...');

  // Google
  const googleIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.GOOGLE_ADS,
      name: 'Google Ads Main',
      provider: 'google',
      isActive: true,
    },
  });
  const googleAccount = await prisma.googleAdsAccount.create({
    data: {
      tenantId: tenant.id,
      customerId: '123-456-7890',
      accountName: 'RGA Main Account',
      accessToken: 'mock_token',
      refreshToken: 'mock_refresh',
    },
  });

  // Facebook
  const fbIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.FACEBOOK,
      name: 'Facebook Ads Main',
      provider: 'meta',
      isActive: true,
    },
  });
  const fbAccount = await prisma.facebookAdsAccount.create({
    data: {
      tenantId: tenant.id,
      accountId: 'act_123456789',
      accountName: 'RGA Facebook Main',
      accessToken: 'mock_token',
    },
  });

  // TikTok
  const tiktokAccount = await prisma.tikTokAdsAccount.create({
    data: {
      tenantId: tenant.id,
      advertiserId: '7123456789012345678',
      accountName: 'RGA TikTok Ads',
      accessToken: 'mock_token',
    },
  });

  // Line
  const lineAccount = await prisma.lineAdsAccount.create({
    data: {
      tenantId: tenant.id,
      channelId: '1654321098',
      channelName: 'RGA LINE Official',
      accessToken: 'mock_token',
    },
  });


  // 5. Create Campaigns & Metrics
  console.log(`📢 Creating ${MOCK_CAMPAIGNS.length} campaigns and generating 90 days of metrics...`);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 90);

  let totalMetrics = 0;

  for (const mockCampaign of MOCK_CAMPAIGNS) {
    // Determine integration/account based on platform
    let integrationId = null;
    let googleAdsAccountId = null;
    let facebookAdsAccountId = null;
    let tiktokAdsAccountId = null;
    let lineAdsAccountId = null;

    if (mockCampaign.platform === AdPlatform.GOOGLE_ADS) {
      integrationId = googleIntegration.id;
      googleAdsAccountId = googleAccount.id;
    } else if (mockCampaign.platform === AdPlatform.FACEBOOK) {
      integrationId = fbIntegration.id;
      facebookAdsAccountId = fbAccount.id;
    } else if (mockCampaign.platform === AdPlatform.TIKTOK) {
      tiktokAdsAccountId = tiktokAccount.id;
    } else if (mockCampaign.platform === AdPlatform.LINE_ADS) {
      lineAdsAccountId = lineAccount.id;
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: mockCampaign.name,
        platform: mockCampaign.platform,
        status: mockCampaign.status,
        budget: mockCampaign.budget,
        campaignType: mockCampaign.campaignType,
        externalId: mockCampaign.externalId,
        currency: 'THB',
        integrationId,
        googleAdsAccountId,
        facebookAdsAccountId,
        tiktokAdsAccountId,
        lineAdsAccountId,
        startDate: startDate,
        lastSyncedAt: new Date(),
        syncStatus: SyncStatus.SUCCESS,
      },
    });

    // Generate 90 days of metrics
    const campaignMetrics = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dailyData = generateDailyMetrics(mockCampaign.platform);

      // Zero out future data if campaign is ended, or low data if paused (simulate residual attribution)
      if (mockCampaign.status === CampaignStatus.PAUSED && Math.random() > 0.2) {
        dailyData.spend = 0;
        dailyData.impressions = 0;
        dailyData.clicks = 0;
      }

      campaignMetrics.push({
        tenantId: tenant.id,
        campaignId: campaign.id,
        date: new Date(currentDate), // Clone date
        platform: mockCampaign.platform,
        source: 'platform_api',
        impressions: dailyData.impressions,
        clicks: dailyData.clicks,
        spend: new Prisma.Decimal(dailyData.spend),
        conversions: dailyData.conversions,
        revenue: new Prisma.Decimal(dailyData.revenue),
        roas: new Prisma.Decimal(dailyData.roas),
        orders: dailyData.orders,
        averageOrderValue: new Prisma.Decimal(dailyData.averageOrderValue),
        costPerClick: new Prisma.Decimal(dailyData.clicks > 0 ? dailyData.spend / dailyData.clicks : 0),
        costPerMille: new Prisma.Decimal(dailyData.impressions > 0 ? (dailyData.spend / dailyData.impressions) * 1000 : 0),
        costPerAction: new Prisma.Decimal(dailyData.conversions > 0 ? dailyData.spend / dailyData.conversions : 0),
        ctr: new Prisma.Decimal(dailyData.impressions > 0 ? (dailyData.clicks / dailyData.impressions) * 100 : 0),
        conversionRate: new Prisma.Decimal(dailyData.clicks > 0 ? (dailyData.conversions / dailyData.clicks) * 100 : 0),
        isMockData: true,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await prisma.metric.createMany({
      data: campaignMetrics,
    });
    totalMetrics += campaignMetrics.length;
    process.stdout.write('.'); // Progress indicator
  }

  console.log(`\n✅ Created ${MOCK_CAMPAIGNS.length} campaigns and ${totalMetrics} metric records.`);

  // 6. Create Web Analytics (GA4) - 90 Days
  console.log('📈 Creating Google Analytics data (90 Days)...');
  const gaMetrics = [];
  let currentDate = new Date(startDate);

  while (currentDate <= today) {
    const sessions = Math.floor(Math.random() * 5000) + 2000;
    const activeUsers = Math.floor(sessions * 0.8);

    gaMetrics.push({
      tenantId: tenant.id,
      propertyId: 'GA4-123456789',
      date: new Date(currentDate),
      activeUsers,
      newUsers: Math.floor(activeUsers * 0.3),
      sessions,
      screenPageViews: sessions * 3,
      engagementRate: new Prisma.Decimal(0.6 + Math.random() * 0.2),
      bounceRate: new Prisma.Decimal(0.3 + Math.random() * 0.1),
      avgSessionDuration: new Prisma.Decimal(120 + Math.random() * 60),
      isMockData: true,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }


  // 7. Create SEO Search Intent Data (Organic Keywords by Intent) - 90 Days
  console.log('🔍 Creating SEO Search Intent data (90 Days)...');
  const seoIntentMetrics = [];
  let seoCurrentDate = new Date(startDate);

  while (seoCurrentDate <= today) {
    // Generate daily random volume for each intent type
    const baseVolume = 100 + Math.floor(Math.random() * 50);

    const intents = [
      { type: 'branded', kRatio: 0.2, tRatio: 0.4 },
      { type: 'non_branded', kRatio: 0.8, tRatio: 0.6 },
      { type: 'informational', kRatio: 0.5, tRatio: 0.5 },
      { type: 'navigational', kRatio: 0.1, tRatio: 0.1 },
      { type: 'commercial', kRatio: 0.3, tRatio: 0.35 },
      { type: 'transactional', kRatio: 0.1, tRatio: 0.05 }
    ];

    for (const intent of intents) {
      seoIntentMetrics.push({
        tenantId: tenant.id,
        date: new Date(seoCurrentDate),
        type: intent.type,
        keywords: Math.floor(baseVolume * intent.kRatio * (0.8 + Math.random() * 0.4)),
        traffic: Math.floor(baseVolume * intent.tRatio * 10 * (0.8 + Math.random() * 0.4)),
      });
    }

    seoCurrentDate.setDate(seoCurrentDate.getDate() + 1);
  }

  // Use Raw SQL Helper
  await insertSeoSearchIntentRaw(seoIntentMetrics);
  console.log(`✅ Created ${seoIntentMetrics.length} SEO Intent records.`);

  // 8. Create SEO Premium Metrics Data (10 sets of data + 30 days history)
  console.log('🚀 Creating SEO Premium Metrics data (10 sets + 30 days history)...');

  // Create Google Analytics Account for SEO tracking
  const gaAccount = await prisma.googleAnalyticsAccount.create({
    data: {
      tenantId: tenant.id,
      propertyId: 'GA4-987654321',
      propertyName: 'RGA Main Property',
      accessToken: 'mock_ga_token',
      refreshToken: 'mock_ga_refresh',
    },
  });

  // Generate 10 sets of SEO premium metrics across different dates
  const seoPremiumData = [];
  const premiumStartDate = new Date(today);
  premiumStartDate.setDate(today.getDate() - 30); // Last 30 days

  // Create 30 days of SEO metrics history for performance trends
  for (let i = 0; i < 30; i++) {
    const dataDate = new Date(premiumStartDate);
    dataDate.setDate(premiumStartDate.getDate() + i);

    // Generate realistic SEO metrics with variation
    const organicSessions = Math.floor(5000 + Math.random() * 10000);
    const avgPosition = 5 + Math.random() * 20; // 5-25 position
    const ur = 20 + Math.random() * 60; // 20-80 UR score
    const dr = 10 + Math.random() * 70; // 10-80 DR score
    const backlinks = Math.floor(50 + Math.random() * 500);
    const referringDomains = Math.floor(20 + Math.random() * 200);
    const keywords = Math.floor(100 + Math.random() * 1000);
    const trafficCost = Math.floor(1000 + Math.random() * 10000);
    const goalCompletions = Math.floor(10 + Math.random() * 100);

    seoPremiumData.push({
      tenantId: tenant.id,
      propertyId: 'GA4-987654321',
      gaAccountId: gaAccount.id,
      date: dataDate,
      activeUsers: Math.floor(organicSessions * 0.8),
      newUsers: Math.floor(organicSessions * 0.3),
      sessions: organicSessions,
      screenPageViews: organicSessions * 3,
      engagementRate: new Prisma.Decimal(0.6 + Math.random() * 0.2),
      bounceRate: new Prisma.Decimal(0.3 + Math.random() * 0.1),
      avgSessionDuration: new Prisma.Decimal(120 + Math.random() * 60),
      isMockData: true,
      metadata: {
        seoMetrics: {
          avgPosition: parseFloat(avgPosition.toFixed(1)),
          avgPositionTrend: parseFloat(((Math.random() - 0.5) * 10).toFixed(1)), // -5% to +5%
          ur: parseFloat(ur.toFixed(1)),
          dr: parseFloat(dr.toFixed(1)),
          backlinks,
          referringDomains,
          keywords,
          trafficCost,
          goalCompletions,
          organicSessions,
          organicSessionsTrend: parseFloat(((Math.random() - 0.5) * 20).toFixed(1)), // -10% to +10%
          avgTimeOnPage: Math.floor(60 + Math.random() * 180), // 60-240 seconds
          avgTimeOnPageTrend: parseFloat(((Math.random() - 0.5) * 30).toFixed(1)), // -15% to +15%
        }
      }
    });
  }

  // Use Raw SQL Helper
  await insertWebAnalyticsDailyRaw(seoPremiumData);
  console.log(`✅ Created ${seoPremiumData.length} SEO Premium Metrics records (30 days history).`);

  // 9. Create Traffic by Location Data
  console.log('🌍 Creating Traffic by Location data...');
  const locations = [
    { country: 'Thailand', city: 'Bangkok', traffic: 3500, keywords: 2800, countryCode: 'TH' },
    { country: 'Thailand', city: 'Chiang Mai', traffic: 800, keywords: 640, countryCode: 'TH' },
    { country: 'Thailand', city: 'Phuket', traffic: 600, keywords: 480, countryCode: 'TH' },
    { country: 'United States', city: 'New York', traffic: 450, keywords: 360, countryCode: 'US' },
    { country: 'United States', city: 'Los Angeles', traffic: 380, keywords: 304, countryCode: 'US' },
    { country: 'United Kingdom', city: 'London', traffic: 320, keywords: 256, countryCode: 'GB' },
    { country: 'Singapore', city: 'Singapore', traffic: 290, keywords: 232, countryCode: 'SG' },
    { country: 'Japan', city: 'Tokyo', traffic: 260, keywords: 208, countryCode: 'JP' },
    { country: 'Malaysia', city: 'Kuala Lumpur', traffic: 240, keywords: 192, countryCode: 'MY' },
    { country: 'Australia', city: 'Sydney', traffic: 180, keywords: 144, countryCode: 'AU' }
  ];

  // Store location data in a separate metadata table or as part of WebAnalyticsDaily
  // For now, we'll create a simple structure that can be queried
  const locationData = locations.map((location, index) => {
    // Create unique date for each location to avoid constraint violation
    const locationDate = new Date(premiumStartDate);
    locationDate.setDate(premiumStartDate.getDate() + index);

    return {
      tenantId: tenant.id,
      propertyId: `GA4-LOCATION-${index}`, // Unique property ID for each location
      date: locationDate,
      activeUsers: Math.floor(location.traffic * 0.8),
      newUsers: Math.floor(location.traffic * 0.3),
      sessions: location.traffic,
      screenPageViews: location.traffic * 3,
      engagementRate: new Prisma.Decimal(0.6 + Math.random() * 0.2),
      bounceRate: new Prisma.Decimal(0.3 + Math.random() * 0.1),
      avgSessionDuration: new Prisma.Decimal(120 + Math.random() * 60),
      isMockData: true,
      metadata: {
        location: {
          country: location.country,
          city: location.city,
          countryCode: location.countryCode,
          traffic: location.traffic,
          keywords: location.keywords
        }
      }
    };
  });

  // Use Raw SQL Helper
  await insertWebAnalyticsDailyRaw(locationData);
  console.log(`✅ Created ${locationData.length} Traffic by Location records.`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });