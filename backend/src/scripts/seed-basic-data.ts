import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    console.log('🌱 Starting basic data seeding...');

    // Get tenants
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    for (const tenant of tenants) {
      console.log(`📊 Seeding basic data for tenant: ${tenant.name}`);
      
      // Create campaigns
      const campaigns = [];
      for (let i = 0; i < 5; i++) {
        const campaign = await prisma.campaign.create({
          data: {
            tenantId: tenant.id,
            name: `Campaign ${i + 1}`,
            platform: 'GOOGLE_ADS',
            status: 'ACTIVE',
            budget: 10000 + (i * 5000),
            startDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
            endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
            currency: 'THB',
          },
        });
        campaigns.push(campaign);
      }

      // Create metrics for each campaign
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      for (const campaign of campaigns) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const date = new Date(d);
          
          await prisma.metric.create({
            data: {
              tenantId: tenant.id,
              campaignId: campaign.id,
              date: date,
              platform: 'GOOGLE_ADS',
              impressions: Math.floor(Math.random() * 10000) + 1000,
              clicks: Math.floor(Math.random() * 500) + 50,
              spend: Math.random() * 1000 + 100,
              conversions: Math.floor(Math.random() * 50),
              revenue: Math.random() * 5000 + 500,
            },
          });
        }
      }

      // Create ad groups
      for (const campaign of campaigns) {
        for (let i = 0; i < 3; i++) {
          await prisma.adGroup.create({
            data: {
              tenantId: tenant.id,
              campaignId: campaign.id,
              name: `Ad Group ${i + 1}`,
              status: 'ACTIVE',
              budget: 2000 + (i * 1000),
            },
          });
        }
      }

      // Create web analytics data
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        
        await prisma.webAnalyticsDaily.create({
          data: {
            tenantId: tenant.id,
            propertyId: `ga-property-${tenant.id}`,
            date: date,
            sessions: Math.floor(Math.random() * 1000) + 100,
            newUsers: Math.floor(Math.random() * 500) + 50,
            avgSessionDuration: Math.random() * 300 + 60,
            bounceRate: Math.random() * 0.8 + 0.1,
          },
        });
      }

      console.log(`✅ Seeded basic data for tenant: ${tenant.name}`);
    }

    console.log('🌟 Basic data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding basic data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();
