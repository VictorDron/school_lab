-- ==================== PHASE 5 — POSTGRES RLS (defense-in-depth) ====================
-- Enables Row Level Security on every tenanted table so that even if
-- application-level auto-scope is bypassed (a stray findUnique by id, a
-- raw SQL query, a future bug), the database itself rejects rows from
-- the wrong tenant.
--
-- Activation model — opt-in, permissive when unset:
--   - Each policy passes when current_setting('app.current_tenant_id')
--     IS NULL (or empty). This means the app behaves identically to
--     pre-RLS for any code path that hasn't been wrapped in
--     withTenantTx() yet — no breaking change to existing flows.
--   - When the GUC is set (via withTenantTx), only rows whose tenantId
--     matches are visible.
--   - The sentinel '__platform_admin__' bypasses tenant matching for
--     cross-tenant operations.
--
-- To go strict (fully enforce — no permissive default), drop the
-- "current_tenant_id() IS NULL" clause from each policy and verify
-- every code path is inside a withTenantTx scope first.

-- ---------------------------------------------------------------------------
-- Helper function — reads the per-transaction GUC. Returns NULL when the
-- session hasn't set it (i.e. legacy non-transaction-scoped queries).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '');
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------------
-- Loop helper expressed inline: for each tenanted table, enable RLS and
-- create a single isolation policy. Idempotent via DROP POLICY IF EXISTS.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    -- Phase 0 / 2a
    'SystemSettings', 'User', 'Invite',
    -- Phase 2b
    'Lead',
    -- Phase 2c
    'KanbanColumn', 'CrmEvent', 'ExperienceEvaluation',
    -- Phase 2d
    'Contract', 'ContractAddendum', 'ContractDefaultSigner', 'GateStepConfig',
    -- Phase 2e
    'ReEnrollmentPeriod', 'PeriodPriceTable', 'FamilyPriceException',
    'PreReEnrollmentResponse', 'ReEnrollmentInvite',
    -- Phase 2f
    'Channel', 'ModuleChannel', 'Message', 'Ticket', 'TaskBoard', 'TaskCard',
    -- Phase 2g
    'AuditLog', 'Notification', 'Document', 'ImportHistory',
    'PurchaseRequest', 'Supplier', 'Asset', 'AssetCategory', 'AssetLocation',
    'InventorySession', 'CalendarEvent', 'Student'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop existing policy if a previous run left one — keeps the
    -- migration safely re-runnable in dev.
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);

    -- Permissive-when-unset policy. Drops to strict mode by removing
    -- the "current_tenant_id() IS NULL" clause once every caller is
    -- wrapped in withTenantTx().
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation ON %I
      USING (
        current_tenant_id() IS NULL
        OR current_tenant_id() = '__platform_admin__'
        OR "tenantId"::text = current_tenant_id()
      )
      WITH CHECK (
        current_tenant_id() IS NULL
        OR current_tenant_id() = '__platform_admin__'
        OR "tenantId"::text = current_tenant_id()
      )
    $pol$, tbl);
  END LOOP;
END $$;
