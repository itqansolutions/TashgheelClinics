import { rawPrisma } from '../config/db';

// ──────────────────────────────────────────────────────────────────────────────
// TENANT_MODELS: Explicit allowlist of Prisma model names that are tenant-scoped.
//
// The $extends below injects tenantId ONLY for models in this set.
// Global lookup models (Country, BodyArea, PlanLimit) are deliberately EXCLUDED
// so that tenantPrisma() remains safe to use in code that also queries global data.
//
// ⚠️  If you add a new tenant-scoped model to schema.prisma, add it here too.
//     The name must match the Prisma model name exactly (camelCase).
// ──────────────────────────────────────────────────────────────────────────────
export const TENANT_MODELS = new Set([
  'user',
  'doctor',
  'doctorSchedule',
  'specialty',
  'service',
  'leadSource',
  'patient',
  'patientArea',
  'patientImage',
  'patientRating',
  'appointment',
  'payment',
  'sessionItem',
  'financialTransaction',
  'vendor',
  'product',
  'stockTransaction',
  'purchase',
  'purchaseItem',
  'stockAdjustment',
  'vendorPayment',
  'clinicSetting',
  'invoiceSetting',
  'auditLog',
  'subscription',
  'emailVerificationToken',
  // NOT included (global models — use raw prisma for these):
  // 'country', 'bodyArea', 'planLimit', 'systemAdminAuditLog', 'tenant'
]);

/**
 * Returns a Prisma client extended to automatically inject `tenantId`
 * into every query for models listed in TENANT_MODELS.
 *
 * - READ  operations (findMany, findFirst, count, aggregate, groupBy):
 *     Appends `{ tenantId }` to the WHERE clause.
 * - WRITE operations (create, createMany):
 *     Injects `tenantId` into the data payload.
 * - MUTATE operations (update, updateMany, delete, deleteMany, upsert):
 *     Adds `tenantId` to the WHERE clause as a double-guard.
 *     This means a cross-tenant record ID can never be updated/deleted accidentally.
 *
 * Global models (Country, BodyArea, PlanLimit) pass through unchanged.
 *
 * Usage:
 *   const db = tenantPrisma(req.tenantCtx.tenantId);
 *   const patients = await db.patient.findMany({ where: { isActive: true } });
 *   // Executes: WHERE "tenantId" = <tenantId> AND "isActive" = true
 *
 *   // For global models, always use raw prisma:
 *   const countries = await prisma.country.findMany();
 */
export function tenantPrisma(tenantId: number) {
  return rawPrisma.$extends({
    query: {
      $allModels: {
        // ── READ ────────────────────────────────────────────────────────────
        async findMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },

        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },

        async findFirstOrThrow({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },

        async findUnique({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            // Prisma's native findUnique rejects non-unique fields in where clause.
            // Route to findFirst with tenantId injected to ensure 100% tenant isolation:
            return (rawPrisma as any)[model].findFirst({
              ...args,
              where: {
                ...args.where,
                tenantId,
              },
            });
          }
          return query(args);
        },

        async findUniqueOrThrow({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            return (rawPrisma as any)[model].findFirstOrThrow({
              ...args,
              where: {
                ...args.where,
                tenantId,
              },
            });
          }
          return query(args);
        },

        async count({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },

        async aggregate({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args as any).where = { ...(args as any).where, tenantId };
          }
          return query(args);
        },

        async groupBy({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args as any).where = { ...(args as any).where, tenantId };
          }
          return query(args);
        },

        // ── WRITE ───────────────────────────────────────────────────────────
        async create({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            (args.data as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },

        async createMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            if (Array.isArray(args.data)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              args.data = (args.data as any[]).map((d: Record<string, unknown>) => ({
                ...d,
                tenantId,
              })) as typeof args.data;
            }
          }
          return query(args);
        },

        // ── MUTATE (double-guard) ────────────────────────────────────────────
        // Adding tenantId to WHERE on mutations means:
        // update({ where: { id: 999 } }) from Tenant A will silently
        // find 0 rows if id 999 belongs to Tenant B — no crash, no leak.
        async update({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            (args.where as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },

        async updateMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },

        async upsert({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            (args.where  as Record<string, unknown>).tenantId = tenantId;
            (args.create as Record<string, unknown>).tenantId = tenantId;
            // args.update intentionally left without tenantId injection
            // (you shouldn't be changing tenantId via upsert)
          }
          return query(args);
        },

        async delete({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            (args.where as Record<string, unknown>).tenantId = tenantId;
          }
          return query(args);
        },

        async deleteMany({ model, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

/** Convenience type for controllers that receive a scoped client */
export type TenantPrismaClient = ReturnType<typeof tenantPrisma>;
