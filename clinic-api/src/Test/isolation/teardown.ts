/**
 * Global teardown — runs ONCE after ALL isolation tests.
 * Removes all data created by setup.ts using the TEST_PREFIX.
 * Cascade deletes handle relations automatically.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalTeardown(): Promise<void> {
  const prefix = process.env.TEST_PREFIX;
  if (!prefix) {
    console.log('[ISO-TEARDOWN] No TEST_PREFIX found, skipping cleanup.');
    return;
  }

  console.log(`\n[ISO-TEARDOWN] Cleaning up test data with prefix: ${prefix}`);

  try {
    // Delete tenants by slug prefix — cascades to subscriptions, users, patients
    // NOTE: Order matters for FK constraints; delete child records first
    const tenants = await prisma.tenant.findMany({
      where: { slug: { startsWith: prefix } },
      select: { id: true },
    });

    const tenantIds = tenants.map((t) => t.id);

    if (tenantIds.length > 0) {
      await prisma.patient.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.subscription.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } });
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    }

    // Delete the System Admin test user (no tenantId — needs separate lookup)
    await prisma.user.deleteMany({
      where: { email: { startsWith: prefix } },
    });

    console.log(`[ISO-TEARDOWN] Removed ${tenantIds.length} test tenant(s) and all related data.`);
  } catch (err) {
    console.error('[ISO-TEARDOWN] Cleanup error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
