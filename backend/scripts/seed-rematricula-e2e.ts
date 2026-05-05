/**
 * Seed completo para validar o fluxo de rematrícula ponta-a-ponta.
 *
 * Cria:
 *   - 1 período OPEN para o ano alvo (default = ano atual + 1)
 *   - PeriodPriceTable com valores realistas para cada série elegível
 *   - 8 alunos elegíveis no ano letivo anterior (5 com Lead, 3 sem Lead)
 *   - Contratos do ano anterior em estados variados (adimplente / inadimplente / sem contrato)
 *   - 8 invites cobrindo todos os gateStatus (1 em cada estágio do funil)
 *
 * Uso:
 *   cd backend && npm run seed:rematricula              # dry-run? não, sempre aplica
 *   cd backend && npm run seed:rematricula -- --clean   # apaga seed anterior antes
 *
 * Os registros criados pelo seed têm o prefixo "[E2E]" no familyName
 * e código de aluno começando com "E2E-" para serem identificáveis.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const SEED_TAG = '[E2E]';
const STUDENT_CODE_PREFIX = 'E2E-';
const TARGET_YEAR = new Date().getFullYear() + 1;
const PREVIOUS_YEAR = TARGET_YEAR - 1;

const ELIGIBLE_GRADES = ['G6', 'G7', 'G8', 'G9'];
const PRICE_TABLE: Array<{ grade: string; baseAnnualValue: number; enrollmentFee: number }> = [
  { grade: 'G6', baseAnnualValue: 24000, enrollmentFee: 1500 },
  { grade: 'G7', baseAnnualValue: 25500, enrollmentFee: 1500 },
  { grade: 'G8', baseAnnualValue: 27000, enrollmentFee: 1500 },
  { grade: 'G9', baseAnnualValue: 28500, enrollmentFee: 1500 },
];

interface FamilySpec {
  familyName: string;
  email: string;
  childName: string;
  grade: string;
  contractScenario: 'ADIMPLENTE' | 'INADIMPLENTE' | 'SEM_CONTRATO';
}

const FAMILIES_WITH_LEAD: FamilySpec[] = [
  { familyName: 'Família Almeida', email: 'almeida.e2e@example.com', childName: 'Lucas Almeida', grade: 'G6', contractScenario: 'ADIMPLENTE' },
  { familyName: 'Família Barbosa', email: 'barbosa.e2e@example.com', childName: 'Mariana Barbosa', grade: 'G7', contractScenario: 'ADIMPLENTE' },
  { familyName: 'Família Costa', email: 'costa.e2e@example.com', childName: 'Pedro Costa', grade: 'G7', contractScenario: 'INADIMPLENTE' },
  { familyName: 'Família Duarte', email: 'duarte.e2e@example.com', childName: 'Sofia Duarte', grade: 'G8', contractScenario: 'INADIMPLENTE' },
  { familyName: 'Família Esteves', email: 'esteves.e2e@example.com', childName: 'Tiago Esteves', grade: 'G9', contractScenario: 'SEM_CONTRATO' },
];

const STUDENTS_WITHOUT_LEAD: Array<{ fullName: string; grade: string }> = [
  { fullName: 'Ana Ferreira', grade: 'G6' },
  { fullName: 'Bruno Gomes', grade: 'G8' },
  { fullName: 'Carla Henriques', grade: 'G9' },
];

type GateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

type InviteStatus = 'PENDING' | 'SENT' | 'OPENED' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED';

const INVITE_DISTRIBUTION: Array<{
  gateStatus: GateStatus;
  inviteStatus: InviteStatus;
  declineReason?: string;
}> = [
  { gateStatus: 'CONVITE_ENVIADO', inviteStatus: 'SENT' },
  { gateStatus: 'FORMULARIO_CONFIRMADO', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'DOCS_APROVADOS', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'CONTRATO_PENDENTE', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'CONTRATO_ASSINADO', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'TAXA_PAGA', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'REMATRICULADO', inviteStatus: 'CONFIRMED' },
  { gateStatus: 'RECUSADO', inviteStatus: 'DECLINED', declineReason: 'Mudança de cidade' },
];

async function getOrCreateAdminUser() {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin;

  admin = await prisma.user.create({
    data: {
      email: 'e2e-admin@rio.school',
      displayName: 'E2E Admin',
      fullName: 'E2E Seed Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  return admin;
}

async function getDefaultColumn(): Promise<string> {
  const column = await prisma.kanbanColumn.findFirst({ orderBy: { order: 'asc' } });
  if (!column) {
    const created = await prisma.kanbanColumn.create({
      data: { name: 'Novo Lead', slug: 'novo-lead', color: '#3B82F6', order: 0, isDefault: true },
    });
    return created.id;
  }
  return column.id;
}

async function cleanPreviousSeed() {
  const period = await prisma.reEnrollmentPeriod.findFirst({
    where: { name: { startsWith: SEED_TAG } },
  });
  if (period) {
    await prisma.reEnrollmentPeriod.delete({ where: { id: period.id } });
    console.log(`[clean] Período ${period.id} apagado (cascade removeu invites/preços/exceções).`);
  }

  const students = await prisma.student.findMany({
    where: { code: { startsWith: STUDENT_CODE_PREFIX } },
    select: { id: true },
  });
  if (students.length > 0) {
    await prisma.student.deleteMany({ where: { id: { in: students.map((s) => s.id) } } });
    console.log(`[clean] ${students.length} students apagados.`);
  }

  const leads = await prisma.lead.findMany({
    where: { familyName: { startsWith: SEED_TAG } },
    select: { id: true },
  });
  if (leads.length > 0) {
    await prisma.lead.deleteMany({ where: { id: { in: leads.map((l) => l.id) } } });
    console.log(`[clean] ${leads.length} leads apagados.`);
  }
}

async function createPeriod(adminId: string) {
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Mirror of assertNoOtherOpenPeriod (re-enrollment-core.service.ts) — kept
  // inline because this script must stay standalone (no service / redis /
  // socket.io imports). The DB-level partial unique index is the ultimate
  // backstop for any path that bypasses this check.
  const otherOpen = await prisma.reEnrollmentPeriod.findFirst({
    where: { status: 'OPEN' },
    select: { id: true, name: true },
  });
  if (otherOpen) {
    throw new Error(
      `Já existe uma campanha de rematrícula aberta: "${otherOpen.name}" (${otherOpen.id}). ` +
        `Feche essa campanha antes de rodar o seed, ou rode com --clean para remover seeds anteriores marcados com [E2E].`,
    );
  }

  const period = await prisma.reEnrollmentPeriod.create({
    data: {
      name: `${SEED_TAG} Rematrícula ${TARGET_YEAR}`,
      targetYear: TARGET_YEAR,
      startDate,
      endDate,
      eligibleGrades: ELIGIBLE_GRADES,
      status: 'OPEN',
      adjustmentPercent: new Prisma.Decimal('5.00'),
      requiresFeePayment: true,
      preReEnrollmentDeadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      earlyBirdDeadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      earlyBirdDiscountPercent: new Prisma.Decimal('5.00'),
      discountOptions: [5, 10, 15, 20] as Prisma.InputJsonValue,
      openedAt: now,
      createdById: adminId,
      priceTable: {
        create: PRICE_TABLE.map((entry) => ({
          grade: entry.grade,
          baseAnnualValue: new Prisma.Decimal(entry.baseAnnualValue),
          enrollmentFee: new Prisma.Decimal(entry.enrollmentFee),
        })),
      },
    },
  });
  console.log(`[period] Criado: ${period.id} (${period.name})`);
  return period;
}

async function createFamilyWithLead(spec: FamilySpec, columnId: string) {
  const code = `LEAD-E2E-${nanoid(6).toUpperCase()}`;
  const lead = await prisma.lead.create({
    data: {
      code,
      familyName: `${SEED_TAG} ${spec.familyName}`,
      primaryContactName: `${spec.childName.split(' ')[0]} (responsável)`,
      primaryContactEmail: spec.email,
      primaryContactPhone: '+55 21 99999-0000',
      desiredGrades: [spec.grade],
      columnId,
      children: {
        create: {
          fullName: spec.childName,
          relationship: 'STUDENT',
          isApplicant: true,
          desiredGrade: spec.grade,
          currentGrade: spec.grade,
          studentType: 'CURRENT',
        },
      },
    },
    include: { children: true },
  });

  const child = lead.children[0];
  const studentCode = `${STUDENT_CODE_PREFIX}${nanoid(6).toUpperCase()}`;
  const student = await prisma.student.create({
    data: {
      code: studentCode,
      leadId: lead.id,
      leadChildId: child.id,
      fullName: spec.childName,
      grade: spec.grade,
      academicYear: PREVIOUS_YEAR,
      status: 'ACTIVE',
    },
  });

  if (spec.contractScenario !== 'SEM_CONTRATO') {
    const priceEntry = PRICE_TABLE.find((p) => p.grade === spec.grade)!;
    const contract = await prisma.contract.create({
      data: {
        leadId: lead.id,
        studentId: student.id,
        code: `CT-E2E-${nanoid(6).toUpperCase()}`,
        status: 'ACTIVE',
        totalAnnualValue: new Prisma.Decimal(priceEntry.baseAnnualValue),
        enrollmentFee: new Prisma.Decimal(priceEntry.enrollmentFee),
        installments: 12,
        enrollmentType: 'FIRST',
        studentGrade: spec.grade,
        signedAt: new Date(`${PREVIOUS_YEAR}-01-15`),
        activatedAt: new Date(`${PREVIOUS_YEAR}-02-01`),
      },
    });

    const installmentValue = priceEntry.baseAnnualValue / 12;
    const paymentsData: Prisma.ContractPaymentCreateManyInput[] = [];
    for (let i = 1; i <= 12; i++) {
      const dueDate = new Date(PREVIOUS_YEAR, i - 1, 10);
      const isOverdue = spec.contractScenario === 'INADIMPLENTE' && i >= 10;
      paymentsData.push({
        contractId: contract.id,
        installmentNumber: i,
        dueDate,
        amount: new Prisma.Decimal(installmentValue.toFixed(2)),
        status: isOverdue ? 'OVERDUE' : 'PAID',
        paidAt: isOverdue ? null : dueDate,
      });
    }
    await prisma.contractPayment.createMany({ data: paymentsData });
  }

  return { lead, student };
}

async function createStudentWithoutLead(
  fullName: string,
  grade: string,
  fallbackLeadId: string,
  fallbackChildId: string,
) {
  // Schema requires leadId and leadChildId on Student. To represent
  // "students without active Lead context for re-enrollment financial
  // calculation", we point them at a shared placeholder Lead but with
  // no ACTIVE/SIGNED contract — the dashboard logic correctly classifies
  // them as SEM_CONTRATO.
  const studentCode = `${STUDENT_CODE_PREFIX}${nanoid(6).toUpperCase()}`;
  return prisma.student.create({
    data: {
      code: studentCode,
      leadId: fallbackLeadId,
      leadChildId: fallbackChildId,
      fullName,
      grade,
      academicYear: PREVIOUS_YEAR,
      status: 'ACTIVE',
    },
  });
}

async function createPlaceholderLead(columnId: string) {
  const lead = await prisma.lead.create({
    data: {
      code: `PLACEHOLDER-E2E-${nanoid(6).toUpperCase()}`,
      familyName: `${SEED_TAG} Família Placeholder (sem contrato)`,
      primaryContactName: 'Placeholder',
      primaryContactEmail: 'placeholder.e2e@example.com',
      desiredGrades: [],
      columnId,
      children: {
        create: {
          fullName: 'Placeholder Child',
          relationship: 'STUDENT',
          isApplicant: false,
        },
      },
    },
    include: { children: true },
  });
  return lead;
}

async function createInvites(periodId: string, students: { id: string }[]) {
  const slice = INVITE_DISTRIBUTION.slice(0, students.length);
  const now = new Date();

  for (let i = 0; i < slice.length; i++) {
    const student = students[i];
    const def = slice[i];
    const sentAt = new Date(now.getTime() - (10 - i) * 24 * 60 * 60 * 1000);
    const isTerminal = def.gateStatus === 'REMATRICULADO';

    await prisma.reEnrollmentInvite.create({
      data: {
        periodId,
        studentId: student.id,
        token: `E2E-${nanoid(20)}`,
        status: def.inviteStatus,
        gateStatus: def.gateStatus,
        sentAt,
        emailSentAt: sentAt,
        emailStatus: 'sent',
        openedAt: def.inviteStatus !== 'PENDING' ? sentAt : null,
        confirmedAt: ['CONFIRMED'].includes(def.inviteStatus) ? sentAt : null,
        declinedAt: def.inviteStatus === 'DECLINED' ? sentAt : null,
        declineReason: def.declineReason ?? null,
        rematriculadoAt: isTerminal ? new Date() : null,
      },
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');

  console.log(`\n=== Seed E2E Rematrícula ${TARGET_YEAR} ===\n`);

  if (shouldClean) {
    console.log('--clean: removendo seed anterior...');
    await cleanPreviousSeed();
  }

  const admin = await getOrCreateAdminUser();
  const columnId = await getDefaultColumn();

  const period = await createPeriod(admin.id);

  const studentsForInvites: Array<{ id: string }> = [];

  for (const family of FAMILIES_WITH_LEAD) {
    const { student } = await createFamilyWithLead(family, columnId);
    studentsForInvites.push({ id: student.id });
    console.log(`[student] ${family.childName} (${family.grade}) — cenário: ${family.contractScenario}`);
  }

  const placeholder = await createPlaceholderLead(columnId);
  for (const spec of STUDENTS_WITHOUT_LEAD) {
    const student = await createStudentWithoutLead(
      spec.fullName,
      spec.grade,
      placeholder.id,
      placeholder.children[0].id,
    );
    studentsForInvites.push({ id: student.id });
    console.log(`[student] ${spec.fullName} (${spec.grade}) — sem lead próprio`);
  }

  await createInvites(period.id, studentsForInvites);
  console.log(`[invites] ${Math.min(INVITE_DISTRIBUTION.length, studentsForInvites.length)} convites criados cobrindo todos os gateStatus.`);

  console.log('\n✓ Seed concluído.');
  console.log(`Período: ${period.name}`);
  console.log(`URL: /crm/re-enrollments\n`);
}

main()
  .catch((err) => {
    console.error('Seed falhou:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
