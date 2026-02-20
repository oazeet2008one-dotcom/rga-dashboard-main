import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { PlatformMapper } from '../core/platform.mapper';
import { ToolkitPlatform } from '../domain/platform.types';

const prisma = new PrismaClient();

async function main() {
    const tenantId = '11111111-1111-1111-1111-111111111111'; // Valid UUID
    const source = 'toolkit:seed-fail';
    const googleAds = PlatformMapper.toPersistence(ToolkitPlatform.GoogleAds);

    console.log(`Seeding FAILURE state for tenant: ${tenantId}...`);

    // 0. Ensure Tenant Exists
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Verification Fail Tenant',
            slug: 'verify-fail',
        }
    });

    // 1. Clean
    await prisma.metric.deleteMany({ where: { tenantId } });
    await prisma.campaign.deleteMany({ where: { tenantId } });

    // 2. Create Bad Campaign
    const campaign = await prisma.campaign.create({
        data: {
            tenantId,
            name: 'Fail Campaign',
            platform: googleAds,
            status: 'ACTIVE',
            externalId: 'fail-campaign-1'
        }
    });

    // 3. Create Bad Metric (Clicks > Impressions)
    // Rule SANE-001: CLICKS_LE_IMPRESSIONS (FAIL)
    await prisma.metric.create({
        data: {
            tenantId,
            campaignId: campaign.id,
            platform: googleAds,
            date: new Date(),
            impressions: 10,
            clicks: 100, // ANOMALY!
            spend: 500,
            conversions: 5,
            revenue: 1000,
            ctr: 10.0,
            costPerClick: 5,
            conversionRate: 0.05,
            roas: 2.0,
            isMockData: true,
            source,
        }
    });

    console.log('Seeding COMPLETE. Verification should FAIL with CLICKS_LE_IMPRESSIONS.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
