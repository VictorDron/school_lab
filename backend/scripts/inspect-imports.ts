import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const hist = await prisma.importHistory.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!hist) return;
  const importedAt = hist.createdAt;
  console.log(`Import em ${importedAt.toISOString()} (${hist.fileName}) — ${hist.created} alunos`);

  const from = new Date(importedAt.getTime() - 10 * 60 * 1000);
  const to = new Date(importedAt.getTime() + 60 * 60 * 1000);

  const nearImport = await prisma.student.count({
    where: { createdAt: { gte: from, lte: to } },
  });
  const before = await prisma.student.count({ where: { createdAt: { lt: from } } });
  const after = await prisma.student.count({ where: { createdAt: { gt: to } } });

  console.log(`Students criados na janela do import (+-): ${nearImport}`);
  console.log(`Students criados ANTES da janela:         ${before}`);
  console.log(`Students criados DEPOIS da janela:        ${after}`);

  const sample = await prisma.student.findMany({
    orderBy: { createdAt: 'asc' },
    take: 5,
    select: { fullName: true, code: true, createdAt: true },
  });
  console.log('\n5 primeiros students (por createdAt):');
  sample.forEach((s) => console.log(`  ${s.createdAt.toISOString()} ${s.code} ${s.fullName}`));

  const last = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { fullName: true, code: true, createdAt: true },
  });
  console.log('\n5 últimos students (por createdAt):');
  last.forEach((s) => console.log(`  ${s.createdAt.toISOString()} ${s.code} ${s.fullName}`));
}
main().finally(() => prisma.$disconnect());
