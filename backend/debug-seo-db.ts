import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSeo() {
    console.log('--- SEO Database Debug ---');

    const demoUser = await prisma.user.findFirst({ where: { email: 'demo@example.com' } });
    const tenantId = demoUser?.tenantId;
    console.log('Demo Tenant ID:', tenantId);

    const waCount = await prisma.webAnalyticsDaily.count({ where: { tenantId } });
    console.log(`WebAnalyticsDaily (GA4) for Tenant: ${waCount}`);

    const locationCount = await prisma.seoTrafficByLocation.count({ where: { tenantId } });
    console.log(`SEO Traffic Location for Tenant: ${locationCount}`);

    const keywordCount = await prisma.seoTopKeywords.count({ where: { tenantId } });
    console.log(`Top Keywords for Tenant: ${keywordCount}`);

    const intentCount = await prisma.seoSearchIntent.count({ where: { tenantId } });
    console.log(`Search Intent for Tenant: ${intentCount}`);

    const offpageCount = await prisma.seoOffpageMetricSnapshots.count({ where: { tenantId } });
    console.log(`SEO Offpage Metrics (Backlinks, DR, UR) Total: ${offpageCount}`);

    if (offpageCount > 0) {
        const sample = await prisma.seoOffpageMetricSnapshots.findFirst({ where: { tenantId } });
        console.log('Sample SEO Offpage Metric:', JSON.stringify(sample, null, 2));
    }

    await prisma.$disconnect();
}

debugSeo();
