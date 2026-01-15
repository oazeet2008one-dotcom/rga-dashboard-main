import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const getSeedEmailDomain = () => (process.env.SEED_EMAIL_DOMAIN || 'rga.local').trim();

const getSeedPasswordDefault = () => (process.env.SEED_PASSWORD_DEFAULT || '').trim();

const buildSeedEmail = (localPart: string, envOverride?: string) => {
  const override = envOverride?.trim();
  if (override) return override;
  return `${localPart}@${getSeedEmailDomain()}`;
};

const buildSeedPassword = (fallback: string, envOverride?: string) => {
  const override = envOverride?.trim();
  if (override) return override;
  const globalDefault = getSeedPasswordDefault();
  if (globalDefault) return globalDefault;
  return fallback;
};

async function main() {
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'rga-demo' },
    update: {},
    create: {
      name: 'RGA Demo',
      slug: 'rga-demo',
      domain: 'localhost',
    },
  });

  // Create SUPER ADMIN user
  const email = buildSeedEmail('superadmin', process.env.SEED_SUPER_ADMIN_EMAIL);
  const superAdminPassword = buildSeedPassword('SuperAdmin@123', process.env.SEED_SUPER_ADMIN_PASSWORD);
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);
  const superAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: {
      tenantId: tenant.id,
      role: 'super_admin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      emailVerified: true,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      tenantId: tenant.id,
      isActive: true,
      emailVerified: true,
    },
  });

  const seedUsers = [
    {
      email: buildSeedEmail('adminfull', process.env.SEED_ADMIN_FULL_EMAIL),
      password: buildSeedPassword('AdminFull@123', process.env.SEED_ADMIN_FULL_PASSWORD),
      firstName: 'Admin',
      lastName: 'Full',
      role: 'admin_full',
    },
    {
      email: buildSeedEmail('admintest', process.env.SEED_ADMIN_MESS_EMAIL),
      password: buildSeedPassword('AdminTest@123', process.env.SEED_ADMIN_MESS_PASSWORD),
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin_mess',
    },
    {
      email: buildSeedEmail('manager', process.env.SEED_MANAGER_EMAIL),
      password: buildSeedPassword('Manager@123', process.env.SEED_MANAGER_PASSWORD),
      firstName: 'Manager',
      lastName: 'One',
      role: 'manager',
    },
    {
      email: buildSeedEmail('viewer', process.env.SEED_VIEWER_EMAIL),
      password: buildSeedPassword('Viewer@123', process.env.SEED_VIEWER_PASSWORD),
      firstName: 'Viewer',
      lastName: 'One',
      role: 'viewer',
    },
  ] as const;

  await Promise.all(
    seedUsers.map(async (u) => {
      const hash = await bcrypt.hash(u.password, 10);
      await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
        update: {
          tenantId: tenant.id,
          role: u.role,
          passwordHash: hash,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: true,
          emailVerified: true,
        },
        create: {
          tenantId: tenant.id,
          email: u.email,
          passwordHash: hash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: true,
          emailVerified: true,
        },
      });
    })
  );

  // Example alert
  // Create an example alert if not exists for this tenant
  const existingAlert = await prisma.alert.findFirst({
    where: { tenantId: tenant.id, name: 'Low CTR', metric: 'ctr', operator: '<' }
  });
  if (!existingAlert) {
    await prisma.alert.create({
      data: {
        tenantId: tenant.id,
        name: 'Low CTR',
        alertType: 'threshold',
        metric: 'ctr',
        operator: '<',
        threshold: new Prisma.Decimal(0.5),
        isActive: true,
        recipients: JSON.parse('["superadmin@rga.local"]'),
        notificationChannels: JSON.parse('["email"]'),
      },
    });
  }

  const uiAssets = [
    {
      name: 'Overview Dashboard',
      category: 'dashboard',
      description: 'High-level analytics cockpit mockup',
      fileName: 'Overview.jpg',
      filePath: '/uxui/Overview.jpg',
      tags: ['overview', 'dashboard', 'analytics'],
    },
    {
      name: 'Checklist Experience',
      category: 'onboarding',
      description: 'Integration checklist layout',
      fileName: 'Checklist.jpg',
      filePath: '/uxui/Checklist.jpg',
      tags: ['checklist', 'integration'],
    },
    {
      name: 'Login Experience',
      category: 'auth',
      description: 'Dark glitter login concept',
      fileName: 'LOGIN.jpg',
      filePath: '/uxui/LOGIN.jpg',
      tags: ['auth', 'login'],
    },
    {
      name: 'Campaign - Google Ads',
      category: 'campaign',
      description: 'Google Ads campaign analytics section',
      fileName: 'Campaign (Google Adds).jpg',
      filePath: '/uxui/Campaign (Google Adds).jpg',
      tags: ['campaign', 'google', 'ads'],
    },
    {
      name: 'Campaign - Facebook Ads',
      category: 'campaign',
      description: 'Facebook Ads campaign analytics section',
      fileName: 'Campaign (Facebook Adds).jpg',
      filePath: '/uxui/Campaign (Facebook Adds).jpg',
      tags: ['campaign', 'facebook', 'ads'],
    },
    {
      name: 'Campaign - LINE Ads',
      category: 'campaign',
      description: 'LINE Ads campaign analytics section',
      fileName: 'Campaign (Line Adds).jpg',
      filePath: '/uxui/Campaign (Line Adds).jpg',
      tags: ['campaign', 'line', 'ads'],
    },
    {
      name: 'Campaign - TikTok Ads',
      category: 'campaign',
      description: 'TikTok Ads campaign analytics section',
      fileName: 'Campaign (TIKTOK Adds).jpg',
      filePath: '/uxui/Campaign (TIKTOK Adds).jpg',
      tags: ['campaign', 'tiktok', 'ads'],
    },
    {
      name: 'CRM & Leads',
      category: 'crm',
      description: 'CRM pipeline and leads tracking UI',
      fileName: 'CRM & Leads.jpg',
      filePath: '/uxui/CRM & Leads.jpg',
      tags: ['crm', 'leads'],
    },
    {
      name: 'E-commerce Overview',
      category: 'commerce',
      description: 'E-commerce metrics snapshot',
      fileName: 'E-commerce.jpg',
      filePath: '/uxui/E-commerce.jpg',
      tags: ['commerce', 'orders'],
    },
    {
      name: 'SEO & Web Analytics',
      category: 'seo',
      description: 'SEO visibility and traffic cards',
      fileName: 'SEO & Web Analytics.jpg',
      filePath: '/uxui/SEO & Web Analytics.jpg',
      tags: ['seo', 'web'],
    },
    {
      name: 'Trend Analysis',
      category: 'insight',
      description: 'Trends and anomalies visualization',
      fileName: 'Trend Analysis.jpg',
      filePath: '/uxui/Trend Analysis.jpg',
      tags: ['trend', 'analysis'],
    },
    {
      name: 'Reporting Center',
      category: 'report',
      description: 'Reports library concept',
      fileName: 'Report.jpg',
      filePath: '/uxui/Report.jpg',
      tags: ['report', 'export'],
    },
    {
      name: 'Settings & Profile',
      category: 'settings',
      description: 'Settings management UI',
      fileName: 'Setting.jpg',
      filePath: '/uxui/Setting.jpg',
      tags: ['settings', 'profile'],
    },
  ];

  await Promise.all(
    uiAssets.map((asset) =>
      prisma.uiAsset.upsert({
        where: {
          tenantId_fileName: {
            tenantId: tenant.id,
            fileName: asset.fileName,
          },
        },
        update: {
          name: asset.name,
          category: asset.category,
          description: asset.description,
          filePath: asset.filePath,
          tags: asset.tags,
        },
        create: {
          tenantId: tenant.id,
          ...asset,
        },
      })
    )
  );

  console.log('Seed complete:', { tenant: tenant.slug, superAdmin: superAdmin.email });
  console.log('Login credentials (DEV):');
  console.table([
    { role: 'super_admin', email: buildSeedEmail('superadmin', process.env.SEED_SUPER_ADMIN_EMAIL), password: superAdminPassword },
    { role: 'admin_full', email: buildSeedEmail('adminfull', process.env.SEED_ADMIN_FULL_EMAIL), password: buildSeedPassword('AdminFull@123', process.env.SEED_ADMIN_FULL_PASSWORD) },
    { role: 'admin_mess', email: buildSeedEmail('admintest', process.env.SEED_ADMIN_MESS_EMAIL), password: buildSeedPassword('AdminTest@123', process.env.SEED_ADMIN_MESS_PASSWORD) },
    { role: 'manager', email: buildSeedEmail('manager', process.env.SEED_MANAGER_EMAIL), password: buildSeedPassword('Manager@123', process.env.SEED_MANAGER_PASSWORD) },
    { role: 'viewer', email: buildSeedEmail('viewer', process.env.SEED_VIEWER_EMAIL), password: buildSeedPassword('Viewer@123', process.env.SEED_VIEWER_PASSWORD) },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
