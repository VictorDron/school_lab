/**
 * Limpa registros de rematrícula dos alunos criados via import em massa.
 *
 * Critério: alunos cujo createdAt cai dentro da janela de cada ImportHistory
 * (do início -10 min até +60 min do registro de import). O campo
 * Lead.originType não foi marcado como IMPORTED no momento do import, então
 * usamos a janela de tempo como heurística confiável.
 *
 * Uso:
 *   tsx backend/scripts/clean-imported-reenrollment.ts            # dry-run
 *   tsx backend/scripts/clean-imported-reenrollment.ts --apply    # aplica
 *
 * Escopo (só rematrícula — NÃO mexe em Lead, Student, Contract):
 *   - ReEnrollmentInvite
 *   - PreReEnrollmentResponse
 *   - FamilyPriceException
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const WINDOW_BEFORE_MS = 10 * 60 * 1000;
const WINDOW_AFTER_MS = 60 * 60 * 1000;

async function main() {
  const apply = process.argv.includes('--apply');
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n[clean-imported-reenrollment] mode=${mode}\n`);

  const imports = await prisma.importHistory.findMany({
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileName: true, createdAt: true, created: true },
  });

  if (imports.length === 0) {
    console.log('Nenhum ImportHistory encontrado. Nada a fazer.');
    return;
  }

  console.log(`Imports considerados (${imports.length}):`);
  for (const h of imports) {
    console.log(`  ${h.createdAt.toISOString()}  ${h.fileName}  created=${h.created}`);
  }
  console.log();

  const windowFilters: Prisma.StudentWhereInput[] = imports.map((h) => ({
    createdAt: {
      gte: new Date(h.createdAt.getTime() - WINDOW_BEFORE_MS),
      lte: new Date(h.createdAt.getTime() + WINDOW_AFTER_MS),
    },
  }));

  const importedStudents = await prisma.student.findMany({
    where: { OR: windowFilters },
    select: {
      id: true,
      fullName: true,
      code: true,
      grade: true,
      createdAt: true,
      _count: {
        select: {
          reEnrollmentInvites: true,
          preReEnrollmentResponses: true,
          familyPriceExceptions: true,
        },
      },
    },
  });

  const withRecords = importedStudents.filter(
    (s) =>
      s._count.reEnrollmentInvites > 0 ||
      s._count.preReEnrollmentResponses > 0 ||
      s._count.familyPriceExceptions > 0,
  );

  const totals = withRecords.reduce(
    (acc, s) => {
      acc.invites += s._count.reEnrollmentInvites;
      acc.responses += s._count.preReEnrollmentResponses;
      acc.exceptions += s._count.familyPriceExceptions;
      return acc;
    },
    { invites: 0, responses: 0, exceptions: 0 },
  );

  console.log(`Alunos importados: ${importedStudents.length}`);
  console.log(`Com registros de rematrícula: ${withRecords.length}`);
  console.log('Totais a remover:');
  console.log(`  ReEnrollmentInvite:        ${totals.invites}`);
  console.log(`  PreReEnrollmentResponse:   ${totals.responses}`);
  console.log(`  FamilyPriceException:      ${totals.exceptions}\n`);

  if (withRecords.length === 0) {
    console.log('Nada a limpar.');
    return;
  }

  const preview = withRecords.slice(0, 10);
  console.log(`Prévia (primeiros ${preview.length} de ${withRecords.length}):`);
  for (const s of preview) {
    console.log(
      `  - ${s.fullName} (${s.code}) grade=${s.grade ?? '-'} ` +
        `inv=${s._count.reEnrollmentInvites} ` +
        `resp=${s._count.preReEnrollmentResponses} ` +
        `exc=${s._count.familyPriceExceptions}`,
    );
  }

  if (!apply) {
    console.log('\nDRY-RUN: nada foi alterado. Rode com --apply para executar.\n');
    return;
  }

  const studentIds = withRecords.map((s) => s.id);

  const result = await prisma.$transaction(async (tx) => {
    const inv = await tx.reEnrollmentInvite.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    const resp = await tx.preReEnrollmentResponse.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    const exc = await tx.familyPriceException.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    return { inv: inv.count, resp: resp.count, exc: exc.count };
  });

  console.log('\nExcluídos:');
  console.log(`  ReEnrollmentInvite:        ${result.inv}`);
  console.log(`  PreReEnrollmentResponse:   ${result.resp}`);
  console.log(`  FamilyPriceException:      ${result.exc}\n`);
  console.log('Limpeza concluída.');
}

main()
  .catch((err) => {
    console.error('\nErro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
