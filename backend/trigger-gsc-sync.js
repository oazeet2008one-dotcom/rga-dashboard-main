require('dotenv').config();
const gscModule = require('./dist/src/modules/seo/google-search-console.service');
const { SeoService } = require('./dist/src/modules/seo/seo.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock config service with required get method
const mockConfigService = {
  get: (key) => process.env[key]
};

const GoogleSearchConsoleService = gscModule.GoogleSearchConsoleService;
const gscService = new GoogleSearchConsoleService(mockConfigService);
const seoService = new SeoService(prisma, mockConfigService, gscService, null);

(async () => {
  try {
    console.log('Triggering GSC sync for 7 days...');
    const result = await seoService.syncGscForTenant('e12c103c-e2a8-49b1-b440-6a073cdb2a3b', { days: 7 });
    console.log('Sync result:', result);
  } catch (e) {
    console.error('Sync ERR', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
