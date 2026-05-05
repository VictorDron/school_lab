/**
 * Grant CRM:VIEW to every active user who currently has any STUDENT_MANAGEMENT
 * permission. Needed because the re-enrollment admin UI moved under the CRM
 * module's route guard (ModuleRoute module="CRM") during the Phase 2 refactor:
 * users who historically had STUDENT_MANAGEMENT but not CRM would lose UI
 * access after Phase 2 ships.
 *
 * The backend is already dual-permitted (requireAnyModuleAccess — Phase 1),
 * so this script closes the *frontend* access gap only. Never raises an
 * existing CRM level. Elevation to CRM:EDIT or higher is a separate decision.
 *
 * Modes
 *   npm run migrate:crm-access                → dry-run (default, no DB writes)
 *   npm run migrate:crm-access -- --dry-run   → dry-run (explicit)
 *   npm run migrate:crm-access -- --apply     → executes the grants
 *
 * Idempotent: re-running after a successful --apply produces "0 new grants"
 * because every qualifier now has CRM access and short-circuits.
 *
 * Reversibility
 *   Each --apply run writes a log at
 *     backend/prisma/seeds/logs/crm-access-grants-<ISO-timestamp>.json
 *   listing every granted userId + email. To roll back, for a given log file:
 *
 *     DELETE FROM "ModuleAccess"
 *      WHERE "module" = 'CRM'
 *        AND "accessLevel" = 'VIEW'
 *        AND "userId" IN (<userIds from log.grants[].userId>);
 *
 *   Only rows this script created will match — we never update an existing
 *   row, we only upsert-create when the user has no CRM record, so the
 *   rollback is surgical.
 */

import { PrismaClient, type AppModule, type AccessLevel } from '@prisma/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { hostname, userInfo } from 'os';

/**
 * Identify who's running the script. Audit logs benefit from a "who did this"
 * attribution when multiple operators share access to prod. Falls back
 * gracefully when any source is missing — the script must not fail just
 * because an identity can't be determined.
 */
function resolveExecutor() {
  const envUser = process.env.RAILWAY_USER_EMAIL || process.env.USER || process.env.USERNAME;
  let systemUser: string | null = null;
  try {
    systemUser = userInfo().username;
  } catch {
    systemUser = null;
  }
  let host: string | null = null;
  try {
    host = hostname();
  } catch {
    host = null;
  }
  return {
    user: envUser ?? systemUser ?? 'unknown',
    host: host ?? 'unknown',
    platform: process.platform,
  };
}

const prisma = new PrismaClient();

const STUDENT_MANAGEMENT: AppModule = 'STUDENT_MANAGEMENT';
const CRM: AppModule = 'CRM';
const GRANT_LEVEL: AccessLevel = 'VIEW';
const LOG_DIR = join(__dirname, '..', 'prisma', 'seeds', 'logs');

interface PermissionEntry {
  module: string;
  accessLevel: string;
}

interface Candidate {
  userId: string;
  email: string;
  displayName: string | null;
  currentPermissions: PermissionEntry[];
}

interface SkipEntry extends Candidate {
  reason: string;
}

async function classify() {
  // All ACTIVE users with at least one non-NONE STUDENT_MANAGEMENT permission.
  const candidates = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      moduleAccess: {
        some: {
          module: STUDENT_MANAGEMENT,
          accessLevel: { not: 'NONE' },
        },
      },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      moduleAccess: {
        where: { accessLevel: { not: 'NONE' } },
        select: { module: true, accessLevel: true },
        orderBy: { module: 'asc' },
      },
    },
    orderBy: { email: 'asc' },
  });

  const toGrant: Candidate[] = [];
  const skipped: SkipEntry[] = [];

  for (const u of candidates) {
    const entry: Candidate = {
      userId: u.id,
      email: u.email,
      displayName: u.displayName,
      currentPermissions: u.moduleAccess,
    };
    const hasCrm = u.moduleAccess.some((m) => m.module === CRM);
    if (hasCrm) {
      skipped.push({ ...entry, reason: 'already has CRM access, skipped' });
    } else {
      toGrant.push(entry);
    }
  }

  return { toGrant, skipped };
}

function printTable(rows: Candidate[], label: string) {
  if (rows.length === 0) {
    console.log(`   (none)`);
    return;
  }
  for (const r of rows) {
    const perms = r.currentPermissions.map((p) => `${p.module}:${p.accessLevel}`).join(', ');
    console.log(`   • ${r.email.padEnd(30, ' ')}  ${r.displayName ?? ''}`);
    console.log(`     current: ${perms || '(no non-NONE permissions)'}`);
    if (label === 'grant') {
      console.log(`     → will grant: ${CRM}:${GRANT_LEVEL}`);
    }
  }
}

async function runDryRun() {
  const { toGrant, skipped } = await classify();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Mode: DRY-RUN — no database writes will happen.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();
  console.log(`Users that WOULD receive ${CRM}:${GRANT_LEVEL} grants: ${toGrant.length}`);
  printTable(toGrant, 'grant');
  console.log();
  console.log(`Users SKIPPED (already have CRM access): ${skipped.length}`);
  printTable(skipped, 'skip');
  console.log();
  console.log(`Total qualifying users: ${toGrant.length + skipped.length}`);
  console.log(`To execute: npm run migrate:crm-access -- --apply`);
}

async function runApply() {
  const { toGrant, skipped } = await classify();
  const executor = resolveExecutor();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Mode: APPLY — writing grants to the database.`);
  console.log(`  Executor: ${executor.user}@${executor.host} (${executor.platform})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  if (toGrant.length === 0) {
    console.log(`0 new grants — every qualifying user already has CRM access.`);
    console.log(`Skipped (already have CRM access): ${skipped.length}`);
    return;
  }

  const startedAt = new Date();
  const applied: Array<Candidate & { grantedAt: string }> = [];

  for (const user of toGrant) {
    // Upsert keeps this idempotent even if a race re-creates the row between
    // classify and apply. We never update an existing row because classify
    // already filtered users who had any CRM record — but the upsert ensures
    // concurrent runs can't create duplicate rows either.
    await prisma.moduleAccess.upsert({
      where: { userId_module: { userId: user.userId, module: CRM } },
      create: { userId: user.userId, module: CRM, accessLevel: GRANT_LEVEL },
      update: {}, // explicit no-op: never raise an existing level
    });
    const grantedAt = new Date().toISOString();
    applied.push({ ...user, grantedAt });
    console.log(`   ✓ ${user.email} → ${CRM}:${GRANT_LEVEL}`);
  }

  console.log();
  console.log(`${applied.length} grant(s) applied.`);
  console.log(`Skipped (already had CRM access): ${skipped.length}`);

  // Write the audit log
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
  const logPath = join(LOG_DIR, `crm-access-grants-${startedAt.toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(
    logPath,
    JSON.stringify(
      {
        startedAt: startedAt.toISOString(),
        executor,
        grantedModule: CRM,
        grantedLevel: GRANT_LEVEL,
        grants: applied.map((a) => ({
          userId: a.userId,
          email: a.email,
          displayName: a.displayName,
          previousPermissions: a.currentPermissions,
          grantedAt: a.grantedAt,
        })),
      },
      null,
      2,
    ),
  );
  console.log(`Audit log: ${logPath}`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply) {
    await runApply();
  } else {
    await runDryRun();
  }
}

main()
  .catch((err) => {
    console.error('❌ migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
