import { AdPlatform, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  console.log('[seed-google-ads-history] starting...');

  // Use UTC-midnight dates to avoid off-by-one issues when filtering/grouping by day.
  const now = new Date();
  const todayUtc = toUtcDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));

  // Generate exactly the past 30 days, day-by-day, ending yesterday.
  const endDateUtc = addUtcDays(todayUtc, -1);
  const startDateUtc = addUtcDays(todayUtc, -30);

  const campaigns = await prisma.campaign.findMany({
    where: {
      platform: AdPlatform.GOOGLE_ADS,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
    },
  });

  if (campaigns.length === 0) {
    console.log('[seed-google-ads-history] no GOOGLE_ADS campaigns found; nothing to seed.');
    return;
  }

  console.log(`[seed-google-ads-history] found ${campaigns.length} GOOGLE_ADS campaigns.`);

  const seedSource = 'seed_google_ads_history';

  // Seed campaign-by-campaign so we can log a clear summary per campaign.
  for (const campaign of campaigns) {
    // Idempotency strategy (per campaign):
    // - Delete metrics for THIS campaign for the target window.
    // - Scoped by `source` so we don't delete real synced metrics.
    const deleteResult = await prisma.metric.deleteMany({
      where: {
        campaignId: campaign.id,
        platform: AdPlatform.GOOGLE_ADS,
        source: seedSource,
        date: {
          gte: startDateUtc,
          lte: endDateUtc,
        },
      },
    });

    // Create a stable baseline per campaign so the time-series looks like a "real" campaign
    // (same campaign tends to have a similar volume band week-to-week).
    const baselineImpressions = Math.floor(randomFloat(600, 2600));

    const rows: Prisma.MetricCreateManyInput[] = [];

    let current = new Date(startDateUtc);
    while (current <= endDateUtc) {
      const dayOfWeek = current.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Impressions: required range 100 - 5000.
      // We combine:
      // - stable per-campaign baseline
      // - weekend dip
      // - small random noise
      // This creates a realistic line chart while respecting the hard bounds.
      const seasonalityFactor = isWeekend ? 0.8 : 1.0;
      const noiseFactor = randomFloat(0.85, 1.15);
      const impressions = clampInt(baselineImpressions * seasonalityFactor * noiseFactor, 100, 5000);

      // CTR constraint: 1% - 5%.
      // Clicks are derived from impressions, so clicks will never exceed impressions.
      const ctr = randomFloat(0.01, 0.05);
      const clicks = clampInt(impressions * ctr, 0, impressions);

      // CPC constraint: 10 - 50 THB.
      // Spend ("cost") is derived from clicks, so it stays consistent with CPC.
      const cpcThb = randomFloat(10, 50);
      const spend = clicks * cpcThb;

      // CVR constraint: 0.5% - 2%.
      // Conversions are derived from clicks, so conversions will never exceed clicks.
      const cvr = randomFloat(0.005, 0.02);
      const conversions = clampInt(clicks * cvr, 0, clicks);

      // Keep derived KPI columns consistent with the raw fields.
      const ctrPct = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRatePct = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const costPerClick = clicks > 0 ? spend / clicks : 0;
      const costPerMille = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const costPerAction = conversions > 0 ? spend / conversions : 0;

      rows.push({
        tenantId: campaign.tenantId,
        campaignId: campaign.id,
        date: new Date(current),
        platform: AdPlatform.GOOGLE_ADS,
        source: seedSource,
        impressions,
        clicks,
        conversions,
        spend: new Prisma.Decimal(spend.toFixed(2)),
        costPerClick: new Prisma.Decimal(costPerClick.toFixed(4)),
        costPerMille: new Prisma.Decimal(costPerMille.toFixed(4)),
        costPerAction: new Prisma.Decimal(costPerAction.toFixed(4)),
        ctr: new Prisma.Decimal(ctrPct.toFixed(4)),
        conversionRate: new Prisma.Decimal(conversionRatePct.toFixed(4)),
        roas: new Prisma.Decimal('0'),
        revenue: new Prisma.Decimal('0'),
        orders: 0,
        averageOrderValue: new Prisma.Decimal('0'),
        isMockData: true,
      });

      current = addUtcDays(current, 1);
    }

    const createResult = await prisma.metric.createMany({
      data: rows,
    });

    console.log(
      `[seed-google-ads-history] campaign="${campaign.name}" (id=${campaign.id}) deleted ${deleteResult.count} + created ${createResult.count} rows (${startDateUtc.toISOString().slice(0, 10)}..${endDateUtc.toISOString().slice(0, 10)}).`,
    );
  }

  console.log('[seed-google-ads-history] done.');
}

main()
  .catch((e) => {
    console.error('[seed-google-ads-history] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
