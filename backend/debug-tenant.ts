import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTenant() {
  try {
    console.log('=== Tenant Debug ===');
    
    const tenants = await prisma.tenant.findMany();
    console.log('All tenants:');
    tenants.forEach(t => console.log(`  ${t.id}: ${t.name} (${t.slug})`));
    
    // Check which tenant the API is using
    const adminUser = await prisma.user.findFirst({ 
      where: { email: 'admin@rga.com' },
      select: { id: true, email: true, tenantId: true }
    });
    console.log('Admin user:', adminUser);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTenant();
