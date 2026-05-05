import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import logger from '../../utils/logger.js';
import { toNum } from './shared.js';
import type { DiscountImportPreview, DiscountImportRow } from './types.js';

/**
 * Validate a discount-import CSV against the eligible-students roster.
 * Tries code match first, falls back to name match, then flags rows as
 * matched / not_found / invalid / duplicate. The preview never touches
 * the database — operators review the table client-side before
 * `applyDiscountImport` actually persists exceptions.
 */
export async function previewDiscountImport(
  periodId: string,
  csvContent: string,
): Promise<DiscountImportPreview> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { id: true, eligibleGrades: true },
  });
  if (!period) throw createAppError('PERIOD_NOT_FOUND');

  const lines = csvContent.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw createAppError('IMPORT_INVALID_FORMAT', 'CSV deve ter cabeçalho e pelo menos uma linha de dados.');
  }

  const separator = lines[0].includes(';') ? ';' : ',';
  const header = lines[0]
    .split(separator)
    .map((h) => h.trim().toLowerCase().replace(/["﻿]/g, ''));

  const codeIdx = header.findIndex((h) => h.includes('codigo') || h.includes('code') || h.includes('código'));
  const nameIdx = header.findIndex((h) => h.includes('nome') || h.includes('name'));
  const discountIdx = header.findIndex(
    (h) => h.includes('desconto') || h.includes('discount') || h.includes('percentual'),
  );

  if (discountIdx === -1) {
    throw createAppError('IMPORT_INVALID_FORMAT', 'Coluna de desconto não encontrada. Use: percentual_desconto');
  }

  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE', grade: { in: period.eligibleGrades } },
    select: { id: true, code: true, fullName: true, grade: true },
  });

  const existingExceptions = await prisma.familyPriceException.findMany({
    where: { periodId },
    select: { studentId: true, overrideDiscountPercent: true },
  });
  const exceptionMap = new Map(
    existingExceptions.map((e) => [e.studentId, toNum(e.overrideDiscountPercent)]),
  );

  const codeMap = new Map(students.map((s) => [s.code.toUpperCase(), s]));
  const nameMap = new Map<string, typeof students[0]>();
  for (const s of students) {
    nameMap.set(s.fullName.toUpperCase(), s);
  }

  const rows: DiscountImportRow[] = [];
  const seenStudents = new Set<string>();
  let matched = 0;
  let notFound = 0;
  let invalid = 0;
  let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((c) => c.trim().replace(/"/g, ''));
    const code = codeIdx !== -1 ? cols[codeIdx]?.trim() || '' : '';
    const name = nameIdx !== -1 ? cols[nameIdx]?.trim() || '' : '';
    const discountStr = cols[discountIdx]?.trim().replace(',', '.') || '';
    const discount = parseFloat(discountStr);

    if (isNaN(discount) || discount < 0 || discount > 100) {
      invalid++;
      rows.push({
        rowNumber: i + 1,
        codigoAluno: code,
        nomeAluno: name,
        percentualDesconto: isNaN(discount) ? 0 : discount,
        matchedStudentId: null,
        matchedStudentName: null,
        matchedStudentGrade: null,
        currentDiscount: null,
        status: 'invalid',
        message: `Percentual inválido: "${discountStr}"`,
      });
      continue;
    }

    let student = code ? codeMap.get(code.toUpperCase()) : undefined;
    if (!student && name) {
      student = nameMap.get(name.toUpperCase());
    }

    if (!student) {
      notFound++;
      rows.push({
        rowNumber: i + 1,
        codigoAluno: code,
        nomeAluno: name,
        percentualDesconto: discount,
        matchedStudentId: null,
        matchedStudentName: null,
        matchedStudentGrade: null,
        currentDiscount: null,
        status: 'not_found',
        message: 'Aluno não encontrado entre os elegíveis.',
      });
      continue;
    }

    if (seenStudents.has(student.id)) {
      duplicates++;
      rows.push({
        rowNumber: i + 1,
        codigoAluno: code,
        nomeAluno: name,
        percentualDesconto: discount,
        matchedStudentId: student.id,
        matchedStudentName: student.fullName,
        matchedStudentGrade: student.grade,
        currentDiscount: exceptionMap.get(student.id) ?? null,
        status: 'duplicate',
        message: 'Aluno duplicado no CSV — será ignorado.',
      });
      continue;
    }

    seenStudents.add(student.id);
    matched++;
    rows.push({
      rowNumber: i + 1,
      codigoAluno: code || student.code,
      nomeAluno: name || student.fullName,
      percentualDesconto: discount,
      matchedStudentId: student.id,
      matchedStudentName: student.fullName,
      matchedStudentGrade: student.grade,
      currentDiscount: exceptionMap.get(student.id) ?? null,
      status: 'matched',
    });
  }

  return { totalRows: lines.length - 1, matched, notFound, invalid, duplicates, rows };
}

/**
 * Persist the previewed rows as approved FamilyPriceExceptions. Each row
 * is upserted independently — one bad student doesn't roll back the
 * batch. Refuses to apply if the period is FINALIZED so prices on
 * already-signed contracts can't change retroactively.
 */
export async function applyDiscountImport(
  periodId: string,
  rows: { studentId: string; discountPercent: number }[],
  userId: string,
): Promise<{ applied: number; errors: number }> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { id: true, status: true },
  });
  if (!period) throw createAppError('PERIOD_NOT_FOUND');
  if (period.status === 'FINALIZED') {
    throw createAppError('PERIOD_FINALIZED', 'Não é possível importar descontos em uma campanha finalizada.');
  }

  let applied = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      await prisma.familyPriceException.upsert({
        where: { periodId_studentId: { periodId, studentId: row.studentId } },
        update: {
          overrideDiscountPercent: row.discountPercent,
          justification: `Importado via CSV por usuário ${userId}`,
          approvalStatus: 'APPROVED',
          approvedById: userId,
          approvalDecidedAt: new Date(),
        },
        create: {
          periodId,
          studentId: row.studentId,
          overrideDiscountPercent: row.discountPercent,
          justification: `Importado via CSV por usuário ${userId}`,
          approvalStatus: 'APPROVED',
          approvedById: userId,
          approvalDecidedAt: new Date(),
          createdById: userId,
        },
      });
      applied++;
    } catch (err) {
      logger.warn('Failed to apply discount import row', {
        studentId: row.studentId,
        error: (err as Error).message,
      });
      errors++;
    }
  }

  return { applied, errors };
}

export async function generateDiscountTemplate(periodId: string): Promise<string> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { eligibleGrades: true },
  });
  if (!period) throw createAppError('PERIOD_NOT_FOUND');

  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE', grade: { in: period.eligibleGrades } },
    select: { id: true, code: true, fullName: true, grade: true },
    orderBy: [{ grade: 'asc' }, { fullName: 'asc' }],
  });

  const existingExceptions = await prisma.familyPriceException.findMany({
    where: { periodId },
    select: { studentId: true, overrideDiscountPercent: true },
  });
  const exMap = new Map(
    existingExceptions.map((e) => [e.studentId, toNum(e.overrideDiscountPercent)]),
  );

  const lines = ['codigo_aluno;nome_aluno;serie;percentual_desconto'];
  for (const s of students) {
    const currentDiscount = exMap.get(s.id) ?? '';
    lines.push(`${s.code};${s.fullName};${s.grade ?? ''};${currentDiscount}`);
  }

  return lines.join('\n');
}
