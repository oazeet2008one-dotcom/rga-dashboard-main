import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeoData() {
  try {
    console.log('=== SEO Data Check ===');
    
    const tenant = await prisma.tenant.findFirst();
    console.log('Tenant ID:', tenant?.id);
    
    const snapshots = await prisma.seoOffpageMetricSnapshots.findMany({ 
      where: { tenantId: tenant?.id },
      take: 3 
    });
    console.log('SEO Offpage Snapshots for tenant:', snapshots.length);
    if (snapshots.length > 0) {
      console.log('Sample:', JSON.stringify(snapshots[0], null, 2));
    }
    
    const allSnapshots = await prisma.seoOffpageMetricSnapshots.count();
    console.log('Total SEO Offpage Snapshots in DB:', allSnapshots);
    
    const keywords = await prisma.seoTopKeywords.count();
    console.log('Total SEO Top Keywords in DB:', keywords);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeoData();
