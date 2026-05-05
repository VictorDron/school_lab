import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { VALID_GRADES } from '../grade-progression.js';
import {
  buildWhereClause,
  buildOrderBy,
  type StudentFilters,
} from './students-core.service.js';

export async function getStudentDashboardStats(filters?: { academicYear?: number }) {
  const where: Prisma.StudentWhereInput = {};

  if (filters?.academicYear) {
    where.academicYear = filters.academicYear;
  }

  const [total, byStatus, byGrade, byAcademicYear] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    }),
    prisma.student.groupBy({
      by: ['grade'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.student.groupBy({
      by: ['academicYear'],
      where: {},
      _count: { id: true },
      orderBy: { academicYear: 'desc' },
    }),
  ]);

  const byGradeFiltered = byGrade.filter(
    (g) => g.grade !== null && VALID_GRADES.has(g.grade),
  );

  return { total, byStatus, byGrade: byGradeFiltered, byAcademicYear };
}

export async function getEvolutionStats(academicYear?: number): Promise<{
  monthly: Array<{ month: string; count: number }>;
  yearOverYear: Array<{ year: number; total: number }>;
  evasionRate: number;
}> {
  const year = academicYear ?? new Date().getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const studentsInYear = await prisma.student.findMany({
    where: {
      academicYear: year,
      enrolledAt: { gte: startOfYear, lte: endOfYear },
    },
    select: { enrolledAt: true },
  });

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const monthCounts = new Array(12).fill(0);
  for (const s of studentsInYear) {
    const month = new Date(s.enrolledAt).getMonth();
    monthCounts[month]++;
  }

  const monthly = monthNames.map((name, idx) => ({
    month: name,
    count: monthCounts[idx],
  }));

  const yearOverYearData = await prisma.student.groupBy({
    by: ['academicYear'],
    where: { academicYear: { gte: year - 2, lte: year } },
    _count: { id: true },
    orderBy: { academicYear: 'asc' },
  });

  const yearOverYear = yearOverYearData.map((y) => ({
    year: y.academicYear,
    total: y._count.id,
  }));

  const [evasionCount, totalCount] = await Promise.all([
    prisma.student.count({
      where: {
        academicYear: year,
        status: { in: ['INACTIVE', 'CANCELLED', 'TRANSFERRED'] },
      },
    }),
    prisma.student.count({ where: { academicYear: year } }),
  ]);

  const evasionRate =
    totalCount > 0
      ? parseFloat(((evasionCount / totalCount) * 100).toFixed(2))
      : 0;

  return { monthly, yearOverYear, evasionRate };
}

/**
 * Export students to CSV string with UTF-8 BOM for Excel compatibility.
 * Uses the same filter logic as findMany (without pagination).
 * Column headers in pt-BR.
 */
export async function exportCsv(filters: StudentFilters): Promise<string> {
  const where = buildWhereClause(filters);

  const students = await prisma.student.findMany({
    where,
    orderBy: buildOrderBy(filters),
    select: {
      code: true,
      fullName: true,
      cpf: true,
      grade: true,
      academicYear: true,
      status: true,
      enrolledAt: true,
      dateOfBirth: true,
      gender: true,
      nationality: true,
    },
  });

  const headers = [
    'Código',
    'Nome Completo',
    'CPF',
    'Turma',
    'Ano Letivo',
    'Status',
    'Matriculado em',
    'Data Nascimento',
    'Gênero',
    'Nacionalidade',
  ];

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    TRANSFERRED: 'Transferido',
    GRADUATED: 'Graduado',
    CANCELLED: 'Cancelado',
  };

  function escapeField(value: string | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }

  const rows = students.map((s) =>
    [
      escapeField(s.code),
      escapeField(s.fullName),
      escapeField(s.cpf),
      escapeField(s.grade),
      String(s.academicYear),
      escapeField(statusLabels[s.status] ?? s.status),
      formatDate(s.enrolledAt),
      formatDate(s.dateOfBirth),
      escapeField(s.gender),
      escapeField(s.nationality),
    ].join(','),
  );

  const BOM = '﻿';
  return BOM + headers.join(',') + '\n' + rows.join('\n');
}
