import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAiInsights() {
  try {
    // Get a valid tenant ID first
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('No tenant found!');
      return;
    }

    const insights = [
      {
        type: 'google_assistant',
        source: 'google',
        title: 'Google Assistant Integration Ready',
        message: 'Your SEO dashboard is now optimized for Google Assistant voice search queries and commands.',
        status: 'active',
        payload: {
          actionRequired: true,
          priority: 'high',
          category: 'integration'
        },
        occurredAt: new Date(),
        tenantId: tenant.id
      },
      {
        type: 'voice_search',
        source: 'google',
        title: 'Voice Search Trends',
        message: '30% increase in voice search queries detected. Optimize your content for conversational keywords.',
        status: 'active',
        payload: {
          actionRequired: false,
          priority: 'medium',
          category: 'trends',
          increasePercentage: 30
        },
        occurredAt: new Date(),
        tenantId: tenant.id
      },
      {
        type: 'local_seo',
        source: 'google',
        title: 'Google My Business Sync',
        message: 'Sync your local business data with Google Assistant for better local search visibility.',
        status: 'pending',
        payload: {
          actionRequired: true,
          priority: 'high',
          category: 'local'
        },
        occurredAt: new Date(),
        tenantId: tenant.id
      },
      {
        type: 'mobile_optimization',
        source: 'google',
        title: 'Mobile-First Indexing',
        message: 'Google Assistant prioritizes mobile-friendly sites. Ensure your mobile experience is optimized.',
        status: 'active',
        payload: {
          actionRequired: false,
          priority: 'high',
          category: 'mobile'
        },
        occurredAt: new Date(),
        tenantId: tenant.id
      },
      {
        type: 'structured_data',
        source: 'google',
        title: 'Structured Data for Voice',
        message: 'Add FAQ schema and structured data to improve Google Assistant understanding of your content.',
        status: 'pending',
        payload: {
          actionRequired: true,
          priority: 'medium',
          category: 'schema'
        },
        occurredAt: new Date(),
        tenantId: tenant.id
      }
    ];
    
    for (const insight of insights) {
      await prisma.aiInsight.create({
        data: insight
      });
    }
    
    console.log('AI Insights for Google Assistant seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAiInsights();
