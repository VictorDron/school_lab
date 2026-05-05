/**
 * Operational seed for the re-enrollment Kanban — uses REAL active students
 * from the database instead of synthetic "[SEED]" fixtures.
 *
 * Populates the currently OPEN re-enrollment period with 31 invites spread
 * across every gate column, mimicking a campaign mid-flight:
 *
 *   10  CONVITE_ENVIADO       (2 with an extendedDeadline in the past → overdue)
 *    8  FORMULARIO_CONFIRMADO (openedAt + confirmedAt filled)
 *    5  DOCS_APROVADOS
 *    3  CONTRATO_PENDENTE
 *    1  CONTRATO_ASSINADO
 *    2  TAXA_PAGA
 *    1  REMATRICULADO         (rematriculadoAt 5 days ago — still visible)
 *    1  RECUSADO              (declineReason set)
 *
 * Student selection is deterministic: active students sorted by `code`
 * ascending, first 31 picked. Assignment of a gate state to a student is
 * stable across runs, so re-running produces the same result.
 *
 * Idempotent: per (periodId, studentId) the invite is inserted only when
 * absent. Students with a pre-existing invite for this period are left
 * untouched — this seed never overrides manual state.
 *
 * Requires: exactly one re-enrollment period with status OPEN. Bails with
 * a clear message otherwise — it must not mutate ambiguous state.
 *
 * Run: `npm run seed:re-enrollment-operational` (inside backend/), or
 *      `npx tsx prisma/seeds/re-enrollment-operational.seed.ts`.
 */

import { PrismaClient, type ReEnrollmentGateStatus, type ReEnrollmentInviteStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// Slot distribution — sum must equal SLOT_COUNT.
const DISTRIBUTION: ReEnrollmentGateStatus[] = [
  // 10 CONVITE_ENVIADO — slots 0 and 1 get an overdue deadline for badge testing.
  'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO',
  'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO', 'CONVITE_ENVIADO',
  // 8 FORMULARIO_CONFIRMADO
  'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO',
  'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO', 'FORMULARIO_CONFIRMADO',
  // 5 DOCS_APROVADOS
  'DOCS_APROVADOS', 'DOCS_APROVADOS', 'DOCS_APROVADOS', 'DOCS_APROVADOS', 'DOCS_APROVADOS',
  // 3 CONTRATO_PENDENTE, 1 CONTRATO_ASSINADO
  'CONTRATO_PENDENTE', 'CONTRATO_PENDENTE', 'CONTRATO_PENDENTE',
  'CONTRATO_ASSINADO',
  // 2 TAXA_PAGA, 1 REMATRICULADO (recent), 1 RECUSADO
  'TAXA_PAGA', 'TAXA_PAGA',
  'REMATRICULADO',
  'RECUSADO',
];
const SLOT_COUNT = DISTRIBUTION.length; // 31
const OVERDUE_SLOTS = new Set<number>([0, 1]);

function inviteStatusFor(gate: ReEnrollmentGateStatus): ReEnrollmentInviteStatus {
  if (gate === 'RECUSADO') return 'DECLINED';
  if (gate === 'CONVITE_ENVIADO') return 'SENT';
  return 'CONFIRMED';
}

interface InviteDataForSlot {
  token: string;
  gateStatus: ReEnrollmentGateStatus;
  status: ReEnrollmentInviteStatus;
  sentAt: Date;
  openedAt: Date | null;
  confirmedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  extendedDeadline: Date | null;
  rematriculadoAt: Date | null;
  emailStatus: string | null;
  emailSentAt: Date | null;
}

function buildInviteData(slotIndex: number, gate: ReEnrollmentGateStatus): InviteDataForSlot {
  const sentAt = new Date(NOW - 14 * DAY);
  const openedAt = gate !== 'CONVITE_ENVIADO' ? new Date(NOW - 12 * DAY) : null;
  const confirmedAt =
    gate !== 'CONVITE_ENVIADO' && gate !== 'RECUSADO' ? new Date(NOW - 11 * DAY) : null;

  return {
    token: nanoid(),
    gateStatus: gate,
    status: inviteStatusFor(gate),
    sentAt,
    openedAt,
    confirmedAt,
    declinedAt: gate === 'RECUSADO' ? new Date(NOW - 4 * DAY) : null,
    declineReason: gate === 'RECUSADO' ? 'Família optou por mudar de escola em 2027.' : null,
    extendedDeadline: OVERDUE_SLOTS.has(slotIndex) ? new Date(NOW - 3 * DAY) : null,
    rematriculadoAt: gate === 'REMATRICULADO' ? new Date(NOW - 5 * DAY) : null,
    emailStatus: 'sent',
    emailSentAt: sentAt,
  };
}

async function resolveOpenPeriod() {
  const openPeriods = await prisma.reEnrollmentPeriod.findMany({
    where: { status: 'OPEN' },
    select: { id: true, name: true, startDate: true, endDate: true, eligibleGrades: true },
  });

  if (openPeriods.length === 0) {
    throw new Error(
      'No re-enrollment period with status OPEN. Open one via the admin UI before seeding.',
    );
  }
  if (openPeriods.length > 1) {
    throw new Error(
      `Multiple OPEN periods found (${openPeriods.map((p) => `"${p.name}"`).join(', ')}). ` +
        'Resolve ambiguity before seeding — only one period should be OPEN at a time.',
    );
  }
  return openPeriods[0];
}

async function pickEligibleStudents(periodId: string, count: number) {
  // Deterministic: active students sorted by code ascending. Stable mapping
  // between slot index and student across runs so the distribution is
  // reproducible.
  //
  // Synthetic students from the Kanban E2E seed (code prefix "SEED-") are
  // excluded — this seed is explicitly for real-data testing, and leaving
  // them in the pool would shadow real students in the first-N window.
  const students = await prisma.student.findMany({
    where: {
      status: 'ACTIVE',
      code: { not: { startsWith: 'SEED-' } },
    },
    select: { id: true, code: true, fullName: true, grade: true },
    orderBy: { code: 'asc' },
    take: count,
  });

  if (students.length < count) {
    console.warn(
      `⚠️  Requested ${count} students but only ${students.length} ACTIVE students exist. ` +
        'Distribution will be truncated.',
    );
  }

  // Annotate each with its prior invite (if any) so we can skip in place.
  const existingInvites = await prisma.reEnrollmentInvite.findMany({
    where: { periodId, studentId: { in: students.map((s) => s.id) } },
    select: { studentId: true },
  });
  const alreadyInvited = new Set(existingInvites.map((i) => i.studentId));

  return students.map((s) => ({ ...s, alreadyInvited: alreadyInvited.has(s.id) }));
}

async function main() {
  console.log('🌱 Seeding operational re-enrollment dataset...');
  const period = await resolveOpenPeriod();
  console.log(`   Target period: "${period.name}" (${period.id})`);

  const students = await pickEligibleStudents(period.id, SLOT_COUNT);
  console.log(`   Eligible pool: ${students.length} student(s) (first ${SLOT_COUNT} by code)`);

  const toCreate: Array<{ slot: number; gate: ReEnrollmentGateStatus; studentId: string; studentName: string }> = [];
  const skipped: Array<{ slot: number; gate: ReEnrollmentGateStatus; studentName: string }> = [];

  students.slice(0, SLOT_COUNT).forEach((student, slotIndex) => {
    const gate = DISTRIBUTION[slotIndex];
    if (student.alreadyInvited) {
      skipped.push({ slot: slotIndex, gate, studentName: student.fullName });
    } else {
      toCreate.push({ slot: slotIndex, gate, studentId: student.id, studentName: student.fullName });
    }
  });

  for (const spec of toCreate) {
    const data = buildInviteData(spec.slot, spec.gate);
    await prisma.reEnrollmentInvite.create({
      data: {
        periodId: period.id,
        studentId: spec.studentId,
        ...data,
      },
    });
  }

  const total = await prisma.reEnrollmentInvite.count({ where: { periodId: period.id } });
  const byGate = await prisma.reEnrollmentInvite.groupBy({
    by: ['gateStatus'],
    where: { periodId: period.id },
    _count: { _all: true },
    orderBy: { gateStatus: 'asc' },
  });

  console.log();
  console.log(`✅ Created ${toCreate.length} new invite(s). Skipped ${skipped.length} (already invited).`);
  console.log(`   Period "${period.name}" now has ${total} invite(s) total:`);
  for (const row of byGate) {
    console.log(`      ${row.gateStatus.padEnd(24, ' ')} ${row._count._all}`);
  }
  if (skipped.length > 0) {
    console.log();
    console.log('   Skipped slots (pre-existing invites):');
    for (const s of skipped) {
      console.log(`      slot ${String(s.slot).padStart(2, ' ')}  ${s.gate.padEnd(24, ' ')}  ${s.studentName}`);
    }
  }
  console.log('🌱 Done.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
