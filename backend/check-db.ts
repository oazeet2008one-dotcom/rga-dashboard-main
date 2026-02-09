
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database content...');

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    const campaignCount = await prisma.campaign.count();
    console.log(`Campaigns: ${campaignCount}`);

    const metricCount = await prisma.metric.count();
    console.log(`Metrics: ${metricCount}`);

    if (campaignCount > 0) {
        const firstCampaign = await prisma.campaign.findFirst();
        console.log('First Campaign:', firstCampaign);
    }

    if (metricCount > 0) {
        const firstMetric = await prisma.metric.findFirst();
        console.log('First Metric:', firstMetric);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
