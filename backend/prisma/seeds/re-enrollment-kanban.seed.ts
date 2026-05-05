/**
 * Seed dataset for the re-enrollment Kanban E2E verification.
 *
 * Idempotent: clears prior rows scoped to the seed-owned Lead + Period
 * (identified by stable codes and the period name) before repopulating.
 * Everything it creates is prefixed "[SEED]" so it is visually obvious in
 * any admin view and easy to clean up manually if needed.
 *
 * Run: `npm run seed:kanban` inside backend/, or `npx tsx prisma/seeds/re-enrollment-kanban.seed.ts`.
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const LEAD_CODE = 'SEED-KANBAN-LEAD';
const LEAD_COLUMN_ID = 'kc-enrolled';
const PERIOD_NAME = 'Seed Period — Kanban E2E';
const TARGET_YEAR = 2027;
const STUDENT_ACADEMIC_YEAR = 2026;

const DAY = 24 * 60 * 60 * 1000;

type GateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

interface InviteSpec {
  slug: string;         // stable student code suffix — doubles as identifier inside the seed
  displayName: string;
  grade: string;
  gateStatus: GateStatus;
  extendedDeadlineDaysFromNow?: number | null;  // null → leave unset
  rematriculadoAtDaysAgo?: number | null;       // only meaningful for REMATRICULADO
  note?: string;
}

const INVITES: InviteSpec[] = [
  // 2 per gate status (minimum). One CONVITE_ENVIADO carries a past deadline
  // to exercise the overdue indicator.
  { slug: 'convite-1',       displayName: 'Convite Um',         grade: '6º Ano',  gateStatus: 'CONVITE_ENVIADO', extendedDeadlineDaysFromNow: -2, note: 'overdue' },
  { slug: 'convite-2',       displayName: 'Convite Dois',       grade: '7º Ano',  gateStatus: 'CONVITE_ENVIADO' },

  { slug: 'formulario-1',    displayName: 'Formulário Um',      grade: '5º Ano',  gateStatus: 'FORMULARIO_CONFIRMADO', note: 'hasAction' },
  { slug: 'formulario-2',    displayName: 'Formulário Dois',    grade: '5º Ano',  gateStatus: 'FORMULARIO_CONFIRMADO', note: 'hasAction' },

  { slug: 'docs-1',          displayName: 'Documentos Um',      grade: '8º Ano',  gateStatus: 'DOCS_APROVADOS', note: 'hasAction' },
  { slug: 'docs-2',          displayName: 'Documentos Dois',    grade: '8º Ano',  gateStatus: 'DOCS_APROVADOS', note: 'hasAction' },

  { slug: 'contrato-pend-1', displayName: 'Contrato Pendente Um',   grade: '3º Ano', gateStatus: 'CONTRATO_PENDENTE' },
  { slug: 'contrato-pend-2', displayName: 'Contrato Pendente Dois', grade: '3º Ano', gateStatus: 'CONTRATO_PENDENTE' },

  { slug: 'contrato-ass-1',  displayName: 'Contrato Assinado Um',   grade: '2º Ano', gateStatus: 'CONTRATO_ASSINADO', note: 'hasAction' },
  { slug: 'contrato-ass-2',  displayName: 'Contrato Assinado Dois', grade: '2º Ano', gateStatus: 'CONTRATO_ASSINADO', note: 'hasAction' },

  { slug: 'pagamento-1',     displayName: 'Pagamento Um',       grade: '1º Ano',  gateStatus: 'TAXA_PAGA' },
  { slug: 'pagamento-2',     displayName: 'Pagamento Dois',     grade: '1º Ano',  gateStatus: 'TAXA_PAGA' },

  // REMATRICULADO: 3 rows — one archived (45d ago), two recent (5d ago).
  { slug: 'concluido-1',     displayName: 'Concluído Um',       grade: '4º Ano',  gateStatus: 'REMATRICULADO', rematriculadoAtDaysAgo: 5 },
  { slug: 'concluido-2',     displayName: 'Concluído Dois',     grade: '4º Ano',  gateStatus: 'REMATRICULADO', rematriculadoAtDaysAgo: 5 },
  { slug: 'concluido-archived', displayName: 'Concluído Arquivado', grade: '4º Ano', gateStatus: 'REMATRICULADO', rematriculadoAtDaysAgo: 45, note: 'archived' },

  { slug: 'recusado-1',      displayName: 'Recusado Um',        grade: '9º Ano',  gateStatus: 'RECUSADO' },
  { slug: 'recusado-2',      displayName: 'Recusado Dois',      grade: '9º Ano',  gateStatus: 'RECUSADO' },
];

async function clearPriorSeed() {
  const period = await prisma.reEnrollmentPeriod.findFirst({ where: { name: PERIOD_NAME } });
  if (period) {
    // Invites cascade-delete from the period via Prisma relation (onDelete: Cascade).
    await prisma.reEnrollmentPeriod.delete({ where: { id: period.id } });
  }

  const lead = await prisma.lead.findUnique({ where: { code: LEAD_CODE } });
  if (lead) {
    // Lead cascade-deletes children and their Students.
    await prisma.lead.delete({ where: { id: lead.id } });
  }
}

async function seedMasterUser(): Promise<string> {
  // Seed period requires createdById. Use an existing admin if one is present,
  // otherwise create a lightweight placeholder so the seed remains self-contained.
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) return existing.id;
  throw new Error('Seed requires at least one ADMIN user. Run the main seed (npm run db:seed) first.');
}

async function seedLead(): Promise<string> {
  const lead = await prisma.lead.create({
    data: {
      code: LEAD_CODE,
      familyName: '[SEED] Família Kanban',
      primaryContactName: '[SEED] Responsável',
      primaryContactEmail: 'seed-kanban@example.com',
      columnId: LEAD_COLUMN_ID,
      numberOfChildren: INVITES.length,
    },
  });
  return lead.id;
}

async function seedPeriod(createdById: string): Promise<string> {
  const now = Date.now();
  const period = await prisma.reEnrollmentPeriod.create({
    data: {
      name: PERIOD_NAME,
      targetYear: TARGET_YEAR,
      startDate: new Date(now - 7 * DAY),
      endDate: new Date(now + 30 * DAY),
      status: 'DRAFT',                // created in DRAFT
      eligibleGrades: [],
      createdById,
    },
  });
  // Transition DRAFT -> OPEN. Only one OPEN period is allowed system-wide
  // (enforced at the service layer, not the DB). If any other period is
  // already OPEN the seed leaves itself in DRAFT and warns — it must never
  // mutate state that isn't seed-owned, because another dev could be in the
  // middle of work on that other period.
  const otherOpen = await prisma.reEnrollmentPeriod.findFirst({
    where: { status: 'OPEN', id: { not: period.id } },
    select: { id: true, name: true },
  });
  if (otherOpen) {
    console.warn(
      `⚠️  Another OPEN period exists ("${otherOpen.name}"). Seed period left in DRAFT ` +
      'to avoid touching state the seed does not own. ' +
      'Pick "Seed Period — Kanban E2E" from the period selector in the preview to use it, ' +
      'or close the other period manually through the Rematrículas UI.',
    );
    return period.id;
  }
  await prisma.reEnrollmentPeriod.update({
    where: { id: period.id },
    data: { status: 'OPEN', openedAt: new Date() },
  });
  return period.id;
}

async function seedInvites(leadId: string, periodId: string) {
  const now = Date.now();

  for (const spec of INVITES) {
    const child = await prisma.leadChild.create({
      data: {
        leadId,
        fullName: `[SEED] ${spec.displayName}`,
        currentGrade: spec.grade,
        studentType: 'CURRENT',
      },
    });

    const student = await prisma.student.create({
      data: {
        code: `SEED-STD-${spec.slug}`.toUpperCase(),
        leadId,
        leadChildId: child.id,
        fullName: `[SEED] ${spec.displayName}`,
        grade: spec.grade,
        academicYear: STUDENT_ACADEMIC_YEAR,
        status: 'ACTIVE',
      },
    });

    const extendedDeadline =
      spec.extendedDeadlineDaysFromNow != null
        ? new Date(now + spec.extendedDeadlineDaysFromNow * DAY)
        : null;

    const rematriculadoAt =
      spec.gateStatus === 'REMATRICULADO' && spec.rematriculadoAtDaysAgo != null
        ? new Date(now - spec.rematriculadoAtDaysAgo * DAY)
        : null;

    await prisma.reEnrollmentInvite.create({
      data: {
        periodId,
        studentId: student.id,
        token: nanoid(),
        gateStatus: spec.gateStatus,
        status: spec.gateStatus === 'RECUSADO' ? 'DECLINED' : 'SENT',
        extendedDeadline,
        rematriculadoAt,
        sentAt: new Date(now - 3 * DAY),
      },
    });
  }
}

async function main() {
  console.log('🌱 Seeding re-enrollment Kanban E2E dataset...');
  const createdById = await seedMasterUser();
  await clearPriorSeed();
  const leadId = await seedLead();
  const periodId = await seedPeriod(createdById);
  await seedInvites(leadId, periodId);

  const total = await prisma.reEnrollmentInvite.count({ where: { periodId } });
  const byGate = await prisma.reEnrollmentInvite.groupBy({
    by: ['gateStatus'],
    where: { periodId },
    _count: { _all: true },
    orderBy: { gateStatus: 'asc' },
  });

  console.log(`✅ Seeded period ${periodId} with ${total} invite(s).`);
  for (const row of byGate) {
    console.log(`   ${row.gateStatus.padEnd(24, ' ')} ${row._count._all}`);
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
