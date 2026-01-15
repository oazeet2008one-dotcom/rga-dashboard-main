import { Campaign, DashboardMetricPoint } from '../types/api';

export const mockUserProfile = {
  id: 'user-mock-001',
  tenantId: 'tenant-mock',
  firstName: 'Kamonchanok',
  lastName: 'Suksawat',
  email: 'kamonchanok@risegroup.asia',
  title: 'Marketing Director',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80',
  phone: '+66 81 234 5678',
  location: 'Bangkok, TH',
  lastLogin: '19 Nov 2025 • 09:42',
  registeredAt: '12 Jan 2024 • 10:15',
  team: 'Performance Squad',
  timezone: 'Asia/Bangkok',
  language: 'en',
  bio: 'Leads omni-channel growth for Rise Group Asia with a focus on data-driven experimentation and creative performance.',
  social: {
    linkedin: 'https://linkedin.com/in/kamonchanok',
    line: '@risegroup',
    facebook: 'https://facebook.com/risegroupasia',
    website: 'https://www.risegroup.asia',
  },
};

export const mockCommerceRealtime = [
  { id: 'revenue', label: 'Total Revenue', value: '14', helper: '+5.3% from last period', positive: true },
  { id: 'orders', label: 'Total Orders', value: '$18.2K', helper: '+6.5% from last period', positive: true },
  { id: 'products', label: 'Products Sold', value: '1,486', helper: '+8.5% from last period', positive: true },
  { id: 'aov', label: 'Average Order Value', value: '225%', helper: '-6.5% from last period', positive: false },
];

export const mockOverviewRealtime = {
  Today: [
    { id: 'active-now', label: 'Active Now', value: '612', delta: '+4.3% vs yesterday', deltaTarget: '+1.8% vs target', positive: true },
    { id: 'sessions', label: 'Sessions', value: '9,421', delta: '+2.1% vs yesterday', deltaTarget: '-0.4% vs target', positive: true },
    { id: 'conversions', label: 'Conversions', value: '784', delta: '+1.8% vs yesterday', deltaTarget: '+0.9% vs target', positive: true },
    { id: 'dropoff', label: 'Drop-off', value: '14%', delta: '-0.6pp vs yesterday', deltaTarget: '-0.3pp vs target', positive: false },
  ],
  '7D': [
    { id: 'active-now', label: 'Active Now', value: '4,218', delta: '+6.2% WoW', deltaTarget: '+2.2% vs target', positive: true },
    { id: 'sessions', label: 'Sessions', value: '63,905', delta: '+5.4% WoW', deltaTarget: '+1.1% vs target', positive: true },
    { id: 'conversions', label: 'Conversions', value: '5,218', delta: '+4.2% WoW', deltaTarget: '-0.6% vs target', positive: true },
    { id: 'dropoff', label: 'Drop-off', value: '16%', delta: '-0.8pp WoW', deltaTarget: '+0.2pp vs target', positive: false },
  ],
  '30D': [
    { id: 'active-now', label: 'Active Now', value: '16,480', delta: '+12.1% MoM', deltaTarget: '+3.5% vs target', positive: true },
    { id: 'sessions', label: 'Sessions', value: '248,320', delta: '+10.5% MoM', deltaTarget: '+1.8% vs target', positive: true },
    { id: 'conversions', label: 'Conversions', value: '19,845', delta: '+8.7% MoM', deltaTarget: '-1.1% vs target', positive: true },
    { id: 'dropoff', label: 'Drop-off', value: '18%', delta: '-1.2pp MoM', deltaTarget: '+0.6pp vs target', positive: false },
  ],
};

export const mockCommerceProfitability = [
  { label: 'Budget', value: 60_000, color: '#60a5fa' },
  { label: 'Investment Cost', value: 40_000, color: '#ec4899' },
  { label: 'Sales Revenue', value: 50_000, color: '#f97316' },
  { label: 'Net Profit', value: 80_000, color: '#22c55e' },
];

export const mockCommerceConversionFunnel = [
  { label: 'Product Views', value: 100, color: '#f97316' },
  { label: 'Add to Cart Rate', value: 75, color: '#fb923c' },
  { label: 'Initiate Checkout Rate', value: 45, color: '#facc15' },
  { label: 'Purchase Rate', value: 25, color: '#a3e635' },
];

export const mockCommerceRevenueTrend = [
  { month: 'Jan', revenue: 40000, orders: 260 },
  { month: 'Feb', revenue: 35000, orders: 280 },
  { month: 'Mar', revenue: 46000, orders: 300 },
  { month: 'Apr', revenue: 44000, orders: 270 },
  { month: 'May', revenue: 47000, orders: 240 },
  { month: 'Jun', revenue: 42000, orders: 250 },
];

export const mockCommerceProductVideos = [
  {
    id: 'video-001',
    product: 'AeroFit Running Shoes',
    campaign: 'Spark Ads • Mega Sale',
    platform: 'TikTok',
    format: 'Vertical 9:16',
    length: '30s',
    views: 128_000,
    completionRate: '68%',
    ctr: '4.4%',
    revenue: 182_000,
    status: 'Active',
  },
  {
    id: 'video-002',
    product: 'LumiSkin Serum Duo',
    campaign: 'UGC Creators • Q4 Glow',
    platform: 'Instagram Reels',
    format: 'Vertical 9:16',
    length: '25s',
    views: 96_500,
    completionRate: '61%',
    ctr: '3.7%',
    revenue: 134_500,
    status: 'Learning',
  },
  {
    id: 'video-003',
    product: 'Nordic Home Diffuser',
    campaign: 'In-feed Conversion Burst',
    platform: 'Facebook',
    format: 'Square 1:1',
    length: '20s',
    views: 84_300,
    completionRate: '54%',
    ctr: '2.9%',
    revenue: 118_200,
    status: 'Paused',
  },
];

export const mockCommerceCreatives = [
  {
    id: 'creative-001',
    name: 'Search | Product A',
    type: 'Video',
    reach: 78_000,
    reactions: 820,
    cta: 'Shop',
  },
  {
    id: 'creative-002',
    name: 'Shopping | Electronics',
    type: 'Carousel',
    reach: 62_000,
    reactions: 640,
    cta: 'View',
  },
  {
    id: 'creative-003',
    name: 'Display | Retargeting',
    type: 'Banner',
    reach: 54_000,
    reactions: 420,
    cta: 'Learn',
  },
];

export const mockDashboardMetrics: DashboardMetricPoint[] = [
  { date: '2025-10-30', impressions: 110_320, clicks: 9_842, conversions: 768, spend: 372_000, revenue: 896_500 },
  { date: '2025-10-31', impressions: 118_910, clicks: 10_120, conversions: 794, spend: 381_400, revenue: 915_200 },
  { date: '2025-11-01', impressions: 125_540, clicks: 10_764, conversions: 825, spend: 395_100, revenue: 948_700 },
  { date: '2025-11-02', impressions: 130_220, clicks: 11_024, conversions: 856, spend: 402_300, revenue: 972_450 },
  { date: '2025-11-03', impressions: 127_880, clicks: 10_912, conversions: 843, spend: 398_250, revenue: 961_320 },
  { date: '2025-11-04', impressions: 133_410, clicks: 11_308, conversions: 874, spend: 407_980, revenue: 985_640 },
  { date: '2025-11-05', impressions: 138_120, clicks: 11_642, conversions: 899, spend: 416_500, revenue: 1_012_300 },
];

const now = new Date().toISOString();

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-fb-001',
    tenantId: 'tenant-mock',
    integrationId: 'int-facebook',
    externalId: 'FB-001',
    name: 'Facebook Awareness 11.11',
    platform: 'Facebook',
    status: 'active',
    objective: 'Awareness',
    budget: '150000',
    budgetType: 'daily',
    currency: 'THB',
    startDate: now,
    endDate: null,
    createdAt: now,
    updatedAt: now,
    metrics: [
      {
        id: 'metric-fb-001',
        tenantId: 'tenant-mock',
        campaignId: 'camp-fb-001',
        date: '2025-11-05',
        hour: null,
        platform: 'facebook',
        source: 'ads',
        impressions: 240_000,
        clicks: 18_500,
        conversions: 640,
        spend: '145000',
        organicTraffic: 0,
        bounceRate: '0.48',
        avgSessionDuration: 98,
        revenue: '425000',
        orders: 520,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        campaign: {
          id: 'camp-fb-001',
          name: 'Facebook Awareness 11.11',
          platform: 'Facebook',
        },
      },
    ],
  },
  {
    id: 'camp-google-002',
    tenantId: 'tenant-mock',
    integrationId: 'int-google',
    externalId: 'GG-778',
    name: 'Google Search Max Conversion',
    platform: 'Google Ads',
    status: 'active',
    objective: 'Leads',
    budget: '200000',
    budgetType: 'daily',
    currency: 'THB',
    startDate: now,
    endDate: null,
    createdAt: now,
    updatedAt: now,
    metrics: [
      {
        id: 'metric-google-002',
        tenantId: 'tenant-mock',
        campaignId: 'camp-google-002',
        date: '2025-11-05',
        hour: null,
        platform: 'google',
        source: 'search',
        impressions: 185_600,
        clicks: 14_420,
        conversions: 1_120,
        spend: '168200',
        organicTraffic: 0,
        bounceRate: '0.38',
        avgSessionDuration: 92,
        revenue: '224000',
        orders: 256,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        campaign: {
          id: 'camp-google-002',
          name: 'Google Search Max Conversion',
          platform: 'Google Ads',
        },
      },
    ],
  },
  {
    id: 'camp-line-003',
    tenantId: 'tenant-mock',
    integrationId: 'int-line',
    externalId: 'LINE-110',
    name: 'LINE OA Re-engagement',
    platform: 'LINE',
    status: 'learning',
    objective: 'Retention',
    budget: '90000',
    budgetType: 'lifetime',
    currency: 'THB',
    startDate: now,
    endDate: null,
    createdAt: now,
    updatedAt: now,
    metrics: [
      {
        id: 'metric-line-003',
        tenantId: 'tenant-mock',
        campaignId: 'camp-line-003',
        date: '2025-11-05',
        hour: null,
        platform: 'line',
        source: 'ads',
        impressions: 92_400,
        clicks: 7_820,
        conversions: 280,
        spend: '74500',
        organicTraffic: 0,
        bounceRate: '0.42',
        avgSessionDuration: 88,
        revenue: '165000',
        orders: 188,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        campaign: {
          id: 'camp-line-003',
          name: 'LINE OA Re-engagement',
          platform: 'LINE',
        },
      },
    ],
  },
  ];

export const mockCampaignSourceInsights = [
  {
    id: 'google',
    label: 'Google Ads',
    logo: 'https://cdn.simpleicons.org/google/ea4335',
    accent: '#ea4335',
    summary: [
      { id: 'gg-total', label: 'Total Campaigns', value: '14', delta: '+6.5% from last period', positive: true },
      { id: 'gg-spend', label: 'Total SpendRate', value: '$1.0K', delta: '+6.5% from last period', positive: true },
      { id: 'gg-conv', label: 'Total Conversions', value: '1,486', delta: '+6.5% from last period', positive: true },
      { id: 'gg-roi', label: 'Avg. ROI', value: '225%', delta: '-6.5% from last period', positive: false },
    ],
    campaigns: [
      { id: 'gg-c1', name: 'Search - Brand Terms', date: '15/11/2025', status: 'active', budget: 150_000, spent: 142_500, conversions: 312, roi: 156 },
      { id: 'gg-c2', name: 'Performance Max', date: '12/11/2025', status: 'active', budget: 200_000, spent: 168_200, conversions: 428, roi: 178 },
      { id: 'gg-c3', name: 'Display - Remarketing', date: '08/11/2025', status: 'paused', budget: 120_000, spent: 98_400, conversions: 186, roi: 134 },
      { id: 'gg-c4', name: 'YouTube - In-Stream', date: '05/11/2025', status: 'active', budget: 180_000, spent: 164_800, conversions: 298, roi: 142 },
      { id: 'gg-c5', name: 'Search - Competitor Terms', date: '02/11/2025', status: 'ended', budget: 110_000, spent: 107_800, conversions: 162, roi: 118 },
      { id: 'gg-c6', name: 'Performance Max - Holiday Promo', date: '30/10/2025', status: 'active', budget: 220_000, spent: 176_500, conversions: 452, roi: 184 },
      { id: 'gg-c7', name: 'YouTube - Shorts Reach', date: '28/10/2025', status: 'paused', budget: 140_000, spent: 62_300, conversions: 98, roi: 96 },
      { id: 'gg-c8', name: 'Discovery - Upper Funnel', date: '24/10/2025', status: 'ended', budget: 95_000, spent: 94_100, conversions: 124, roi: 102 },
      { id: 'gg-c9', name: 'Display - Lookalike Prospecting', date: '20/10/2025', status: 'active', budget: 130_000, spent: 112_700, conversions: 188, roi: 131 },
    ],
    ageRange: [
      { name: 'Search Brand 18-24', value: 18, color: '#ea580c' },
      { name: 'Performance Max 25-34', value: 32, color: '#fb923c' },
      { name: 'Display Remarketing 35-44', value: 28, color: '#fcd34d' },
      { name: 'YouTube In-Stream 45-54', value: 22, color: '#a3e635' },
    ],
    conversionRate: [
      { label: 'Search - Brand Terms', value: 4.2, color: '#ef4444' },
      { label: 'Performance Max', value: 3.8, color: '#f87171' },
      { label: 'Display - Remarketing', value: 2.6, color: '#fca5a5' },
      { label: 'YouTube - In-Stream', value: 3.1, color: '#fecaca' },
    ],
    genderDistribution: [
      { segment: 'Search Brand', male: 52, female: 68, unknown: 8 },
      { segment: 'Performance Max', male: 48, female: 72, unknown: 6 },
      { segment: 'Display Remarketing', male: 44, female: 64, unknown: 7 },
      { segment: 'YouTube In-Stream', male: 58, female: 78, unknown: 9 },
    ],
    adPerformance: [
      { campaign: 'Search Brand', spend: 2_140, impressions: 48_000, clicks: 1_680, ctr: 3.5, cpc: 0.31, cpm: 28 },
      { campaign: 'Performance Max', spend: 1_860, impressions: 52_000, clicks: 1_560, ctr: 3.0, cpc: 0.28, cpm: 25 },
      { campaign: 'Display Remarketing', spend: 1_420, impressions: 44_000, clicks: 1_320, ctr: 3.0, cpc: 0.26, cpm: 23 },
      { campaign: 'YouTube In-Stream', spend: 1_680, impressions: 46_000, clicks: 1_480, ctr: 3.2, cpc: 0.29, cpm: 27 },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook Ads',
    logo: 'https://cdn.simpleicons.org/facebook/3b82f6',
    accent: '#1877f2',
    summary: [
      { id: 'fb-total', label: 'Total Campaigns', value: '12', delta: '+4.1% from last period', positive: true },
      { id: 'fb-spend', label: 'Total SpendRate', value: '$1.2K', delta: '+2.3% from last period', positive: true },
      { id: 'fb-conv', label: 'Total Conversions', value: '1,248', delta: '+3.2% from last period', positive: true },
      { id: 'fb-roi', label: 'Avg. ROI', value: '215%', delta: '-2.1% from last period', positive: false },
    ],
    campaigns: [
      { id: 'fb-c1', name: 'Awareness Burst', date: '14/11/2025', status: 'active', budget: 180_000, spent: 142_000, conversions: 286, roi: 138 },
      { id: 'fb-c2', name: 'Prospecting - Q4', date: '12/11/2025', status: 'active', budget: 165_000, spent: 138_500, conversions: 254, roi: 126 },
      { id: 'fb-c3', name: 'Retention Flow', date: '09/11/2025', status: 'paused', budget: 120_000, spent: 84_200, conversions: 198, roi: 148 },
      { id: 'fb-c4', name: 'Mega Sale 11.11', date: '05/11/2025', status: 'paused', budget: 200_000, spent: 193_000, conversions: 402, roi: 162 },
      { id: 'fb-c5', name: 'Reels - Creative Test', date: '02/11/2025', status: 'active', budget: 130_000, spent: 108_300, conversions: 214, roi: 141 },
      { id: 'fb-c6', name: 'Catalog - Retargeting', date: '30/10/2025', status: 'active', budget: 155_000, spent: 129_900, conversions: 278, roi: 152 },
      { id: 'fb-c7', name: 'Lead Gen - Instant Form', date: '27/10/2025', status: 'ended', budget: 90_000, spent: 88_750, conversions: 166, roi: 117 },
      { id: 'fb-c8', name: 'Messenger - Click to Chat', date: '24/10/2025', status: 'paused', budget: 85_000, spent: 42_600, conversions: 72, roi: 93 },
      { id: 'fb-c9', name: 'Awareness - Always On', date: '18/10/2025', status: 'active', budget: 175_000, spent: 154_200, conversions: 240, roi: 129 },
    ],
    ageRange: [
      { name: 'Awareness 18-24', value: 31, color: '#ea580c' },
      { name: 'Prospecting 25-34', value: 29, color: '#fb923c' },
      { name: 'Retention 35-44', value: 21, color: '#fcd34d' },
      { name: 'Mega Sale 45-54', value: 19, color: '#a3e635' },
    ],
    conversionRate: [
      { label: 'Awareness Burst', value: 7.4, color: '#ea580c' },
      { label: 'Prospecting - Q4', value: 6.2, color: '#fb923c' },
      { label: 'Retention Flow', value: 5.6, color: '#fcd34d' },
      { label: 'Mega Sale 11.11', value: 8.9, color: '#a3e635' },
    ],
    genderDistribution: [
      { segment: 'Awareness Burst', male: 68, female: 92, unknown: 14 },
      { segment: 'Prospecting - Q4', male: 72, female: 86, unknown: 12 },
      { segment: 'Retention Flow', male: 58, female: 78, unknown: 18 },
      { segment: 'Mega Sale 11.11', male: 75, female: 94, unknown: 9 },
    ],
    adPerformance: [
      { campaign: 'Awareness Burst', spend: 2_300, impressions: 62_000, clicks: 1_980, ctr: 3.2, cpc: 0.38, cpm: 37 },
      { campaign: 'Prospecting - Q4', spend: 2_150, impressions: 58_000, clicks: 1_860, ctr: 3.2, cpc: 0.36, cpm: 35 },
      { campaign: 'Retention Flow', spend: 1_650, impressions: 40_000, clicks: 1_520, ctr: 3.8, cpc: 0.32, cpm: 28 },
      { campaign: 'Mega Sale 11.11', spend: 2_900, impressions: 72_000, clicks: 2_520, ctr: 3.5, cpc: 0.34, cpm: 40 },
    ],
    creatives: [
      { id: 'fb-cre-1', name: 'Story • Awareness', type: 'Story', reach: 68_000, reactions: 720, cta: 'Watch' },
      { id: 'fb-cre-2', name: 'Carousel • Mega Sale', type: 'Carousel', reach: 74_000, reactions: 910, cta: 'Shop' },
      { id: 'fb-cre-3', name: 'Reel • Retention', type: 'Reel', reach: 56_000, reactions: 610, cta: 'Learn' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok Ads',
    logo: 'https://cdn.simpleicons.org/tiktok/14b8a6',
    accent: '#14b8a6',
    summary: [
      { id: 'tt-total', label: 'Total Campaigns', value: '9', delta: '+3.0% from last period', positive: true },
      { id: 'tt-spend', label: 'Total SpendRate', value: '$980', delta: '+5.2% from last period', positive: true },
      { id: 'tt-conv', label: 'Total Conversions', value: '1,108', delta: '+7.1% from last period', positive: true },
      { id: 'tt-roi', label: 'Avg. ROI', value: '240%', delta: '+1.3% from last period', positive: true },
    ],
    campaigns: [
      { id: 'tt-c1', name: 'Spark Ads - Product A', date: '13/11/2025', status: 'active', budget: 160_000, spent: 122_000, conversions: 284, roi: 162 },
      { id: 'tt-c2', name: 'Creator Pack', date: '11/11/2025', status: 'active', budget: 150_000, spent: 110_000, conversions: 242, roi: 156 },
      { id: 'tt-c3', name: 'Always-on Reach', date: '08/11/2025', status: 'paused', budget: 120_000, spent: 86_000, conversions: 186, roi: 148 },
      { id: 'tt-c4', name: 'Live Shopping Push', date: '06/11/2025', status: 'active', budget: 130_000, spent: 94_000, conversions: 196, roi: 154 },
      { id: 'tt-c5', name: 'Spark Ads - Product B', date: '02/11/2025', status: 'active', budget: 140_000, spent: 118_500, conversions: 268, roi: 166 },
      { id: 'tt-c6', name: 'Creator Pack - UGC Mix', date: '30/10/2025', status: 'ended', budget: 95_000, spent: 92_200, conversions: 148, roi: 121 },
      { id: 'tt-c7', name: 'Always-on - Traffic', date: '27/10/2025', status: 'paused', budget: 110_000, spent: 58_400, conversions: 96, roi: 98 },
      { id: 'tt-c8', name: 'Live Shopping - Flash Deal', date: '24/10/2025', status: 'active', budget: 125_000, spent: 101_600, conversions: 214, roi: 158 },
      { id: 'tt-c9', name: 'TopView - Launch Burst', date: '18/10/2025', status: 'ended', budget: 180_000, spent: 176_900, conversions: 232, roi: 135 },
    ],
    ageRange: [
      { name: 'Spark Ads 18-24', value: 42, color: '#f97316' },
      { name: 'Creator Pack 25-34', value: 26, color: '#fb923c' },
      { name: 'Always-on 35-44', value: 18, color: '#facc15' },
      { name: 'Live Shopping 45-54', value: 14, color: '#84cc16' },
    ],
    conversionRate: [
      { label: 'Spark Ads', value: 10.4, color: '#f97316' },
      { label: 'Creator Pack', value: 8.8, color: '#fb923c' },
      { label: 'Always-on', value: 6.2, color: '#facc15' },
      { label: 'Live Shopping', value: 7.6, color: '#84cc16' },
    ],
    genderDistribution: [
      { segment: 'Spark Ads', male: 58, female: 94, unknown: 8 },
      { segment: 'Creator Pack', male: 52, female: 88, unknown: 10 },
      { segment: 'Always-on Reach', male: 64, female: 72, unknown: 14 },
      { segment: 'Live Shopping', male: 60, female: 82, unknown: 12 },
    ],
    adPerformance: [
      { campaign: 'Spark Ads', spend: 2_100, impressions: 48_000, clicks: 2_120, ctr: 4.4, cpc: 0.32, cpm: 30 },
      { campaign: 'Creator Pack', spend: 1_980, impressions: 45_000, clicks: 1_980, ctr: 4.4, cpc: 0.30, cpm: 28 },
      { campaign: 'Always-on Reach', spend: 1_620, impressions: 38_000, clicks: 1_540, ctr: 4.1, cpc: 0.29, cpm: 26 },
      { campaign: 'Live Shopping Push', spend: 1_840, impressions: 42_000, clicks: 1_760, ctr: 4.2, cpc: 0.30, cpm: 27 },
    ],
    creatives: [
      { id: 'tt-cre-1', name: 'Spark • Creator A', type: 'Spark', reach: 82_000, reactions: 1_020, cta: 'Shop' },
      { id: 'tt-cre-2', name: 'Live • Product Drop', type: 'Live', reach: 76_000, reactions: 940, cta: 'Join' },
      { id: 'tt-cre-3', name: 'UGC • Always-on', type: 'UGC', reach: 58_000, reactions: 810, cta: 'Learn' },
    ],
  },
  {
    id: 'line',
    label: 'LINE Ads',
    logo: 'https://cdn.simpleicons.org/line/16a34a',
    accent: '#16a34a',
    summary: [
      { id: 'ln-total', label: 'Total Campaigns', value: '10', delta: '+2.4% from last period', positive: true },
      { id: 'ln-spend', label: 'Total SpendRate', value: '$860', delta: '+1.8% from last period', positive: true },
      { id: 'ln-conv', label: 'Total Conversions', value: '986', delta: '+4.8% from last period', positive: true },
      { id: 'ln-roi', label: 'Avg. ROI', value: '210%', delta: '-1.2% from last period', positive: false },
    ],
    campaigns: [
      { id: 'ln-c1', name: 'OA Broadcast', date: '12/11/2025', status: 'active', budget: 120_000, spent: 98_500, conversions: 212, roi: 142 },
      { id: 'ln-c2', name: 'Line Points Booster', date: '10/11/2025', status: 'active', budget: 110_000, spent: 92_000, conversions: 198, roi: 148 },
      { id: 'ln-c3', name: 'Smart Channel', date: '08/11/2025', status: 'paused', budget: 100_000, spent: 78_000, conversions: 184, roi: 135 },
      { id: 'ln-c4', name: 'Shopping - Electronics', date: '05/11/2025', status: 'active', budget: 90_000, spent: 74_000, conversions: 168, roi: 144 },
      { id: 'ln-c5', name: 'OA Broadcast - Segment A', date: '02/11/2025', status: 'active', budget: 105_000, spent: 89_600, conversions: 190, roi: 151 },
      { id: 'ln-c6', name: 'Line Points - Weekend Boost', date: '30/10/2025', status: 'ended', budget: 85_000, spent: 82_700, conversions: 142, roi: 119 },
      { id: 'ln-c7', name: 'Smart Channel - Retarget', date: '27/10/2025', status: 'paused', budget: 92_000, spent: 51_200, conversions: 88, roi: 97 },
      { id: 'ln-c8', name: 'Shopping - Seasonal Promo', date: '24/10/2025', status: 'active', budget: 98_000, spent: 76_800, conversions: 156, roi: 139 },
      { id: 'ln-c9', name: 'OA Broadcast - Always On', date: '18/10/2025', status: 'ended', budget: 140_000, spent: 136_400, conversions: 228, roi: 132 },
    ],
    ageRange: [
      { name: 'OA Broadcast 18-24', value: 28, color: '#ea580c' },
      { name: 'Line Points 25-34', value: 32, color: '#fb923c' },
      { name: 'Smart Channel 35-44', value: 20, color: '#fcd34d' },
      { name: 'Shopping 45-54', value: 20, color: '#a3e635' },
    ],
    conversionRate: [
      { label: 'OA Broadcast', value: 6.8, color: '#22c55e' },
      { label: 'Line Points Booster', value: 7.6, color: '#4ade80' },
      { label: 'Smart Channel', value: 5.2, color: '#86efac' },
      { label: 'Shopping - Electronics', value: 6.1, color: '#bbf7d0' },
    ],
    genderDistribution: [
      { segment: 'OA Broadcast', male: 62, female: 82, unknown: 12 },
      { segment: 'Line Points Booster', male: 58, female: 88, unknown: 10 },
      { segment: 'Smart Channel', male: 54, female: 70, unknown: 11 },
      { segment: 'Shopping - Electronics', male: 60, female: 76, unknown: 9 },
    ],
    adPerformance: [
      { campaign: 'OA Broadcast', spend: 1_540, impressions: 38_000, clicks: 1_460, ctr: 3.8, cpc: 0.28, cpm: 24 },
      { campaign: 'Line Points Booster', spend: 1_480, impressions: 36_000, clicks: 1_380, ctr: 3.8, cpc: 0.27, cpm: 23 },
      { campaign: 'Smart Channel', spend: 1_320, impressions: 34_000, clicks: 1_240, ctr: 3.6, cpc: 0.26, cpm: 22 },
      { campaign: 'Shopping - Electronics', spend: 1_260, impressions: 32_000, clicks: 1_180, ctr: 3.7, cpc: 0.25, cpm: 21 },
    ],
    creatives: [
      { id: 'ln-cre-1', name: 'Broadcast • Automation', type: 'Message', reach: 48_000, reactions: 520, cta: 'Reply' },
      { id: 'ln-cre-2', name: 'Line Points • Promo', type: 'Points', reach: 52_000, reactions: 610, cta: 'Redeem' },
      { id: 'ln-cre-3', name: 'Smart Channel • Story', type: 'Story', reach: 44_000, reactions: 430, cta: 'View' },
    ],
  },
  ];

export const mockOverviewHighlights = [
  {
    id: 'new-leads',
    label: 'New Leads',
    value: '248',
    helper: '+18% WoW',
    accent: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600',
  },
  {
    id: 'avg-roas',
    label: 'Avg. ROAS',
    value: '4.2x',
    helper: 'Meets target',
    accent: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600',
  },
  {
    id: 'net-revenue',
    label: 'Net Revenue',
    value: 'THB 4.23M',
    helper: 'vs 30-day target THB 3.7M',
    accent: 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 text-orange-600',
  },
];

export const mockPlatformShare = [
  { name: 'Facebook', value: 32 },
  { name: 'Google', value: 41 },
  { name: 'LINE', value: 12 },
  { name: 'TikTok', value: 9 },
  { name: 'Shopee', value: 6 },
];

export const mockCampaignList = [
  {
    id: 'list-001',
    name: '11.11 Mega Brand Day',
    platform: 'TikTok',
    objective: 'Sales',
    spend: 185_000,
    revenue: 512_000,
    ctr: 2.4,
    cpa: 145,
    progress: 78,
    status: 'active',
  },
  {
    id: 'list-002',
    name: 'BFCM Prospecting',
    platform: 'Facebook',
    objective: 'Prospecting',
    spend: 132_500,
    revenue: 402_000,
    ctr: 1.9,
    cpa: 163,
    progress: 64,
    status: 'optimizing',
  },
  {
    id: 'list-003',
    name: 'Always-on Search',
    platform: 'Google',
    objective: 'Leads',
    spend: 98_400,
    revenue: 265_000,
    ctr: 3.4,
    cpa: 120,
    progress: 91,
    status: 'active',
  },
];

export const mockSeoSnapshots = {
  healthScore: 86,
  avgPosition: 7.2,
  organicSessions: 42_800,
  sessionTrend: [38_200, 39_600, 40_800, 41_900, 42_300, 43_500, 44_800],
  keywords: [
    { keyword: 'digital marketing agency thailand', position: 3, change: '+1', volume: 2400 },
    { keyword: 'line oa automation', position: 5, change: '+2', volume: 880 },
    { keyword: 'tiktok ads expert', position: 4, change: '0', volume: 1300 },
  ],
  channels: [
    { label: 'Organic', value: 62, color: '#f97316' },
    { label: 'Paid Search', value: 21, color: '#fb923c' },
    { label: 'Referral', value: 9, color: '#facc15' },
    { label: 'Social', value: 8, color: '#34d399' },
  ],
};

export const mockSeoRealtimeStats = [
  { id: 'seo-traffic', label: 'Organic Sessions', value: '5,200', delta: '+22.4% from last period', positive: true },
  { id: 'seo-goals', label: 'Goal Completions', value: '120', delta: '+18.5% from last period', positive: true },
  { id: 'seo-position', label: 'Avg. Position', value: '15', delta: '-2.3% from last period', positive: false },
  { id: 'seo-time', label: 'Avg. Time on Page', value: '1m 45s', delta: '+5s from last period', positive: true },
];

export const mockSeoTechnicalScores = [
  { label: 'Page Experience', value: 88, helper: '+4pp vs last month' },
  { label: 'Core Web Vitals', value: 82, helper: 'INP 190ms • CLS 0.06' },
  { label: 'Mobile Friendly', value: 94, helper: 'All templates validated' },
];

export const mockSeoKeywordsDetailed = [
  { keyword: 'elearning website templates', pos: 2, volume: 30, cpu: 500, traffic: 0 },
  { keyword: 'elearning website templates', pos: 5, volume: 50, cpu: 500, traffic: 0 },
  { keyword: 'elearning website templates', pos: 10, volume: 70, cpu: 500, traffic: 0 },
  { keyword: 'elearning website templates', pos: 12, volume: 90, cpu: 500, traffic: 0 },
  { keyword: 'elearning website templates', pos: 20, volume: 80, cpu: 500, traffic: 0 },
];

export const mockSeoCompetitors = [
  { name: 'uxfunl.com', competition: 0, keywords: 1, refDomains: 72 },
  { name: 'upfults.com', competition: 1, keywords: 3, refDomains: 72 },
  { name: 'themeforest.net', competition: 50, keywords: 70, refDomains: 72 },
  { name: 'creativeMarket.com', competition: 40, keywords: 72, refDomains: 72 },
];

export const mockSeoPositionDistribution = [
  { range: 'Top 1-3', value: 18 },
  { range: 'Top 4-10', value: 34 },
  { range: 'Top 11-20', value: 22 },
  { range: 'Beyond 20', value: 26 },
];

export const mockSeoBacklinkSummary = [
  { label: 'Referring domains', value: '320', helper: '+14 this week' },
  { label: 'New backlinks', value: '48', helper: '+6 vs last week' },
  { label: 'Do-follow ratio', value: '78%', helper: 'Healthy profile' },
  { label: 'Top anchor', value: 'rise group asia', helper: '12% share' },
];

export const mockSeoPages = [
  { url: '/insights/marketing-automation', impressions: 6_800, conversions: 142, trend: '+8%' },
  { url: '/playbooks/line-oa-guide', impressions: 4_920, conversions: 98, trend: '+5%' },
  { url: '/blog/tiktok-creative-lab', impressions: 3_740, conversions: 74, trend: '+2%' },
  { url: '/resources/roi-dashboard', impressions: 2_910, conversions: 62, trend: '-1%' },
];

export const mockSeoCompetitiveMap = [
  { brand: 'RGA', share: 78, authority: 86, color: '#f97316' },
  { brand: 'Mayworks', share: 64, authority: 80, color: '#fb923c' },
  { brand: 'AdSpark', share: 52, authority: 72, color: '#facc15' },
  { brand: 'BoostLab', share: 48, authority: 65, color: '#34d399' },
];

export const mockSeoConversionSummary = {
  total: 1_130,
  goalName: 'Register SEO Conversions',
  delta: '+6.3% vs last week',
  breakdown: [
    { label: 'Organic', value: 620, color: '#f97316' },
    { label: 'Paid Search', value: 320, color: '#fb923c' },
    { label: 'Referral', value: 110, color: '#facc15' },
    { label: 'Social', value: 80, color: '#34d399' },
  ],
};

export const mockSeoIssues = [
  { label: 'Index coverage', value: '98%', helper: 'All priority pages indexed', positive: true },
  { label: 'Backlog issues', value: '12 open', helper: '4 technical • 8 content', positive: false },
  { label: 'Avg. load time', value: '1.4s', helper: 'Improved 0.2s WoW', positive: true },
];

export const mockSeoAuthorityScores = [
  { label: 'UR', value: 90, helper: 'URL Rating' },
  { label: 'DR', value: 50, helper: 'Domain Rating' },
];

export const mockSeoBacklinkHighlights = {
  totalBacklinks: 548,
  referringDomains: 320,
  keywords: 18,
  trafficCost: '$1.4K',
};

export const mockSeoOrganicSearch = {
  keywords: 18,
  trafficCost: '$1.4K',
  traffic: '52',
};

export const mockSeoAnchors = [
  { anchor: '<a> hero text-a </a>', percent: 25 },
  { anchor: 'go now', percent: 20 },
  { anchor: 'htmltemplates.org', percent: 20 },
];

export const mockSeoReferringDomains = [
  { label: 'Referring domains', value: 72, percent: 100 },
  { label: 'Referring pages', value: 440, percent: 100 },
  { label: 'Referring IPs', value: 57, percent: 100 },
  { label: 'Referring subnets', value: 53, percent: 100 },
];

export const mockSeoRegionalPerformance = [
  { region: 'BKK', value: 28, color: '#f97316' },
  { region: 'CNX', value: 18, color: '#fb923c' },
  { region: 'HKT', value: 16, color: '#fde047' },
  { region: 'SKA', value: 14, color: '#4ade80' },
  { region: 'NMA', value: 12, color: '#38bdf8' },
  { region: 'CBR', value: 12, color: '#a855f7' },
];

export const mockSeoRightRailStats = [
  { label: 'Crawled pages', value: '528' },
  { label: 'Referring domains', value: '0 • 100%' },
  { label: 'Dofollow', value: '0 • 100%' },
  { label: 'Governmental', value: '0 • 100%' },
  { label: 'Educational', value: '0 • 100%' },
  { label: 'Referring pages', value: '440 • 100%' },
  { label: 'Referring IPs', value: '57 • 100%' },
  { label: 'Referring subnets', value: '53 • 100%' },
  { label: 'Backlink', value: '0 • 100%' },
];

export const mockSeoUrlRatings = [
  { label: '81-100', value: 1, percent: '1%' },
  { label: '61-80', value: 2, percent: '2%' },
  { label: '41-60', value: 0, percent: '0%' },
  { label: '21-40', value: 0, percent: '0%' },
  { label: '1-20', value: 91, percent: '92%' },
];

export const mockCommerceInsights = {
  summary: [
    { label: 'Orders', value: '1,284', helper: '+22% MoM' },
    { label: 'AOV', value: 'THB 1,530', helper: '+5% MoM' },
    { label: 'Return Rate', value: '1.8%', helper: '-0.4pp' },
    { label: 'Gross Profit', value: 'THB 2.18M', helper: '+14% MoM' },
  ],
  topProducts: [
    { name: 'RGA Performance Kit', revenue: 428_000, orders: 186, conversionRate: 3.2 },
    { name: 'Omni-channel Playbook', revenue: 285_400, orders: 212, conversionRate: 4.5 },
    { name: 'Automation Workshop', revenue: 244_900, orders: 118, conversionRate: 2.9 },
  ],
};

export const mockProductPerformance = [
  { name: 'Wireless Earbuds Pro', category: 'Electronics', sales: 1234, revenue: 45_678, stock: 45, status: 'Best Seller' },
  { name: 'Smart Watch Series 5', category: 'Electronics', sales: 987, revenue: 34_846, stock: 23, status: 'Top Product' },
  { name: 'Premium Phone Case', category: 'Accessories', sales: 756, revenue: 12_340, stock: 156, status: 'Top Product' },
  { name: 'USB-C Cable 2m', category: 'Accessories', sales: 745, revenue: 8_934, stock: 234, status: 'Performing' },
  { name: 'Laptop Stand Aluminum', category: 'Office', sales: 123, revenue: 3_456, stock: 67, status: 'Underperforming' },
  { name: 'Bluetooth Speaker Mini', category: 'Electronics', sales: 89, revenue: 2_134, stock: 12, status: 'Underperforming' },
];

export const mockCrmPipeline = [
  { stage: 'New', leads: 132, value: 'THB 3.1M', trend: '+9%' },
  { stage: 'Qualified', leads: 96, value: 'THB 2.4M', trend: '+4%' },
  { stage: 'Proposal', leads: 58, value: 'THB 1.9M', trend: '+2%' },
  { stage: 'Closed Won', leads: 26, value: 'THB 1.1M', trend: '+12%' },
];

export const mockCrmRealtime = [
  { id: 'crm-campaigns', label: 'Total Campaigns', value: '14', delta: '+6.5% from last period', positive: true },
  { id: 'crm-spend', label: 'Total SpendRate', value: '$18.2K', delta: '+6.5% from last period', positive: true },
  { id: 'crm-conversions', label: 'Total Conversions', value: '1,486', delta: '+6.5% from last period', positive: true },
  { id: 'crm-roi', label: 'Avg. ROI', value: '225%', delta: '-6.5% from last period', positive: false },
];

export const mockCrmStages = [
  { label: 'New', value: 1.2, color: '#3b82f6' },
  { label: 'In Progress', value: 2.4, color: '#fbbf24' },
  { label: 'Converted', value: 1.8, color: '#22c55e' },
];

export const mockCrmAgeRange = [
  { label: 'Enterprise', customers: 145, value: '$250K', roi: '10%', color: '#f97316' },
  { label: 'Mid-Market', customers: 287, value: '$180K', roi: '20%', color: '#fb923c' },
  { label: 'Small Business', customers: 312, value: '$150K', roi: '35%', color: '#fde047' },
  { label: 'Startup', customers: 324, value: '$80K', roi: '22%', color: '#4ade80' },
  { label: 'Individual', customers: 198, value: '$10K', roi: '14%', color: '#22d3ee' },
];

export const mockCrmLeads = [
  { lead: 'Sarah Johnson', company: 'Tech Corp', source: 'Website', status: 'New', value: '$15,000', date: '12/11/2025' },
  { lead: 'Michael Chen', company: 'StartupIO', source: 'Referral', status: 'In Progress', value: '$23,000', date: '10/11/2025' },
  { lead: 'Emily Davis', company: 'Enterprise Ltd', source: 'Social Media', status: 'Converted', value: '$45,000', date: '08/11/2025' },
  { lead: 'James Wilson', company: 'BizCo', source: 'Email Campaign', status: 'In Progress', value: '$18,000', date: '08/11/2025' },
  { lead: 'Lisa Anderson', company: 'Global Inc', source: 'Website', status: 'New', value: '$32,000', date: '11/11/2025' },
  { lead: 'David Martinez', company: 'Solutions Co', source: 'Direct', status: 'Converted', value: '$55,000', date: '05/11/2025' },
  { lead: 'Amanda Taylor', company: 'Ventures Inc', source: 'Referral', status: 'Lost', value: '$12,000', date: '27/11/2025' },
];

export const mockTrendInsights = [
  { label: 'Spend vs Revenue', change: '+18%', detail: 'Better ROAS across paid social the last 7 days.' },
  { label: 'Organic Traffic', change: '+12%', detail: 'Content hub refresh drives sustained organic traffic.' },
  { label: 'Leads Conversion', change: '+6%', detail: 'Improved qualification on CRM automation sequences.' },
];

export const mockTrendRealtime = [
  { id: 'trend-leads', label: 'Total Leads', value: '1,621', delta: '+22.4% from last period', positive: true },
  { id: 'trend-revenue', label: 'Total Revenue', value: '$86K', delta: '+18.5% from last period', positive: true },
  { id: 'trend-conversion', label: 'Conversion Rate', value: '15.8%', delta: '-3.3% from last period', positive: false },
  { id: 'trend-time', label: 'Avg. Time Convert', value: '45 Days', delta: '+5 Days from last period', positive: true },
];

export const mockTrendRevenueByChannel = [
  { channel: 'Google Ads', revenue: 120, cost: 90 },
  { channel: 'Facebook', revenue: 100, cost: 75 },
  { channel: 'LINE Ads', revenue: 85, cost: 62 },
  { channel: 'TikTok', revenue: 94, cost: 58 },
  { channel: 'Organic', revenue: 72, cost: 40 },
];

export const mockTrendSalesFunnel = [
  { stage: 'Awareness', value: 2200 },
  { stage: 'Interest', value: 1800 },
  { stage: 'Validate', value: 1200 },
  { stage: 'Purchase', value: 640 },
];

export const mockTrendRevenueTrend = [
  { month: 'Jan', revenue: 24000 },
  { month: 'Feb', revenue: 26000 },
  { month: 'Mar', revenue: 32000 },
  { month: 'Apr', revenue: 38000 },
  { month: 'May', revenue: 41000 },
  { month: 'Jun', revenue: 36000 },
  { month: 'Jul', revenue: 42000 },
  { month: 'Aug', revenue: 48000 },
  { month: 'Sep', revenue: 54000 },
  { month: 'Oct', revenue: 50000 },
  { month: 'Nov', revenue: 46000 },
];

export const mockTrendLeadSources = [
  { source: 'Google Ads', leads: 320, cost: 12000, revenue: 30000, roi: '150%' },
  { source: 'Facebook', leads: 320, cost: 12000, revenue: 18000, roi: '105%' },
  { source: 'LINE Ads', leads: 280, cost: 8000, revenue: 7000, roi: '90%' },
  { source: 'TikTok', leads: 280, cost: 10000, revenue: 10000, roi: '0%' },
  { source: 'Organic', leads: 101, cost: 0, revenue: 9000, roi: '∞' },
  { source: 'Referral', leads: 320, cost: 0, revenue: 12000, roi: 'N/A' },
];

export const mockTrendSalesReps = [
  { rep: 'John S.', leadsAssigned: 500, conversionRate: '8.5%', revenue: '$35,000' },
  { rep: 'Sarah T.', leadsAssigned: 400, conversionRate: '9.3%', revenue: '$26,000' },
  { rep: 'Mark L.', leadsAssigned: 360, conversionRate: '5.3%', revenue: '$19,000' },
  { rep: 'Anna K.', leadsAssigned: 300, conversionRate: '4.5%', revenue: '$10,000' },
  { rep: 'David P.', leadsAssigned: 200, conversionRate: '6.0%', revenue: '$6,000' },
];

export const mockSettingsShortcuts = [
  { label: 'Integrations', status: 'Connected (4/6)', helper: 'Google, Facebook, LINE, TikTok' },
  { label: 'Alerts & Thresholds', status: '2 active alerts', helper: 'CTR Drift, ROAS Drop' },
  { label: 'Team Access', status: '8 members', helper: 'Last invite 2 days ago' },
];

export const mockReportAutomation = [
  { id: 'rep-01', name: 'Executive Monday Snapshot', type: 'PDF', schedule: 'Every Monday • 08:00', status: 'Scheduled' },
  { id: 'rep-02', name: 'Channel Deep Dive', type: 'Spreadsheet', schedule: '1st of month • 09:00', status: 'Scheduled' },
  { id: 'rep-03', name: 'CRM Pipeline Pulse', type: 'Slack', schedule: 'Daily • 18:00', status: 'Automation' },
];

export const mockReportBuilders = {
  builders: [
    { id: 'report', name: 'Name Report', menu: 'Campaign', dateRange: 'Last 30 days', format: ['PDF', 'CSV', 'XLSX', 'DOCX'] },
  ],
  schedule: {
    name: 'Name Report',
    menu: 'Campaign',
    dateRange: 'Last 30 days',
    scheduleTime: '08:00',
    recipients: ['ops@rga.com', 'exec@rga.com'],
    format: ['PDF', 'CSV', 'XLSX', 'DOCX'],
  },
};

export const mockReportStatus = [
  { name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'Admin', status: 'Scheduled', date: '12/11/2025' },
  { name: 'Michael Chen', email: 'michael@startup.io', role: 'Admin', status: 'Scheduled', date: '12/11/2025' },
  { name: 'Emily Davis', email: 'emily@enterprise.com', role: 'Executive', status: 'Download', date: '12/11/2025' },
  { name: 'James Wilson', email: 'jwilson@bizco.com', role: 'Admin', status: 'Notified', date: '12/11/2025' },
  { name: 'Lisa Anderson', email: 'lisa@global.com', role: 'Analyst', status: 'Download', date: '12/11/2025' },
  { name: 'David Martinez', email: 'david@solutions.com', role: 'Analyst', status: 'Notified', date: '12/11/2025' },
  { name: 'Amanda Taylor', email: 'amanda@ventures.com', role: 'Analyst', status: 'Notified', date: '12/11/2025' },
];

export const mockNotifications = [
  { id: 'noti-1', title: 'ROAS Drop Alert', message: 'Facebook Prospecting campaign ROAS fell 12% vs yesterday.', time: '5m ago', severity: 'warning' },
  { id: 'noti-2', title: 'Organic Spike', message: 'SEO & Web traffic is +18% WoW after content refresh.', time: '18m ago', severity: 'success' },
  { id: 'noti-3', title: 'Budget Threshold', message: 'Google Search Max Conversion is at 92% of monthly budget.', time: '1h ago', severity: 'info' },
];

export const mockSettingsKpis = [
  { id: 'kpi-1', alertName: 'MENU Dashboard', metric: 'Active Now', condition: '>', threshold: '1,500', status: 'active' },
  { id: 'kpi-2', alertName: 'MENU E-commerce', metric: 'Total Revenue', condition: '>', threshold: '$120K', status: 'inactive' },
  { id: 'kpi-3', alertName: 'MENU Trend Analysis', metric: 'Total Leads', condition: '>', threshold: '800', status: 'active' },
  { id: 'kpi-4', alertName: 'MENU SEO & Web', metric: 'Metric Organic', condition: '<', threshold: 'Top 10', status: 'inactive' },
];

export const mockSettingsBranding = {
  theme: 'White',
  accentColor: '#f97316',
  menuColor: '#191919',
  companyName: 'Rise Group Asia',
};

export const mockSettingsRefresh = {
  frequency: 'Every 5 minutes',
  manual: true,
  realtime: true,
};

export const mockSettingsIntegrations = [
  { id: 'google', name: 'Google', status: 'Connected', syncedAt: '2m ago' },
  { id: 'facebook', name: 'Facebook', status: 'Connected', syncedAt: '5m ago' },
  { id: 'tiktok', name: 'TikTok', status: 'Connect', syncedAt: 'Not linked' },
  { id: 'line', name: 'LINE', status: 'Connect', syncedAt: 'Not linked' },
];

export const mockSettingsUsers = [
  { id: 'user-1', name: 'Kantichai Piyakaram', email: 'ounztech@gmail.com', role: 'Admin', status: 'Active' },
  { id: 'user-2', name: 'Kantichai Piyakaram', email: 'ounztech@gmail.com', role: 'Admin', status: 'Active' },
];

export const mockSettingsAlerts = {
  alertTypes: [
    { label: 'KPI Threshold Alerts', enabled: true },
    { label: 'Data Sync Status', enabled: true },
    { label: 'Budget Alerts', enabled: false },
    { label: 'Anomaly Detection', enabled: true },
  ],
  deliveryChannels: [
    { label: 'In-app Notifications', enabled: true },
    { label: 'Email Notifications', enabled: true },
    { label: 'SMS Alerts (Critical Only)', enabled: false },
  ],
  recipients: [],
};

export const mockRealtimeStats = [
  { id: 'active-now', label: 'Active Now', value: '563', delta: '+6.5% from last period', positive: true },
  { id: 'active-users', label: 'Active Users', value: '8,234', delta: '+6.5% from last period', positive: true },
  { id: 'session-time', label: 'Avg. Session Time', value: '3m 24s', delta: '+6.5% from last period', positive: true },
  { id: 'bounce-rate', label: 'Bounce Rate', value: '42.3%', delta: '-6.5% from last period', positive: false },
];

export const mockFinancialOverview = {
  roi: '150%',
  roiChange: '+5.8%',
  revenue: 2_450_000,
  revenueChange: '+8.2%',
  profit: 1_470_000,
  profitChange: '+12.1%',
  cost: 980_000,
  costChange: '+3.4%',
  breakdown: [
    { name: 'Revenue', value: 2_450_000, color: '#36c96c' },
    { name: 'Profit', value: 1_470_000, color: '#082debff' },
    { name: 'Cost', value: 980_000, color: '#ea9729ff' },
  ],
};

export const mockConversionFunnel = [
  { label: 'Active Users', value: 45, color: '#f42e2eff' },
  { label: 'New Leads', value: 30, color: '#eab308' },
  { label: 'Conversion', value: 15, color: '#22c55e' },
];

export const mockLtvTrend = [
  { label: 'Week 1', ltv: 520, cac: 180 },
  { label: 'Week 2', ltv: 560, cac: 190 },
  { label: 'Week 3', ltv: 590, cac: 195 },
  { label: 'Week 4', ltv: 625, cac: 200 },
];

export const mockConversionPlatforms = [
  { platform: 'Facebook', value: 320 },
  { platform: 'Google', value: 280 },
  { platform: 'Google Analytics', value: 210 },
  { platform: 'LINE', value: 140 },
  { platform: 'TikTok', value: 120 },
];

export const ltvCacData = [
  { week: 'Week 1', ltv: 520, cac: 180 },
  { week: 'Week 2', ltv: 560, cac: 190 },
  { week: 'Week 3', ltv: 590, cac: 195 },
  { week: 'Week 4', ltv: 625, cac: 200 },
];

export const ltvCacColors = {
  ltv: '#1E8449', // เขียวเข้ม (มูลค่า)
  cac: '#EB984E', // ส้มแดง (ต้นทุน)
  goal: '#B2BEC3', // เทาอ่อน (เส้นเป้าหมาย)
};

export const currentGoal = 3.0; // เป้าหมาย LTV:CAC Ratio

export const mockProfileConnections = [
  { id: 'google', name: 'Google Ads', status: 'Connected', lastSync: '2 hrs ago' },
  { id: 'facebook', name: 'Facebook Marketing API', status: 'Connected', lastSync: '45 mins ago' },
  { id: 'line', name: 'LINE OA', status: 'Sync pending', lastSync: 'Preparing connection' },
  { id: 'tiktok', name: 'TikTok Ads', status: 'Connected', lastSync: '5 hrs ago' },
];

export const mockProfileSecurity = [
  { id: 'login-1', location: 'Bangkok, Thailand', device: 'Chrome • Windows', time: '19 Nov 2025, 09:45' },
  { id: 'login-2', location: 'Bangkok, Thailand', device: 'Safari • iPhone', time: '18 Nov 2025, 22:13' },
  { id: 'login-3', location: 'Singapore', device: 'Chrome • MacOS', time: '17 Nov 2025, 14:32' },
];

export const mockNotificationPreferences = [
  {
    id: 'alerts',
    label: 'Critical Alerts',
    description: 'Notify when integrations fail or spend spikes beyond threshold',
    channel: 'Email & LINE',
    enabled: true,
  },
  {
    id: 'digest',
    label: 'Weekly Digest',
    description: 'Executive summary delivered every Monday morning',
    channel: 'Email',
    enabled: true,
  },
  {
    id: 'tips',
    label: 'Product Tips',
    description: 'Feature updates and beta invites from RGA Platform',
    channel: 'Email',
    enabled: false,
  },
];
