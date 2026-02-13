import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Database Debug ---');

    const tenants = await prisma.tenant.findMany();
    console.log(`Tenants (${tenants.length}):`, tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));

    const users = await prisma.user.findMany({ select: { email: true, role: true, tenantId: true } });
    console.log(`Users (${users.length}):`, users);

    const campaigns = await prisma.campaign.count();
    console.log(`Campaigns total: ${campaigns}`);

    const campaignPlatforms = await prisma.campaign.groupBy({
        by: ['platform'],
        _count: { _all: true }
    });
    console.log('Campaigns by platform:', campaignPlatforms);

    const metrics = await prisma.metric.count();
    console.log(`Metrics total: ${metrics}`);

    const latestMetrics = await prisma.metric.findFirst({
        orderBy: { date: 'desc' }
    });
    console.log('Latest metric date:', latestMetrics?.date);

    const metricsWithTenant = await prisma.metric.findFirst({ select: { id: true, tenantId: true } });
    console.log('Metrics tenantId:', metricsWithTenant?.tenantId);
    console.log('Metrics ID:', metricsWithTenant?.id);

    const campaignsWithTenant = await prisma.campaign.findFirst({ select: { id: true, tenantId: true } });
    console.log('Campaigns tenantId:', campaignsWithTenant?.tenantId);
    console.log('Campaigns ID:', campaignsWithTenant?.id);

    const demoUser = await prisma.user.findFirst({ where: { email: 'demo@example.com' } });
    console.log('Demo User Full Record:', JSON.stringify(demoUser, null, 2));

    const tenantMatches = (metricsWithTenant?.tenantId === demoUser?.tenantId) && (campaignsWithTenant?.tenantId === demoUser?.tenantId);
    console.log(`Tenant IDs match across tables: ${tenantMatches}`);

    const waMetrics = await prisma.webAnalyticsDaily.count();
    console.log(`GA4 Metrics total: ${waMetrics}`);

    const insightsCount = await prisma.aiInsight.count();
    console.log(`AI Insights total: ${insightsCount}`);

    await prisma.$disconnect();
}

debug();
