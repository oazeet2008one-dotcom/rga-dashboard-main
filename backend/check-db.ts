
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...');
        // Query to list all tables in public schema
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
        console.log('--- Tables ---');
        console.log(tables);

        // Check Users count
        try {
            const userCount = await prisma.user.count();
            console.log(`--- User Count: ${userCount} ---`);
            // Check ChatSession count (Critical check)
            // @ts-ignore
            const chatCount = await prisma.chatSession.count();
            console.log(`--- ChatSession Count: ${chatCount} (Table OK!) ---`);
        } catch (e) {
            console.log("Could not count users/sessions (table might be missing or client outdated):", e);
        }

    } catch (e) {
        console.error('Error connecting to database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
