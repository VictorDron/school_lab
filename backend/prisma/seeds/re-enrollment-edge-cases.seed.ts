/**
 * Edge-case seed for the re-enrollment detail page.
 *
 * The operational seed (re-enrollment-operational.seed.ts) already produces
 * an incidental inconsistency: its single CONTRATO_ASSINADO slot moves the
 * invite's gate to that state without creating an actual Contract row,
 * since the seed inserts invite fields directly instead of going through
 * the contract creation flow. In production this combination should never
 * occur — the gate advances only after the renewal contract is issued.
 *
 * This seed isolates the same inconsistency as a named, dedicated fixture
 * so the detail page's handling of anomalous state is verifiable against
 * a predictable target, independent of the operational seed's slot
 * assignment. Purposes:
 *
 *   1. CONTRATO_ASSINADO gate with no Contract row → does the Resumo /
 *      Contrato / Pagamento tabs render graceful empty states, or does
 *      the UI surface a clear "inconsistent state" warning?
 *
 * Deterministic student pick: first ACTIVE student (excluding SEED-* and
 * excluding anyone already invited to the target period) whose `code`
 * sorts after the operational seed's window. Idempotent per
 * (periodId, studentId) — running twice does nothing.
 *
 * Marks its artifact with `notes = '[EDGE-CASE] CONTRATO_ASSINADO sem Contract'`
 * so cleanup is surgical:
 *
 *     DELETE FROM "ReEnrollmentInvite" WHERE notes LIKE '[EDGE-CASE]%';
 *
 * Run: `npm run seed:re-enrollment-edge-cases` inside backend/.
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const EDGE_NOTE_PREFIX = '[EDGE-CASE]';

async function resolveOpenPeriod() {
  const periods = await prisma.reEnrollmentPeriod.findMany({
    where: { status: 'OPEN' },
    select: { id: true, name: true, endDate: true },
  });
  if (periods.length === 0) {
    throw new Error('No OPEN re-enrollment period. Open one before seeding edge cases.');
  }
  if (periods.length > 1) {
    throw new Error(
      `Multiple OPEN periods found (${periods.map((p) => `"${p.name}"`).join(', ')}) — resolve before seeding.`,
    );
  }
  return periods[0];
}

async function pickEdgeCaseStudent(periodId: string) {
  // Already-invited students for this period are out. Synthetic [SEED] ones
  // are out. We take the earliest-by-code student not yet used by either
  // the operational seed or a prior edge-case run.
  const invitedIds = (
    await prisma.reEnrollmentInvite.findMany({
      where: { periodId },
      select: { studentId: true },
    })
  ).map((r) => r.studentId);

  const student = await prisma.student.findFirst({
    where: {
      status: 'ACTIVE',
      code: { not: { startsWith: 'SEED-' } },
      id: invitedIds.length > 0 ? { notIn: invitedIds } : undefined,
    },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, fullName: true, grade: true },
  });

  if (!student) {
    throw new Error(
      'No eligible student left to seed the edge case. Free one by removing an existing invite first.',
    );
  }
  return student;
}

async function main() {
  console.log('🌱 Seeding re-enrollment edge-case fixtures...');
  const period = await resolveOpenPeriod();
  console.log(`   Target period: "${period.name}" (${period.id})`);

  // Idempotency: if any [EDGE-CASE] fixture already exists for this period,
  // do nothing. Running the script twice must not silently pick a different
  // student and pile duplicate fixtures.
  const existing = await prisma.reEnrollmentInvite.findFirst({
    where: {
      periodId: period.id,
      notes: { startsWith: EDGE_NOTE_PREFIX },
    },
    select: { id: true, gateStatus: true, notes: true, student: { select: { fullName: true, code: true } } },
  });

  if (existing) {
    console.log(`   Edge-case invite already present: ${existing.id}`);
    console.log(`     student:    ${existing.student.fullName} (${existing.student.code})`);
    console.log(`     gateStatus: ${existing.gateStatus}`);
    console.log(`     notes:      ${existing.notes}`);
    console.log('🌱 Nothing to do.');
    return;
  }

  const student = await pickEdgeCaseStudent(period.id);
  console.log(`   Target student: ${student.fullName} (${student.code})`);

  // The inconsistency: create the invite directly in CONTRATO_ASSINADO with
  // confirmedAt stamped, but deliberately do NOT create a Contract row for
  // this lead. In a healthy system the gate only reaches this state after
  // contract creation + signing via the state machine.
  const created = await prisma.reEnrollmentInvite.create({
    data: {
      periodId: period.id,
      studentId: student.id,
      token: nanoid(),
      status: 'CONFIRMED',
      gateStatus: 'CONTRATO_ASSINADO',
      sentAt: new Date(NOW - 10 * DAY),
      openedAt: new Date(NOW - 9 * DAY),
      confirmedAt: new Date(NOW - 8 * DAY),
      emailStatus: 'sent',
      emailSentAt: new Date(NOW - 10 * DAY),
      notes: `${EDGE_NOTE_PREFIX} CONTRATO_ASSINADO sem Contract`,
    },
    select: { id: true },
  });

  console.log();
  console.log(`✅ Created edge-case invite ${created.id}:`);
  console.log(`     student:    ${student.fullName} (${student.code})`);
  console.log(`     gateStatus: CONTRATO_ASSINADO`);
  console.log(`     contract:   (none — inconsistent by design)`);
  console.log();
  console.log('Open it at:');
  console.log(`   /crm/re-enrollments/invites/${created.id}`);
  console.log();
  console.log('Cleanup:');
  console.log(`   DELETE FROM "ReEnrollmentInvite" WHERE notes LIKE '${EDGE_NOTE_PREFIX}%';`);
  console.log('🌱 Done.');
}

main()
  .catch((err) => {
    console.error('❌ Edge-case seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
