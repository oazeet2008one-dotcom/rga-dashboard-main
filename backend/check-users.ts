
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking users in database...');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            isActive: true,
            role: true,
            failedLoginCount: true,
            lockedUntil: true
        }
    });

    console.table(users);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
