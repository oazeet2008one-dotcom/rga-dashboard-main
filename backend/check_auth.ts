
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking users...');

    // Check Admin
    const adminEmail = 'admin@rga.com';
    const admin = await prisma.user.findFirst({ where: { email: adminEmail } });

    if (!admin) {
        console.log(`❌ User ${adminEmail} NOT FOUND.`);
    } else {
        console.log(`✅ User ${adminEmail} found.`);
        const isMatch = await bcrypt.compare('password123', admin.password);
        console.log(`   Password 'password123' verification: ${isMatch ? 'MATCH ✅' : 'FAIL ❌'}`);
        console.log(`   Account Locked: ${admin.lockedUntil ? admin.lockedUntil : 'No'}`);
        console.log(`   Failed Login Count: ${admin.failedLoginCount}`);
    }

    // Check Demo User
    const demoEmail = 'demo@example.com';
    const demo = await prisma.user.findFirst({ where: { email: demoEmail } });

    if (!demo) {
        console.log(`❌ User ${demoEmail} NOT FOUND.`);
    } else {
        console.log(`✅ User ${demoEmail} found.`);
        const isMatch = await bcrypt.compare('password123', demo.password);
        console.log(`   Password 'password123' verification: ${isMatch ? 'MATCH ✅' : 'FAIL ❌'}`);
        console.log(`   Account Locked: ${demo.lockedUntil ? demo.lockedUntil : 'No'}`);
        console.log(`   Failed Login Count: ${demo.failedLoginCount}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
