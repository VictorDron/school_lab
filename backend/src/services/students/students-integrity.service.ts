import { prisma } from '../../config/database.js';
import { withTenantTx } from '../../lib/tenant-context.js';
import { VALID_GRADES } from '../grade-progression.js';

export interface IntegrityIssue {
  type:
    | 'NAME_MISMATCH'
    | 'DOB_MISMATCH'
    | 'CPF_MISMATCH'
    | 'GENDER_MISMATCH'
    | 'NATIONALITY_MISMATCH'
    | 'INVALID_GRADE'
    | 'ORPHAN_STUDENT'
    | 'MISSING_LEAD'
    | 'MISSING_CHILD'
    | 'DUPLICATE_STUDENT';
  studentId: string;
  studentCode: string;
  studentName: string;
  details: Record<string, unknown>;
}

/**
 * Audit data integrity across Student, LeadChild, and Lead models.
 * Returns a list of all found issues without modifying any data.
 */
export async function auditIntegrity(): Promise<{
  issues: IntegrityIssue[];
  summary: Record<string, number>;
  totalStudents: number;
}> {
  const issues: IntegrityIssue[] = [];

  const students = await prisma.student.findMany({
    select: {
      id: true,
      code: true,
      fullName: true,
      dateOfBirth: true,
      cpf: true,
      gender: true,
      nationality: true,
      grade: true,
      academicYear: true,
      leadId: true,
      leadChildId: true,
    },
  });

  const childIds = [...new Set(students.map((s) => s.leadChildId))];
  const leadIds = [...new Set(students.map((s) => s.leadId))];

  const children = await prisma.leadChild.findMany({
    where: { id: { in: childIds } },
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      cpf: true,
      gender: true,
      nationality: true,
    },
  });
  const childMap = new Map(children.map((c) => [c.id, c]));

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true },
  });
  const leadSet = new Set(leads.map((l) => l.id));

  const compositeKeys = new Map<string, typeof students>();
  for (const s of students) {
    const key = `${s.leadChildId}:${s.academicYear}`;
    if (!compositeKeys.has(key)) {
      compositeKeys.set(key, []);
    }
    compositeKeys.get(key)!.push(s);
  }

  for (const s of students) {
    const child = childMap.get(s.leadChildId);

    if (!leadSet.has(s.leadId)) {
      issues.push({
        type: 'MISSING_LEAD',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { leadId: s.leadId },
      });
    }

    if (!child) {
      issues.push({
        type: 'MISSING_CHILD',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { leadChildId: s.leadChildId },
      });
      continue;
    }

    if (s.fullName !== child.fullName) {
      issues.push({
        type: 'NAME_MISMATCH',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { studentValue: s.fullName, childValue: child.fullName },
      });
    }

    if (s.dateOfBirth?.toISOString() !== child.dateOfBirth?.toISOString()) {
      issues.push({
        type: 'DOB_MISMATCH',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: {
          studentValue: s.dateOfBirth,
          childValue: child.dateOfBirth,
        },
      });
    }

    if ((s.cpf ?? null) !== (child.cpf ?? null)) {
      issues.push({
        type: 'CPF_MISMATCH',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { studentValue: s.cpf, childValue: child.cpf },
      });
    }

    if ((s.gender ?? null) !== (child.gender ?? null)) {
      issues.push({
        type: 'GENDER_MISMATCH',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { studentValue: s.gender, childValue: child.gender },
      });
    }

    if ((s.nationality ?? null) !== (child.nationality ?? null)) {
      issues.push({
        type: 'NATIONALITY_MISMATCH',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { studentValue: s.nationality, childValue: child.nationality },
      });
    }

    if (s.grade !== null && !VALID_GRADES.has(s.grade)) {
      issues.push({
        type: 'INVALID_GRADE',
        studentId: s.id,
        studentCode: s.code,
        studentName: s.fullName,
        details: { invalidGrade: s.grade, validGrades: [...VALID_GRADES] },
      });
    }
  }

  for (const [key, group] of compositeKeys) {
    if (group.length > 1) {
      for (const s of group) {
        issues.push({
          type: 'DUPLICATE_STUDENT',
          studentId: s.id,
          studentCode: s.code,
          studentName: s.fullName,
          details: {
            compositeKey: key,
            duplicateCount: group.length,
            duplicateIds: group.map((g) => g.id),
          },
        });
      }
    }
  }

  const summary: Record<string, number> = {};
  for (const issue of issues) {
    summary[issue.type] = (summary[issue.type] ?? 0) + 1;
  }

  return { issues, summary, totalStudents: students.length };
}

/**
 * Repair data integrity issues by syncing LeadChild data → Student.
 * Only fixes field mismatches (name, dob, cpf, gender, nationality) and invalid grades.
 * Returns count of repaired records.
 */
export async function repairIntegrity(actorId: string): Promise<{
  repaired: number;
  details: Array<{ studentId: string; code: string; fixes: string[] }>;
}> {
  const { issues } = await auditIntegrity();

  const repairableTypes = new Set([
    'NAME_MISMATCH',
    'DOB_MISMATCH',
    'CPF_MISMATCH',
    'GENDER_MISMATCH',
    'NATIONALITY_MISMATCH',
    'INVALID_GRADE',
  ]);
  const repairable = issues.filter((i) => repairableTypes.has(i.type));

  const byStudent = new Map<string, IntegrityIssue[]>();
  for (const issue of repairable) {
    if (!byStudent.has(issue.studentId)) {
      byStudent.set(issue.studentId, []);
    }
    byStudent.get(issue.studentId)!.push(issue);
  }

  const details: Array<{ studentId: string; code: string; fixes: string[] }> = [];

  for (const [studentId, studentIssues] of byStudent) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, code: true, leadChildId: true },
    });
    if (!student) continue;

    const child = await prisma.leadChild.findUnique({
      where: { id: student.leadChildId },
    });

    const updateData: Record<string, unknown> = {};
    const fixes: string[] = [];

    for (const issue of studentIssues) {
      switch (issue.type) {
        case 'NAME_MISMATCH':
          if (child) {
            updateData.fullName = child.fullName;
            fixes.push(
              `fullName: "${issue.details.studentValue}" → "${child.fullName}"`,
            );
          }
          break;
        case 'DOB_MISMATCH':
          if (child) {
            updateData.dateOfBirth = child.dateOfBirth;
            fixes.push('dateOfBirth synced from LeadChild');
          }
          break;
        case 'CPF_MISMATCH':
          if (child) {
            updateData.cpf = child.cpf;
            fixes.push(`cpf: "${issue.details.studentValue}" → "${child.cpf}"`);
          }
          break;
        case 'GENDER_MISMATCH':
          if (child) {
            updateData.gender = child.gender;
            fixes.push(
              `gender: "${issue.details.studentValue}" → "${child.gender}"`,
            );
          }
          break;
        case 'NATIONALITY_MISMATCH':
          if (child) {
            updateData.nationality = child.nationality;
            fixes.push(
              `nationality: "${issue.details.studentValue}" → "${child.nationality}"`,
            );
          }
          break;
        case 'INVALID_GRADE':
          updateData.grade = null;
          fixes.push(`grade: "${issue.details.invalidGrade}" → null (inválida)`);
          break;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await withTenantTx(prisma, async (tx) => {
        await tx.student.update({ where: { id: studentId }, data: updateData });
        await tx.studentHistory.create({
          data: {
            studentId,
            action: 'INTEGRITY_REPAIR',
            details: { fixes, repairedFields: Object.keys(updateData) },
            actorId,
          },
        });
      });
      details.push({ studentId, code: student.code, fixes });
    }
  }

  return { repaired: details.length, details };
}
