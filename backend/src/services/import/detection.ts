import { prisma } from '../../config/database.js';
import { normalizeCPF } from '../../utils/formatters.js';
import type { DuplicateMatch, FamilyGroup, ParsedRow } from '../../types/import.types.js';
import { extractSurname, normalizeContactKey } from './helpers.js';

/**
 * Three-phase family detection: emergency-contact match (strongest
 * signal), then surname match, then single-student fallback. Earlier
 * phases consume their matches so a row only appears in one family —
 * downstream import logic assumes families are disjoint.
 */
export function detectFamilies(rows: ParsedRow[]): FamilyGroup[] {
  const families: FamilyGroup[] = [];
  let familyId = 1;

  // Phase 1: group by emergency contact #1 (name+phone)
  const contactGroups = new Map<string, ParsedRow[]>();
  const ungrouped: ParsedRow[] = [];

  for (const row of rows) {
    const contact1 = row.emergencyContacts[0];
    const key = contact1
      ? normalizeContactKey(contact1.name, contact1.phone)
      : null;

    if (key) {
      const group = contactGroups.get(key) ?? [];
      group.push(row);
      contactGroups.set(key, group);
    } else {
      ungrouped.push(row);
    }
  }

  for (const [, members] of contactGroups) {
    if (members.length > 1) {
      families.push({
        familyId: familyId++,
        familyName: extractSurname(members[0].studentName),
        members,
        detectionMethod: 'EMERGENCY_CONTACT',
      });
    } else {
      ungrouped.push(members[0]);
    }
  }

  // Phase 2: surname match for the leftovers
  const surnameGroups = new Map<string, ParsedRow[]>();
  const remaining: ParsedRow[] = [];

  for (const row of ungrouped) {
    const surname = extractSurname(row.studentName).toLowerCase();
    if (surname) {
      const group = surnameGroups.get(surname) ?? [];
      group.push(row);
      surnameGroups.set(surname, group);
    } else {
      remaining.push(row);
    }
  }

  for (const [surname, members] of surnameGroups) {
    if (members.length > 1) {
      families.push({
        familyId: familyId++,
        familyName: surname.charAt(0).toUpperCase() + surname.slice(1),
        members,
        detectionMethod: 'SURNAME',
      });
    } else {
      remaining.push(members[0]);
    }
  }

  // Phase 3: single-student families
  for (const row of remaining) {
    families.push({
      familyId: familyId++,
      familyName: extractSurname(row.studentName),
      members: [row],
      detectionMethod: 'SINGLE',
    });
  }

  return families;
}

/**
 * Detect rows that match an existing student. CPF takes priority (cell 69
 * holds the authorized person's CPF in the spreadsheet, used as a proxy);
 * falls back to case-insensitive name + grade. First match wins per row.
 */
export async function detectDuplicates(rows: ParsedRow[]): Promise<DuplicateMatch[]> {
  const duplicates: DuplicateMatch[] = [];

  const existingStudents = await prisma.student.findMany({
    select: {
      id: true,
      fullName: true,
      cpf: true,
      grade: true,
    },
  });

  for (const row of rows) {
    let matched = false;

    const normalizedName = row.studentName.toLowerCase().trim();
    const normalizedGrade = row.grade?.toLowerCase().trim() ?? '';

    for (const student of existingStudents) {
      const existingName = student.fullName.toLowerCase().trim();
      const existingGrade = (student.grade ?? '').toLowerCase().trim();

      if (student.cpf) {
        const rawCpf = normalizeCPF(row.raw['col_69'] ?? '');
        if (rawCpf && rawCpf === normalizeCPF(student.cpf)) {
          duplicates.push({
            rowNumber: row.rowNumber,
            studentName: row.studentName,
            matchType: 'CPF',
            existingStudentId: student.id,
            existingStudentName: student.fullName,
            existingGrade: student.grade,
            action: 'skip',
          });
          matched = true;
          break;
        }
      }

      if (!matched && existingName === normalizedName && existingGrade === normalizedGrade) {
        duplicates.push({
          rowNumber: row.rowNumber,
          studentName: row.studentName,
          matchType: 'NAME_GRADE',
          existingStudentId: student.id,
          existingStudentName: student.fullName,
          existingGrade: student.grade,
          action: 'skip',
        });
        matched = true;
        break;
      }
    }
  }

  return duplicates;
}
