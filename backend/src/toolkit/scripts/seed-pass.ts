import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { PlatformMapper } from '../core/platform.mapper';
import { ToolkitPlatform } from '../domain/platform.types';

const prisma = new PrismaClient();

async function main() {
    const tenantId = '22222222-2222-2222-2222-222222222222'; // Valid UUID
    const source = 'toolkit:seed-pass';
    const googleAds = PlatformMapper.toPersistence(ToolkitPlatform.GoogleAds);

    console.log(`Seeding SUCCESS state for tenant: ${tenantId}...`);

    // 0. Ensure Tenant Exists
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Verification Pass Tenant',
            slug: 'verify-pass',
        }
    });

    // 1. Clean
    await prisma.metric.deleteMany({ where: { tenantId } });
    await prisma.campaign.deleteMany({ where: { tenantId } });

    // 2. Create Good Campaign
    const campaign = await prisma.campaign.create({
        data: {
            tenantId,
            name: 'Pass Campaign',
            platform: googleAds,
            status: 'ACTIVE',
            externalId: 'pass-campaign-1'
        }
    });

    // 3. Create Good Metric (Healthy ROAS, Normal Funnel)
    await prisma.metric.create({
        data: {
            tenantId,
            campaignId: campaign.id,
            platform: googleAds,
            date: new Date(),
            impressions: 1000,
            clicks: 50,
            spend: 100,
            conversions: 5,
            revenue: 300,
            ctr: 5.0,
            costPerClick: 2.0,
            conversionRate: 10.0,
            roas: 3.0, // > 1.0 (Good)
            isMockData: true,
            source,
        }
    });

    console.log('Seeding COMPLETE. Verification should PASS.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
