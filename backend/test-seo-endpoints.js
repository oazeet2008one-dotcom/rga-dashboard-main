require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const gscModule = require('./dist/src/modules/seo/google-search-console.service');
const { SeoService } = require('./dist/src/modules/seo/seo.service');

const prisma = new PrismaClient();
const mockConfigService = { get: (key) => process.env[key] };
const GoogleSearchConsoleService = gscModule.GoogleSearchConsoleService;
const gscService = new GoogleSearchConsoleService(mockConfigService);
const seoService = new SeoService(prisma, mockConfigService, gscService, null);

(async () => {
  try {
    const tenantId = 'e12c103c-e2a8-49b1-b440-6a073cdb2a3b';
    
    console.log('🔍 Testing SEO Overview (30d)...');
    const overview = await seoService.getOverview(tenantId, '30d');
    console.log('Overview result:', JSON.stringify(overview, null, 2));
    
    console.log('\n📊 Testing SEO Dashboard (30d, limit=10)...');
    const dashboard = await seoService.getDashboard(tenantId, '30d', 10);
    console.log('Dashboard queries:', dashboard.queries?.length || 0);
    console.log('Dashboard pages:', dashboard.pages?.length || 0);
    console.log('Dashboard countries:', dashboard.countries?.length || 0);
    console.log('Dashboard devices:', dashboard.devices?.length || 0);
    
  } catch (e) {
    console.error('❌ Test error:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
