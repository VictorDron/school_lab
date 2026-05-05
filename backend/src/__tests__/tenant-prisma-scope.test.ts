// Phase 2b multi-tenancy: Prisma $use middleware that auto-scopes Lead
// queries by the active ALS tenantId. Verified against the real
// PrismaClient (no DB connection — we only need it for `$use` plumbing
// and to fire the middleware chain).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { runWithTenant, currentTenantId } from '../lib/tenant-context.js';

// Recreate the same middleware logic that ships in src/config/database.ts.
// Keeping the test middleware in-test (rather than importing the global
// prisma) avoids the connection-init dance and the retry loop.
function attachTenantScopeMiddleware(client: PrismaClient): void {
  // Mirror the production list in src/config/database.ts.
  const TENANT_SCOPED_MODELS = new Set<Prisma.ModelName>([
    'Lead',
    'KanbanColumn',
    'CrmEvent',
    'ExperienceEvaluation',
    'Contract',
    'ContractAddendum',
    'ContractDefaultSigner',
    'GateStepConfig',
    'ReEnrollmentPeriod',
    'PeriodPriceTable',
    'FamilyPriceException',
    'PreReEnrollmentResponse',
    'ReEnrollmentInvite',
    'Channel',
    'ModuleChannel',
    'Message',
    'Ticket',
    'TaskBoard',
    'TaskCard',
    'AuditLog',
    'Notification',
    'Document',
    'ImportHistory',
    'PurchaseRequest',
    'Supplier',
    'Asset',
    'AssetCategory',
    'AssetLocation',
    'InventorySession',
    'CalendarEvent',
    'Student',
  ]);
  const SCOPED_READ_ACTIONS = new Set<Prisma.PrismaAction>([
    'findFirst',
    'findFirstOrThrow',
    'findMany',
    'count',
    'aggregate',
    'groupBy',
    'updateMany',
    'deleteMany',
  ]);

  client.$use(async (params, next) => {
    const tenantId = currentTenantId();
    if (
      tenantId &&
      params.model &&
      TENANT_SCOPED_MODELS.has(params.model) &&
      SCOPED_READ_ACTIONS.has(params.action)
    ) {
      params.args = params.args ?? {};
      params.args.where = { ...(params.args.where ?? {}), tenantId };
    }
    return next(params);
  });
}

describe('Prisma auto-scope middleware (Phase 2b)', () => {
  let client: PrismaClient;
  let captured: { params: Prisma.MiddlewareParams } | null;

  beforeEach(() => {
    client = new PrismaClient();
    captured = null;

    // Tenant scope FIRST so it can mutate args, then a sentinel that
    // captures the post-mutation params and throws to skip the actual DB
    // hop. Prisma runs $use in registration order, so order matters.
    attachTenantScopeMiddleware(client);

    client.$use(async (params) => {
      captured = { params };
      throw new Error('STOPPED_FOR_TEST');
    });
  });

  async function runQuery(fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      if ((err as Error).message !== 'STOPPED_FOR_TEST') throw err;
    }
  }

  it('injects tenantId into Lead.findMany when ALS context is active', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.lead.findMany({ where: { code: 'LD-1' } }));
    });
    expect(captured?.params.args).toEqual({
      where: { code: 'LD-1', tenantId: 'tenant-A' },
    });
  });

  it('injects tenantId when no where clause is provided at all', async () => {
    await runWithTenant('tenant-B', async () => {
      await runQuery(() => client.lead.findMany());
    });
    expect(captured?.params.args).toEqual({ where: { tenantId: 'tenant-B' } });
  });

  it('does NOT inject tenantId outside any ALS context', async () => {
    await runQuery(() => client.lead.findMany({ where: { code: 'LD-1' } }));
    expect(captured?.params.args).toEqual({ where: { code: 'LD-1' } });
  });

  it('scopes Lead.count', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.lead.count({ where: { isFlagged: true } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      isFlagged: true,
      tenantId: 'tenant-A',
    });
  });

  it('scopes Lead.updateMany', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.lead.updateMany({
          where: { isFlagged: false },
          data: { isFlagged: true },
        }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({
      isFlagged: false,
      tenantId: 'tenant-A',
    });
  });

  it('does NOT scope Lead.findUnique (uses unique key — Phase 5 RLS covers)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.lead.findUnique({ where: { id: 'lead-1' } }));
    });
    expect(captured?.params.args).toEqual({ where: { id: 'lead-1' } });
  });

  it('does NOT scope Lead.update (unique-where; explicit safety in code)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.lead.update({
          where: { id: 'lead-1' },
          data: { isFlagged: true },
        }),
      );
    });
    expect(captured?.params.args.where).toEqual({ id: 'lead-1' });
  });

  it('does NOT scope queries on non-tenant-scoped models (e.g. User)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.user.findMany({ where: { email: 'x@y.com' } }));
    });
    expect(captured?.params.args).toEqual({ where: { email: 'x@y.com' } });
  });

  it('scopes Contract.findMany (Phase 2d)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.contract.findMany({ where: { code: 'CT-1' } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      code: 'CT-1',
      tenantId: 'tenant-A',
    });
  });

  it('scopes ContractAddendum.findMany (Phase 2d)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.contractAddendum.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes ContractDefaultSigner.findMany (Phase 2d)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.contractDefaultSigner.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes GateStepConfig.findMany (Phase 2d)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.gateStepConfig.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes ContractDefaultSigner.deleteMany (Phase 2d)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.contractDefaultSigner.deleteMany({}));
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes KanbanColumn.findMany (Phase 2c)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.kanbanColumn.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes KanbanColumn.findFirst by slug (Phase 2c — slug per-tenant unique)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.kanbanColumn.findFirst({ where: { slug: 'NEW_LEAD' } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      slug: 'NEW_LEAD',
      tenantId: 'tenant-A',
    });
  });

  it('scopes CrmEvent.groupBy (Phase 2c — closes the dashboard analytics leak)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.crmEvent.groupBy({
          by: ['eventType'],
          _count: true,
        }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes ExperienceEvaluation.groupBy (Phase 2c)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.experienceEvaluation.groupBy({
          by: ['decision'],
          _count: true,
        }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes ReEnrollmentPeriod.findMany (Phase 2e)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.reEnrollmentPeriod.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes ReEnrollmentInvite.groupBy — closes the kanban dashboard leak (Phase 2e)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.reEnrollmentInvite.groupBy({
          by: ['gateStatus'],
          _count: true,
        }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes PreReEnrollmentResponse.findMany (Phase 2e)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.preReEnrollmentResponse.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes PeriodPriceTable.findMany (Phase 2e)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.periodPriceTable.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes FamilyPriceException.findMany (Phase 2e)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.familyPriceException.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes Channel.findMany (Phase 2f)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.channel.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes Message.count — closes the search service leak (Phase 2f)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.message.count({ where: { isDeleted: false } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      isDeleted: false,
      tenantId: 'tenant-A',
    });
  });

  it('scopes Ticket.findMany (Phase 2f)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.ticket.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes TaskBoard.findMany (Phase 2f)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.taskBoard.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes TaskCard.count — used by board column views (Phase 2f)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.taskCard.count({ where: { columnId: 'col-1' } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      columnId: 'col-1',
      tenantId: 'tenant-A',
    });
  });

  it('scopes ModuleChannel.findFirst (Phase 2f — replaces old findUnique by triple key)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.moduleChannel.findFirst({
          where: { module: 'CRM', entityType: 'Lead', entityId: 'lead-1' },
        }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({
      module: 'CRM',
      entityType: 'Lead',
      entityId: 'lead-1',
      tenantId: 'tenant-A',
    });
  });

  it('scopes AuditLog.findMany — compliance-critical (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.auditLog.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes AuditLog.groupBy used by getAuditStats (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() =>
        client.auditLog.groupBy({ by: ['action'], _count: true }),
      );
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes Notification.findMany (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.notification.findMany({ where: { isRead: false } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      isRead: false,
      tenantId: 'tenant-A',
    });
  });

  it('scopes Asset / AssetCategory / AssetLocation findMany (Phase 2g)', async () => {
    const captures: string[] = [];
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.asset.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
      await runQuery(() => client.assetCategory.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
      await runQuery(() => client.assetLocation.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
    });
    expect(captures).toEqual(['tenant-A', 'tenant-A', 'tenant-A']);
  });

  it('scopes Supplier.findMany (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.supplier.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes PurchaseRequest.findMany (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.purchaseRequest.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes Document.findMany (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.document.findMany());
    });
    expect(captured?.params.args.where).toMatchObject({ tenantId: 'tenant-A' });
  });

  it('scopes Student.findMany — PII-critical (Phase 2g)', async () => {
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.student.findMany({ where: { status: 'ACTIVE' } }));
    });
    expect(captured?.params.args.where).toMatchObject({
      status: 'ACTIVE',
      tenantId: 'tenant-A',
    });
  });

  it('scopes CalendarEvent / InventorySession / ImportHistory findMany (Phase 2g)', async () => {
    const captures: string[] = [];
    await runWithTenant('tenant-A', async () => {
      await runQuery(() => client.calendarEvent.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
      await runQuery(() => client.inventorySession.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
      await runQuery(() => client.importHistory.findMany());
      captures.push((captured?.params.args.where as any).tenantId);
    });
    expect(captures).toEqual(['tenant-A', 'tenant-A', 'tenant-A']);
  });

  it('parallel runs scope correctly to their own tenant', async () => {
    const captures: Array<Prisma.MiddlewareParams> = [];
    // Fresh client for this test — same ordering rule: scope first,
    // sentinel last in the chain so it sees the post-mutation args.
    client = new PrismaClient();
    attachTenantScopeMiddleware(client);
    client.$use(async (params) => {
      captures.push(JSON.parse(JSON.stringify(params)));
      throw new Error('STOPPED_FOR_TEST');
    });

    const queryA = runWithTenant('tenant-A', async () => {
      await new Promise((r) => setTimeout(r, 2));
      try {
        await client.lead.findMany();
      } catch {}
    });
    const queryB = runWithTenant('tenant-B', async () => {
      try {
        await client.lead.findMany();
      } catch {}
    });
    await Promise.all([queryA, queryB]);

    const tenantsSeen = captures.map((p) => p.args?.where?.tenantId).sort();
    expect(tenantsSeen).toEqual(['tenant-A', 'tenant-B']);
  });
});
