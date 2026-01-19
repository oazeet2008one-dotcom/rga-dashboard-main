// prisma/seed.ts (Sprint 4 - Schema v2.0 Compatible)
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
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed (Schema v2.0 Compatible)...');

  // 1. Clean up old data (in correct dependency order)
  try {
    console.log('🧹 Cleaning up existing data...');
    await prisma.notification.deleteMany();
    await prisma.alertHistory.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.alertRule.deleteMany();
    await prisma.syncLog.deleteMany();
    await prisma.report.deleteMany();
    await prisma.metric.deleteMany();
    await prisma.webAnalyticsDaily.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.platformToken.deleteMany();
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
    console.log('⚠️ Cleanup warning:', e);
  }

  // 2. Create Tenant (UUID auto-generated)
  console.log('🏢 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'RGA Demo Company',
      slug: 'rga-demo',
      domain: 'demo.rga.com',
      logoUrl: 'https://rga.com/logo.png',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      language: 'th',
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      settings: {
        theme: 'light',
        emailNotifications: true,
        weeklyReports: true,
      },
    },
  });
  console.log(`   Tenant created: ${tenant.id}`);

  // 3. Create Role (Custom)
  console.log('👔 Creating custom role...');
  const managerRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Marketing Manager',
      description: 'Can manage campaigns and view reports',
      permissions: ['campaigns:read', 'campaigns:write', 'reports:read', 'alerts:read'],
    },
  });

  // 4. Create Users (Using firstName + lastName instead of name)
  // Added avatarUrl with placeholder initials for Recent Sales UI display
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rga.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+66891234567',
      avatarUrl: 'https://ui-avatars.com/api/?name=SA&background=3B82F6&color=fff',
      role: UserRole.SUPER_ADMIN,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      lastLoginAt: new Date(),
      lastLoginIp: '127.0.0.1',
      timezone: 'Asia/Bangkok',
      language: 'th',
      notificationPreferences: {
        email: true,
        inApp: true,
        line: false,
      },
    },
  });
  console.log(`   Admin created: ${admin.email}`);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@rga.com',
      password: hashedPassword,
      firstName: 'Marketing',
      lastName: 'Manager',
      avatarUrl: 'https://ui-avatars.com/api/?name=MM&background=10B981&color=fff',
      role: UserRole.MANAGER,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`   Manager created: ${manager.email}`);

  const client = await prisma.user.create({
    data: {
      email: 'client@customer.com',
      password: hashedPassword,
      firstName: 'Somchai',
      lastName: 'Jaidee',
      phone: '+66812345678',
      avatarUrl: 'https://ui-avatars.com/api/?name=SJ&background=F59E0B&color=fff',
      role: UserRole.CLIENT,
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
      notificationPreferences: {
        email: true,
        inApp: true,
      },
    },
  });
  console.log(`   Client created: ${client.email}`);

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@rga.com',
      password: hashedPassword,
      firstName: 'Read',
      lastName: 'Only',
      avatarUrl: 'https://ui-avatars.com/api/?name=RO&background=8B5CF6&color=fff',
      role: UserRole.VIEWER,
      tenantId: tenant.id,
      isActive: true,
    },
  });
  console.log(`   Viewer created: ${viewer.email}`);

  // Create additional users for Recent Sales display (5-10 realistic records)
  const salesUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'nattapong@example.com',
        password: hashedPassword,
        firstName: 'Nattapong',
        lastName: 'Sriprasit',
        avatarUrl: 'https://ui-avatars.com/api/?name=NS&background=EF4444&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'siriporn@example.com',
        password: hashedPassword,
        firstName: 'Siriporn',
        lastName: 'Wongchai',
        avatarUrl: 'https://ui-avatars.com/api/?name=SW&background=EC4899&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'piyawat@example.com',
        password: hashedPassword,
        firstName: 'Piyawat',
        lastName: 'Charoensuk',
        avatarUrl: 'https://ui-avatars.com/api/?name=PC&background=06B6D4&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'kanokwan@example.com',
        password: hashedPassword,
        firstName: 'Kanokwan',
        lastName: 'Thongdee',
        avatarUrl: 'https://ui-avatars.com/api/?name=KT&background=84CC16&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'thanawat@example.com',
        password: hashedPassword,
        firstName: 'Thanawat',
        lastName: 'Phumjan',
        avatarUrl: 'https://ui-avatars.com/api/?name=TP&background=F97316&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'priyada@example.com',
        password: hashedPassword,
        firstName: 'Priyada',
        lastName: 'Suksan',
        avatarUrl: 'https://ui-avatars.com/api/?name=PS&background=14B8A6&color=fff',
        role: UserRole.CLIENT,
        tenantId: tenant.id,
        isActive: true,
      },
    }),
  ]);
  console.log(`   Created ${salesUsers.length} additional users for sales data`);

  // 5. Create Integration (Unified Connector)
  console.log('🔗 Creating integrations...');
  const googleIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.GOOGLE_ADS,
      name: 'Google Ads Main',
      provider: 'google',
      status: 'active',
      isActive: true,
      syncFrequencyMinutes: 15,
      config: {
        autoSync: true,
        includePaused: false,
      },
    },
  });

  const fbIntegration = await prisma.integration.create({
    data: {
      tenantId: tenant.id,
      type: AdPlatform.FACEBOOK,
      name: 'Facebook Ads Main',
      provider: 'meta',
      status: 'active',
      isActive: true,
      syncFrequencyMinutes: 30,
    },
  });

  // 6. Create Platform Accounts
  console.log('🔑 Creating platform accounts...');
  const googleAccount = await prisma.googleAdsAccount.create({
    data: {
      tenantId: tenant.id,
      customerId: '123-456-7890',
      accountName: 'RGA Main Account',
      status: 'ENABLED',
      accessToken: 'mock_access_token_google_ads',
      refreshToken: 'mock_refresh_token_google_ads',
      tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour
      lastSyncAt: new Date(),
    },
  });

  const gaAccount = await prisma.googleAnalyticsAccount.create({
    data: {
      tenantId: tenant.id,
      propertyId: 'GA4-123456789',
      propertyName: 'RGA Demo Website',
      accessToken: 'mock_access_token_ga4',
      refreshToken: 'mock_refresh_token_ga4',
      status: 'ACTIVE',
      lastSyncAt: new Date(),
    },
  });

  const fbAccount = await prisma.facebookAdsAccount.create({
    data: {
      tenantId: tenant.id,
      accountId: 'act_123456789',
      accountName: 'RGA Facebook Main',
      accessToken: 'mock_access_token_facebook',
      status: 'ACTIVE',
      lastSyncAt: new Date(),
    },
  });

  const tiktokAccount = await prisma.tikTokAdsAccount.create({
    data: {
      tenantId: tenant.id,
      advertiserId: '7123456789012345678',
      accountName: 'RGA TikTok Ads',
      accessToken: 'mock_access_token_tiktok',
      refreshToken: 'mock_refresh_token_tiktok',
      status: 'ACTIVE',
    },
  });

  // 7. Create Platform Token (Unified Token Management)
  console.log('🎫 Creating platform tokens...');
  await prisma.platformToken.create({
    data: {
      tenantId: tenant.id,
      platform: AdPlatform.GOOGLE_ADS,
      accountId: googleAccount.customerId,
      accessToken: 'unified_access_token_google',
      refreshToken: 'unified_refresh_token_google',
      tokenType: 'Bearer',
      tokenScope: 'ads.readonly',
      expiresAt: new Date(Date.now() + 3600000),
      isValid: true,
    },
  });

  // 8. Create Campaigns
  console.log('📢 Creating campaigns...');
  const campaign1 = await prisma.campaign.create({
    data: {
      tenantId: tenant.id,
      integrationId: googleIntegration.id,
      name: 'Summer Sale 2026',
      platform: AdPlatform.GOOGLE_ADS,
      campaignType: 'search',
      objective: 'conversion',
      externalId: 'cmp_google_123456',
      status: CampaignStatus.ACTIVE,
      syncStatus: SyncStatus.SUCCESS,
      budget: 50000,
      budgetType: 'daily',
      currency: 'THB',
      googleAdsAccountId: googleAccount.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      lastSyncedAt: new Date(),
    },
  });
  console.log(`   Campaign 1: ${campaign1.name}`);

  const campaign2 = await prisma.campaign.create({
    data: {
      tenantId: tenant.id,
      integrationId: fbIntegration.id,
      name: 'Brand Awareness Q1',
      platform: AdPlatform.FACEBOOK,
      campaignType: 'display',
      objective: 'awareness',
      externalId: 'cmp_fb_789012',
      status: CampaignStatus.ACTIVE,
      syncStatus: SyncStatus.SUCCESS,
      budget: 30000,
      budgetType: 'lifetime',
      currency: 'THB',
      facebookAdsAccountId: fbAccount.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      lastSyncedAt: new Date(),
    },
  });
  console.log(`   Campaign 2: ${campaign2.name}`);

  const campaign3 = await prisma.campaign.create({
    data: {
      tenantId: tenant.id,
      name: 'TikTok Viral Challenge',
      platform: AdPlatform.TIKTOK,
      campaignType: 'video',
      objective: 'engagement',
      externalId: 'cmp_tiktok_345678',
      status: CampaignStatus.PENDING,
      syncStatus: SyncStatus.PENDING,
      budget: 20000,
      currency: 'THB',
      tiktokAdsAccountId: tiktokAccount.id,
      startDate: new Date('2026-02-01'),
    },
  });
  console.log(`   Campaign 3: ${campaign3.name}`);

  // 9. Create Metrics (Time-series data with JSONB metadata)
  // STRICT RANGES: Cost (1000-5000), Impressions (10k-50k), Clicks (500-2000), Conversions (50-200)
  console.log('📊 Creating metrics with dashboard-matched ranges...');
  const today = new Date();

  // Helper function to generate random value within exact range
  const randomInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Campaign 1: Google Ads - Primary trend data
    const impressions1 = randomInRange(10000, 50000);  // 10k-50k
    const clicks1 = randomInRange(500, 2000);          // 500-2000
    const conversions1 = randomInRange(50, 200);       // 50-200
    const spend1 = randomInRange(1000, 5000);          // 1000-5000 THB

    await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        campaignId: campaign1.id,
        date: date,
        platform: AdPlatform.GOOGLE_ADS,
        source: 'campaign',
        impressions: impressions1,
        clicks: clicks1,
        conversions: conversions1,
        spend: spend1,
        costPerClick: spend1 / clicks1,
        costPerMille: (spend1 / impressions1) * 1000,
        costPerAction: spend1 / conversions1,
        ctr: (clicks1 / impressions1) * 100,
        conversionRate: (conversions1 / clicks1) * 100,
        roas: Math.random() * 5 + 2,
        revenue: conversions1 * randomInRange(200, 800),
        orders: conversions1,
        averageOrderValue: randomInRange(200, 800),
        isMockData: true,
        metadata: {
          deviceBreakdown: { mobile: 0.6, desktop: 0.35, tablet: 0.05 },
          topKeywords: ['summer sale', 'discount', 'promotion'],
          qualityScore: randomInRange(7, 10),
        },
      },
    });

    // Campaign 2: Facebook Ads - Secondary trend data (same ranges)
    const impressions2 = randomInRange(10000, 50000);
    const clicks2 = randomInRange(500, 2000);
    const conversions2 = randomInRange(50, 200);
    const spend2 = randomInRange(1000, 5000);

    await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        campaignId: campaign2.id,
        date: date,
        platform: AdPlatform.FACEBOOK,
        source: 'campaign',
        impressions: impressions2,
        clicks: clicks2,
        conversions: conversions2,
        spend: spend2,
        costPerClick: spend2 / clicks2,
        costPerMille: (spend2 / impressions2) * 1000,
        costPerAction: spend2 / conversions2,
        ctr: (clicks2 / impressions2) * 100,
        conversionRate: (conversions2 / clicks2) * 100,
        roas: Math.random() * 4 + 1.5,
        revenue: conversions2 * randomInRange(150, 600),
        orders: conversions2,
        averageOrderValue: randomInRange(150, 600),
        isMockData: true,
        metadata: {
          ageGroups: { '18-24': 0.25, '25-34': 0.40, '35-44': 0.25, '45+': 0.10 },
          placements: ['feed', 'stories', 'reels'],
        },
      },
    });
  }
  console.log('   Created 14 metric records (7 days x 2 campaigns)');

  // 10. Create Web Analytics Daily
  console.log('📈 Creating web analytics data...');
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.webAnalyticsDaily.create({
      data: {
        tenantId: tenant.id,
        propertyId: gaAccount.propertyId,
        gaAccountId: gaAccount.id,
        date: date,
        activeUsers: Math.floor(Math.random() * 5000) + 1000,
        newUsers: Math.floor(Math.random() * 1500) + 300,
        sessions: Math.floor(Math.random() * 8000) + 2000,
        screenPageViews: Math.floor(Math.random() * 20000) + 5000,
        engagementRate: Math.random() * 0.3 + 0.5,
        bounceRate: Math.random() * 0.2 + 0.3,
        avgSessionDuration: Math.floor(Math.random() * 180) + 60,
        isMockData: true,
      },
    });
  }
  console.log('   Created 7 web analytics records');

  // 11. Create Alert Rules (Using alertType instead of type)
  console.log('⚠️ Creating alert rules...');
  const budgetRule = await prisma.alertRule.create({
    data: {
      tenantId: tenant.id,
      name: 'Budget Over 80%',
      description: 'Alert when campaign spends more than 80% of budget',
      alertType: AlertRuleType.BUDGET, // Changed from 'type' to 'alertType'
      metric: 'spend_percentage',
      operator: 'gt',
      threshold: 80,
      severity: AlertSeverity.WARNING,
      isActive: true,
      notificationChannels: ['email', 'in_app'],
      recipients: [admin.id, manager.id],
    },
  });

  const ctrRule = await prisma.alertRule.create({
    data: {
      tenantId: tenant.id,
      name: 'CTR Below Threshold',
      description: 'Alert when CTR drops below 1%',
      alertType: AlertRuleType.THRESHOLD,
      metric: 'ctr',
      operator: 'lt',
      threshold: 1.0,
      severity: AlertSeverity.CRITICAL,
      isActive: true,
      notificationChannels: ['email', 'in_app', 'line'],
      recipients: [admin.id],
    },
  });

  const anomalyRule = await prisma.alertRule.create({
    data: {
      tenantId: tenant.id,
      name: 'Spend Anomaly Detection',
      description: 'Detect unusual spending patterns',
      alertType: AlertRuleType.ANOMALY,
      metric: 'spend',
      operator: 'anomaly',
      threshold: 2.0, // 2 standard deviations
      severity: AlertSeverity.WARNING,
      isActive: true,
    },
  });
  console.log('   Created 3 alert rules');

  // 12. Create Alerts
  console.log('🚨 Creating alerts...');
  const alert1 = await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      ruleId: budgetRule.id,
      campaignId: campaign1.id,
      type: 'BUDGET_WARNING',
      severity: AlertSeverity.WARNING,
      status: AlertStatus.OPEN,
      title: 'Budget Warning: Summer Sale 2026',
      message: 'Campaign "Summer Sale 2026" has spent 85% of its budget.',
      metadata: {
        budgetTotal: 50000,
        budgetUsed: 42500,
        percentUsed: 85,
        daysRemaining: 15,
      },
    },
  });

  const alert2 = await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      ruleId: ctrRule.id,
      campaignId: campaign2.id,
      type: 'CTR_LOW',
      severity: AlertSeverity.CRITICAL,
      status: AlertStatus.ACKNOWLEDGED,
      title: 'Low CTR Alert: Brand Awareness Q1',
      message: 'Campaign CTR has dropped to 0.8%, below the 1% threshold.',
      metadata: {
        currentCtr: 0.8,
        threshold: 1.0,
        trend: 'declining',
      },
    },
  });
  console.log('   Created 2 alerts');

  // 13. Create Alert History
  console.log('📜 Creating alert history...');
  await prisma.alertHistory.create({
    data: {
      alertId: alert1.id,
      tenantId: tenant.id,
      triggeredAt: new Date(Date.now() - 3600000), // 1 hour ago
      metricValue: 85,
      thresholdValue: 80,
      message: 'Budget threshold exceeded',
      notificationSent: true,
      notificationSentAt: new Date(Date.now() - 3500000),
      metadata: { notifiedVia: ['email', 'in_app'] },
    },
  });

  await prisma.alertHistory.create({
    data: {
      alertId: alert2.id,
      tenantId: tenant.id,
      triggeredAt: new Date(Date.now() - 7200000), // 2 hours ago
      metricValue: 0.8,
      thresholdValue: 1.0,
      message: 'CTR dropped below threshold',
      notificationSent: true,
      notificationSentAt: new Date(Date.now() - 7100000),
    },
  });
  console.log('   Created 2 alert history records');

  // 14. Create Notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      alertId: alert1.id,
      type: 'ALERT',
      channel: NotificationChannel.IN_APP,
      priority: 'HIGH',
      title: 'Budget Alert: Summer Sale 2026',
      message: 'Your campaign "Summer Sale 2026" has used 85% of its budget. Consider adjusting your budget or pausing the campaign.',
      isRead: false,
      metadata: {
        actionUrl: `/campaigns/${campaign1.id}`,
        actionText: 'View Campaign',
        icon: 'warning',
      },
    },
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: client.id,
      alertId: alert2.id,
      type: 'ALERT',
      channel: NotificationChannel.EMAIL,
      priority: 'URGENT',
      title: 'Critical: Low CTR on Brand Awareness Q1',
      message: 'Campaign CTR has dropped to 0.8%. Immediate action recommended.',
      isRead: false,
      sentAt: new Date(),
      metadata: {
        actionUrl: `/campaigns/${campaign2.id}/analytics`,
        actionText: 'View Analytics',
        icon: 'alert-circle',
      },
    },
  });

  await prisma.notification.create({
    data: {
      tenantId: tenant.id,
      userId: manager.id,
      type: 'SYSTEM',
      channel: NotificationChannel.IN_APP,
      priority: 'NORMAL',
      title: 'Weekly Report Ready',
      message: 'Your weekly performance report for Week 2 is now available.',
      isRead: true,
      readAt: new Date(),
      metadata: {
        actionUrl: '/reports/weekly',
        actionText: 'View Report',
        icon: 'file-text',
      },
    },
  });
  console.log('   Created 3 notifications');

  // 15. Create Report Configuration
  console.log('📄 Creating report configuration...');
  await prisma.report.create({
    data: {
      tenantId: tenant.id,
      createdBy: admin.id,
      name: 'Weekly Performance Summary',
      description: 'Automated weekly report of all campaign performance',
      reportType: 'campaign',
      dateRangeType: 'last_7_days',
      isScheduled: true,
      scheduleFrequency: 'weekly',
      scheduleTime: '09:00',
      scheduleDayOfWeek: 1, // Monday
      exportFormat: 'pdf',
      filters: {
        platforms: ['google_ads', 'facebook'],
        status: ['active'],
      },
      metrics: ['impressions', 'clicks', 'conversions', 'spend', 'roas'],
    },
  });
  console.log('   Created 1 report configuration');

  // 16. Create Sync Log
  console.log('🔄 Creating sync logs...');
  await prisma.syncLog.create({
    data: {
      tenantId: tenant.id,
      integrationId: googleIntegration.id,
      platform: AdPlatform.GOOGLE_ADS,
      accountId: googleAccount.customerId,
      syncType: 'SCHEDULED',
      status: SyncStatus.SUCCESS,
      startedAt: new Date(Date.now() - 300000), // 5 min ago
      completedAt: new Date(Date.now() - 240000), // 4 min ago
      recordsCount: 150,
      recordsSync: 150,
      data: {
        campaignsSynced: 3,
        metricsSynced: 147,
        duration: '60s',
      },
    },
  });

  await prisma.syncLog.create({
    data: {
      tenantId: tenant.id,
      integrationId: fbIntegration.id,
      platform: AdPlatform.FACEBOOK,
      accountId: fbAccount.accountId,
      syncType: 'MANUAL',
      status: SyncStatus.SUCCESS,
      startedAt: new Date(Date.now() - 600000),
      completedAt: new Date(Date.now() - 540000),
      recordsCount: 85,
      recordsSync: 85,
    },
  });
  console.log('   Created 2 sync logs');

  // 17. Create Audit Log
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: 'create',
      entityType: 'campaign',
      entityId: campaign1.id,
      changes: {
        created: {
          name: 'Summer Sale 2026',
          budget: 50000,
          platform: 'google_ads',
        },
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: 'login',
      entityType: 'user',
      entityId: admin.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  // 18. Create Recent Sales/Activity Audit Logs (5-10 records for Dashboard UI)
  console.log('💰 Creating recent sales activity logs...');
  const allSalesUsers = [client, ...salesUsers];
  const saleAmounts = [1250, 890, 3200, 1875, 4500, 2100, 1680, 950];
  const productNames = [
    'Google Ads Package Pro',
    'Facebook Marketing Bundle',
    'Social Media Suite',
    'TikTok Ads Starter',
    'Enterprise Analytics',
    'LINE Ads Premium',
    'Multi-Platform Bundle',
    'Basic Analytics Plan',
  ];

  for (let i = 0; i < 8; i++) {
    const user = allSalesUsers[i % allSalesUsers.length];
    const hoursAgo = i * 3 + Math.floor(Math.random() * 2); // Staggered times
    const saleDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: 'sale',
        entityType: 'order',
        changes: {
          amount: saleAmounts[i],
          currency: 'THB',
          productName: productNames[i],
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userAvatar: user.avatarUrl,
          status: 'completed',
        },
        ipAddress: `192.168.1.${100 + i}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: saleDate,
      },
    });
  }
  console.log('   Created 8 recent sales activity logs');

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Seeding completed successfully!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log('   • 1 Tenant (RGA Demo Company)');
  console.log('   • 1 Custom Role');
  console.log('   • 10 Users (4 core + 6 sales users with avatars)');
  console.log('   • 2 Integrations (Google, Facebook)');
  console.log('   • 4 Platform Accounts');
  console.log('   • 3 Campaigns');
  console.log('   • 14 Metrics (7 days x 2 campaigns)');
  console.log('   • 7 Web Analytics records');
  console.log('   • 3 Alert Rules');
  console.log('   • 2 Alerts + 2 Alert History');
  console.log('   • 3 Notifications');
  console.log('   • 1 Report Configuration');
  console.log('   • 2 Sync Logs');
  console.log('   • 10 Audit Logs (2 system + 8 recent sales)');
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Admin:   admin@rga.com / password123');
  console.log('   Manager: manager@rga.com / password123');
  console.log('   Client:  client@customer.com / password123');
  console.log('   Viewer:  viewer@rga.com / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });