
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const fs = require('fs');
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync('verification_output.txt', msg + '\n');
    };

    log('🔍 Verifying WebAnalyticsDaily Data...');

    const count = await prisma.webAnalyticsDaily.count();
    log(`Total Records: ${count}`);

    // Use raw query to bypass Type checks since Client is outdated
    const metadataCountResult: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM web_analytics_daily WHERE metadata IS NOT NULL`;
    log(`Records with Metadata: ${Number(metadataCountResult[0].count)}`);

    const sample: any[] = await prisma.$queryRaw`SELECT * FROM web_analytics_daily WHERE metadata IS NOT NULL LIMIT 1`;

    if (sample.length > 0) {
        log('Has Sample with Metadata: ' + JSON.stringify(sample[0].metadata, null, 2));
    } else {
        log('❌ NO RECORD WITH METADATA FOUND.');
    }

    // Check SeoSearchIntent
    const intentCount = await prisma.seoSearchIntent.count();
    log(`Total SeoSearchIntent Records: ${intentCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
