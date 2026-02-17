import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function stableNumber(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function upsertDailySeoForTenant(tenantId: string, date: Date) {
  const day = toUtcDateOnly(date);
  const key = `${day.toISOString().slice(0, 10)}`;

  const base = stableNumber(`${tenantId}:${key}`);

  const sessions = Math.floor(2500 + base * 7500);
  const newUsers = Math.floor(sessions * (0.25 + stableNumber(`${tenantId}:${key}:nu`) * 0.2));
  const bounceRate = clamp(0.25 + stableNumber(`${tenantId}:${key}:br`) * 0.25, 0.2, 0.75);
  const avgSessionDuration = clamp(90 + stableNumber(`${tenantId}:${key}:asd`) * 180, 30, 600);

  const existingDaily = await prisma.webAnalyticsDaily.findFirst({
    where: {
      tenantId,
      propertyId: 'GA4-SEO',
      date: day,
    },
    select: { id: true },
  });

  const dailyData = {
    sessions,
    newUsers,
    activeUsers: Math.floor(sessions * 0.8),
    screenPageViews: sessions * 3,
    engagementRate: new Prisma.Decimal(String(clamp(1 - bounceRate, 0, 1))),
    bounceRate: new Prisma.Decimal(String(bounceRate)),
    avgSessionDuration: new Prisma.Decimal(String(avgSessionDuration)),
    isMockData: false,
  };

  if (existingDaily) {
    await prisma.webAnalyticsDaily.update({
      where: { id: existingDaily.id },
      data: dailyData,
    });
  } else {
    await prisma.webAnalyticsDaily.create({
      data: {
        tenantId,
        propertyId: 'GA4-SEO',
        date: day,
        ...dailyData,
      },
    });
  }

  const keywordsTotal = Math.floor(3000 + stableNumber(`${tenantId}:${key}:kwtotal`) * 12000);
  const trafficCost = Math.floor((sessions * 0.8) * (0.4 + stableNumber(`${tenantId}:${key}:tcc`) * 1.2));

  const existingOffpage = await prisma.seoOffpageMetricSnapshots.findFirst({
    where: { tenantId, date: day },
    select: { id: true },
  });

  const ur = Number((20 + stableNumber(`${tenantId}:${key}:ur`) * 60).toFixed(1));
  const dr = Number((25 + stableNumber(`${tenantId}:${key}:dr`) * 55).toFixed(1));
  const backlinks = Math.floor(2000 + stableNumber(`${tenantId}:${key}:bl`) * 800);
  const referringDomains = Math.floor(150 + stableNumber(`${tenantId}:${key}:rd`) * 200);
  const keywords = Math.floor(500 + stableNumber(`${tenantId}:${key}:kw`) * 1500);
  const trafficCostOffpage = Math.floor(1000 + stableNumber(`${tenantId}:${key}:tc`) * 5000);
  const organicTraffic = Math.floor(sessions * 0.7);
  const organicTrafficValue = Math.floor(Math.floor(sessions * 0.7) * (2 + stableNumber(`${tenantId}:${key}:otv`) * 8));

  const offpageData = {
    ur,
    dr,
    backlinks,
    referringDomains,
    keywords,
    trafficCost: trafficCostOffpage,
    organicTraffic,
    organicTrafficValue,
    newReferringDomains: Math.floor(referringDomains * 0.1),
    newBacklinks: Math.floor(backlinks * 0.08),
    lostReferringDomains: Math.floor(referringDomains * 0.05),
    lostBacklinks: Math.floor(backlinks * 0.04),
  };

  if (existingOffpage) {
    await prisma.seoOffpageMetricSnapshots.update({
      where: { id: existingOffpage.id },
      data: offpageData,
    });
  } else {
    await prisma.seoOffpageMetricSnapshots.create({
      data: {
        tenantId,
        date: day,
        ...offpageData,
      },
    });
  }

  const intents = [
    { type: 'branded', kwShare: 0.18, trShare: 0.28 },
    { type: 'non_branded', kwShare: 0.82, trShare: 0.72 },
    { type: 'informational', kwShare: 0.42, trShare: 0.38 },
    { type: 'navigational', kwShare: 0.08, trShare: 0.09 },
    { type: 'commercial', kwShare: 0.30, trShare: 0.33 },
    { type: 'transactional', kwShare: 0.20, trShare: 0.20 },
  ];

  for (const intent of intents) {
    const kw = Math.floor(keywordsTotal * intent.kwShare * (0.9 + stableNumber(`${tenantId}:${key}:${intent.type}:kw`) * 0.2));
    const tr = Math.floor(sessions * intent.trShare * (0.9 + stableNumber(`${tenantId}:${key}:${intent.type}:tr`) * 0.2));

    const existingIntent = await prisma.seoSearchIntent.findFirst({
      where: { tenantId, date: day, type: intent.type },
      select: { id: true },
    });

    if (existingIntent) {
      await prisma.seoSearchIntent.update({
        where: { id: existingIntent.id },
        data: { keywords: kw, traffic: tr },
      });
    } else {
      await prisma.seoSearchIntent.create({
        data: {
          tenantId,
          date: day,
          type: intent.type,
          keywords: kw,
          traffic: tr,
        },
      });
    }
  }

  const keywordBase = [
    'rga marketing',
    'seo dashboard',
    'marketing analytics',
    'performance report',
    'digital marketing agency',
    'seo audit',
    'keyword research',
    'technical seo',
    'backlink analysis',
    'organic traffic',
  ];

  const topKeywords = keywordBase.map((kw, i) => {
    const pos = clamp(2 + stableNumber(`${tenantId}:${key}:pos:${i}`) * 40, 1, 100);
    const volume = Math.floor(500 + stableNumber(`${tenantId}:${key}:vol:${i}`) * 15000);
    const traffic = Math.floor((sessions * 0.12) * (1 - i * 0.07) * (0.85 + stableNumber(`${tenantId}:${key}:ktr:${i}`) * 0.3));
    return {
      tenantId,
      date: day,
      keyword: i === 0 ? `${kw}` : `${kw} ${i}`,
      position: Number(pos.toFixed(1)),
      volume,
      traffic: Math.max(0, traffic),
      url: `https://example.com/seo/${i + 1}`,
    };
  });

  const trafficTotal = topKeywords.reduce((sum, r) => sum + r.traffic, 0) || 1;
  const topKeywordsFinal = topKeywords.map((r, i) => ({
    ...r,
    trafficPercentage: Number(((r.traffic / trafficTotal) * 100).toFixed(1)),
    change: Math.floor((stableNumber(`${tenantId}:${key}:chg:${i}`) - 0.5) * 6),
    cpc: Number((0.5 + stableNumber(`${tenantId}:${key}:cpc:${i}`) * 4.5).toFixed(2)),
  }));

  await prisma.seoTopKeywords.deleteMany({ where: { tenantId, date: day } });
  await prisma.seoTopKeywords.createMany({ data: topKeywordsFinal });

  const anchorsBase = [
    'rga',
    'marketing',
    'seo',
    'analytics',
    'dashboard',
    'report',
    'pricing',
    'contact',
    'case study',
    'learn more',
  ];

  const anchorRows = anchorsBase.map((a, i) => {
    const domains = Math.floor(5 + stableNumber(`${tenantId}:${key}:adom:${i}`) * (referringDomains * 0.25));
    const totalBacklinks = Math.floor(domains * (1 + stableNumber(`${tenantId}:${key}:ablm:${i}`) * 8));
    const dofollowBacklinks = Math.floor(totalBacklinks * clamp(0.55 + stableNumber(`${tenantId}:${key}:adof:${i}`) * 0.35, 0, 1));
    const traffic = Math.floor((sessions * 0.08) * (1 - i * 0.06) * (0.9 + stableNumber(`${tenantId}:${key}:atr:${i}`) * 0.2));
    return {
      tenantId,
      date: day,
      anchorText: a,
      domains,
      totalBacklinks,
      dofollowBacklinks,
      referringDomains: domains,
      traffic: Math.max(0, traffic),
    };
  });

  const anchorTrafficTotal = anchorRows.reduce((s, r) => s + r.traffic, 0) || 1;
  const anchorFinal = anchorRows.map(r => ({
    ...r,
    trafficPercentage: Number(((r.traffic / anchorTrafficTotal) * 100).toFixed(1)),
  }));

  await prisma.seoAnchorText.deleteMany({ where: { tenantId, date: day } });
  await prisma.seoAnchorText.createMany({ data: anchorFinal });

  const locations = [
    { location: 'Bangkok, TH', share: 0.28 },
    { location: 'Chiang Mai, TH', share: 0.08 },
    { location: 'Phuket, TH', share: 0.06 },
    { location: 'New York, US', share: 0.05 },
    { location: 'Los Angeles, US', share: 0.04 },
    { location: 'London, GB', share: 0.04 },
    { location: 'Singapore, SG', share: 0.04 },
    { location: 'Tokyo, JP', share: 0.04 },
    { location: 'Kuala Lumpur, MY', share: 0.03 },
    { location: 'Sydney, AU', share: 0.02 },
  ];

  for (let i = 0; i < locations.length; i++) {
    const l = locations[i];
    const traffic = Math.floor(sessions * l.share * (0.9 + stableNumber(`${tenantId}:${key}:loc:${i}`) * 0.2));
    const kw = Math.floor((keywordsTotal * l.share) * (0.9 + stableNumber(`${tenantId}:${key}:lockw:${i}`) * 0.2));

    const existingLoc = await prisma.seoTrafficByLocation.findFirst({
      where: { tenantId, date: day, location: l.location },
      select: { id: true },
    });

    const locData = {
      traffic,
      trafficPercentage: Number((l.share * 100).toFixed(1)),
      keywords: kw,
    };

    if (existingLoc) {
      await prisma.seoTrafficByLocation.update({
        where: { id: existingLoc.id },
        data: locData,
      });
    } else {
      await prisma.seoTrafficByLocation.create({
        data: {
          tenantId,
          date: day,
          location: l.location,
          ...locData,
        },
      });
    }
  }
}

async function main() {
  const tenantIdArg = process.argv.find(a => a.startsWith('--tenantId='));
  const daysArg = process.argv.find(a => a.startsWith('--days='));
  const yesterdayOnly = process.argv.includes('--yesterday');

  const tenantId = tenantIdArg ? tenantIdArg.split('=')[1] : undefined;
  const days = daysArg ? Math.max(1, Number(daysArg.split('=')[1])) : 30;

  const tenants = tenantId
    ? await prisma.tenant.findMany({ where: { id: tenantId }, select: { id: true, name: true } })
    : await prisma.tenant.findMany({ select: { id: true, name: true } });

  if (tenants.length === 0) {
    console.log('[backfill-seo-rollup] no tenants found');
    return;
  }

  const now = new Date();
  const todayUtc = toUtcDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));

  if (yesterdayOnly) {
    const y = addUtcDays(todayUtc, -1);
    for (const t of tenants) {
      console.log(`[backfill-seo-rollup] upserting yesterday for tenant ${t.name} (${t.id})...`);
      await upsertDailySeoForTenant(t.id, y);
    }
    return;
  }

  const endDateUtc = addUtcDays(todayUtc, -1);
  const startDateUtc = addUtcDays(todayUtc, -days);

  for (const t of tenants) {
    console.log(`[backfill-seo-rollup] backfilling ${days} days for tenant ${t.name} (${t.id})...`);

    let current = new Date(startDateUtc);
    while (current <= endDateUtc) {
      await upsertDailySeoForTenant(t.id, current);
      current = addUtcDays(current, 1);
    }
  }

  console.log('[backfill-seo-rollup] done');
}

main()
  .catch((e) => {
    console.error('[backfill-seo-rollup] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
