import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

type OverviewResponse = {
  success?: boolean;
  data?: {
    platformPerformance?: unknown;
  };
};

function buildApiBaseUrl(): string {
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

async function createAccessToken(prisma: PrismaClient, tenantSlug: string): Promise<{
  token: string;
  tenantId: string;
}> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required.');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(`Tenant slug "${tenantSlug}" not found.`);
  }

  const user = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    throw new Error(
      `No active user found for tenant "${tenantSlug}". Create at least one user before contract check.`,
    );
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    secret,
    { expiresIn: '5m' },
  );

  return { token, tenantId: tenant.id };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const tenantSlug = process.env.TOOLKIT_CHECK_TENANT_SLUG || 'rga-demo';
  const apiBaseUrl = buildApiBaseUrl();

  try {
    const { token, tenantId } = await createAccessToken(prisma, tenantSlug);

    const response = await fetch(
      `${apiBaseUrl}/api/v1/dashboard/overview?provenance=ALL`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const body = (await response.json()) as OverviewResponse;
    const hasPlatformPerformance = Array.isArray(body?.data?.platformPerformance);
    const ok = response.ok && hasPlatformPerformance;

    console.log(
      JSON.stringify(
        {
          ok,
          checkedAt: new Date().toISOString(),
          apiBaseUrl,
          tenantSlug,
          tenantId,
          statusCode: response.status,
          hasPlatformPerformance,
        },
        null,
        2,
      ),
    );

    process.exit(ok ? 0 : 1);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          checkedAt: new Date().toISOString(),
          apiBaseUrl,
          tenantSlug,
          error: error instanceof Error ? error.message : String(error),
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
