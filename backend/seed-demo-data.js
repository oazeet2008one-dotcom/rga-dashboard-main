require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const faker = require('@faker-js/faker').faker;

const prisma = new PrismaClient();

// Generate demo GSC data for last 30 days
const generateGSCData = (tenantId, siteUrl, days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate 5-15 rows per day
    const rowsPerDay = faker.number.int({ min: 5, max: 15 });
    
    for (let j = 0; j < rowsPerDay; j++) {
      const clicks = faker.number.int({ min: 0, max: 50 });
      const impressions = faker.number.int({ min: clicks, max: 500 });
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const position = faker.number.float({ min: 1, max: 50, fractionDigits: 1 });
      
      data.push({
        tenantId,
        siteUrl,
        date,
        page: faker.internet.url(),
        query: faker.lorem.words({ min: 1, max: 4 }),
        device: faker.helpers.arrayElement(['DESKTOP', 'MOBILE', 'TABLET']),
        country: faker.location.countryCode(),
        clicks,
        impressions,
        ctr,
        position,
        externalKey: `${date.toISOString().split('T')[0]}-${faker.string.alphanumeric(8)}`,
      });
    }
  }
  
  return data;
};

// Generate demo GA4 data for last 30 days
const generateGA4Data = (tenantId, propertyId, days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      tenantId,
      propertyId,
      date,
      activeUsers: faker.number.int({ min: 50, max: 500 }),
      newUsers: faker.number.int({ min: 10, max: 200 }),
      sessions: faker.number.int({ min: 60, max: 600 }),
      screenPageViews: faker.number.int({ min: 100, max: 1000 }),
      engagementRate: faker.number.float({ min: 0.3, max: 0.9, fractionDigits: 2 }),
      bounceRate: faker.number.float({ min: 0.2, max: 0.7, fractionDigits: 2 }),
      avgSessionDuration: faker.number.int({ min: 60, max: 300 }),
      isMockData: true,
    });
  }
  
  return data;
};

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seed for SEO + GA4...');
    
    // Get first tenant
    const tenant = await prisma.tenant.findFirst({ select: { id: true, name: true } });
    if (!tenant) {
      throw new Error('No tenant found');
    }
    console.log(`📢 Using tenant: ${tenant.name} (${tenant.id})`);
    
    // Clean existing demo data only (isMockData = true)
    console.log('🧹 Cleaning existing demo data...');
    await prisma.searchConsolePerformance.deleteMany({
      where: { tenantId: tenant.id }
    });
    await prisma.webAnalyticsDaily.deleteMany({
      where: { tenantId: tenant.id, isMockData: true }
    });
    
    // Generate GSC demo data
    console.log('📊 Generating GSC demo data...');
    const gscData = generateGSCData(tenant.id, 'sc-domain:demo-domain.com', 30);
    console.log(`Generated ${gscData.length} GSC rows`);
    
    // Insert GSC data in batches
    const batchSize = 1000;
    for (let i = 0; i < gscData.length; i += batchSize) {
      const chunk = gscData.slice(i, i + batchSize);
      await prisma.searchConsolePerformance.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
    
    // Generate GA4 demo data
    console.log('📈 Generating GA4 demo data...');
    const ga4Data = generateGA4Data(tenant.id, 'demo-property-id', 30);
    console.log(`Generated ${ga4Data.length} GA4 rows`);
    
    // Insert GA4 data
    await prisma.webAnalyticsDaily.createMany({
      data: ga4Data,
      skipDuplicates: true,
    });
    
    // Verify counts
    const gscCount = await prisma.searchConsolePerformance.count();
    const ga4Count = await prisma.webAnalyticsDaily.count();
    
    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 GSC rows: ${gscCount}`);
    console.log(`📈 GA4 rows: ${ga4Count}`);
    
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();
