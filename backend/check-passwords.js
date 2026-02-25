const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    const p = new PrismaClient();
    try {
        const users = await p.user.findMany({
            select: { email: true, role: true, password: true, emailVerified: true, isActive: true }
        });

        console.log('=== USERS IN DATABASE ===');
        for (const u of users) {
            console.log('\nEmail:', u.email);
            console.log('Role:', u.role, '| Verified:', u.emailVerified, '| Active:', u.isActive);
            console.log('Hash prefix:', u.password ? u.password.substring(0, 30) + '...' : 'NULL');

            const passwords = ['password123', 'Password123', 'admin123', 'Admin123!', 'rga2024', 'demo123', 'Passw0rd'];
            for (const pwd of passwords) {
                if (u.password) {
                    const match = await bcrypt.compare(pwd, u.password);
                    if (match) {
                        console.log('>>> PASSWORD FOUND:', pwd);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await p.$disconnect();
    }
}

main();
