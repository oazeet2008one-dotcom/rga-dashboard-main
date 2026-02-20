import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): Flags {
  const flags: Flags = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, rawValue] = arg.slice(2).split('=');
    flags[key] = rawValue === undefined ? true : rawValue;
  }
  return flags;
}

function readFlag(flags: Flags, key: string, fallback: string): string {
  const value = flags[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const flags = parseArgs(process.argv.slice(2));

  const tenantId = readFlag(flags, 'id', '');
  const slug = readFlag(flags, 'slug', process.env.TOOLKIT_BOOTSTRAP_TENANT_SLUG || 'toolkit-e2e-a');
  const name = readFlag(flags, 'name', process.env.TOOLKIT_BOOTSTRAP_TENANT_NAME || 'Toolkit E2E A');
  const email = readFlag(
    flags,
    'email',
    process.env.TOOLKIT_BOOTSTRAP_USER_EMAIL || `toolkit-api-${slug}@example.local`,
  );

  try {
    const tenant = tenantId
      ? await prisma.tenant.upsert({
          where: { id: tenantId },
          update: { slug, name },
          create: { id: tenantId, slug, name },
          select: { id: true, slug: true, name: true },
        })
      : await prisma.tenant.upsert({
          where: { slug },
          update: { name },
          create: { slug, name },
          select: { id: true, slug: true, name: true },
        });

    const user = await prisma.user.upsert({
      where: {
        users_tenant_email_unique: {
          tenantId: tenant.id,
          email,
        },
      },
      update: {
        isActive: true,
        deletedAt: null,
      },
      create: {
        tenantId: tenant.id,
        email,
        password: process.env.TOOLKIT_BOOTSTRAP_USER_PASSWORD || 'toolkit-dev-password',
        isActive: true,
        role: 'CLIENT',
      },
      select: { id: true, email: true, isActive: true },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          tenant,
          user,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: message,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
