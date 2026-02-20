import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { runToolkitPreflight } from '../../toolkit/core/preflight';

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await runToolkitPreflight(prisma, { requiredNodeMajor: 20 });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          ok: false,
          checkedAt: new Date().toISOString(),
          checks: [
            {
              id: 'PREFLIGHT_RUNTIME',
              status: 'FAIL',
              message,
            },
          ],
          actions: ['Investigate runtime error and rerun toolkit preflight.'],
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
