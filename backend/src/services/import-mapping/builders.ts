import type { ParsedRow } from '../../types/import.types.js';
import { parseCSVBoolean, parseCSVList } from './parsers.js';

/**
 * Maps a ParsedRow to LeadChildHealth create data (Prisma-compatible).
 */
export function buildHealthData(row: ParsedRow): Record<string, unknown> {
  const raw = row.raw;
  const col = (index: number): string => raw[`col_${index}`] ?? '';

  return {
    weight: col(4) || null,
    height: col(5) || null,
    bloodType: col(6) || null,
    medicalConditionsNotes: col(7) || null,
    hasHospitalizations: parseCSVBoolean(col(8)),
    hospitalizationsNotes: col(9) || null,
    hasSeizures: parseCSVBoolean(col(10)),
    seizuresNotes: col(11) || null,
    allergies: parseCSVList(col(12)),
    allergiesNotes: col(13) || null,
    feverMedications: parseCSVList(col(14)),
    feverMedicationOther: col(15) || null,
    painMedications: parseCSVList(col(16)),
    painMedicationOther: col(17) || null,
    medicationRestrictions: col(18) || null,
    regularMedications: col(19) || null,
    hasEatingDisorder: parseCSVBoolean(col(30)),
    eatingDisorderNotes: col(31) || null,
    additionalHealthInfo: col(32) || null,
  };
}

/**
 * Maps a ParsedRow to LeadEmergencyContact create data array.
 * Returns 0-2 contacts depending on CSV data.
 */
export function buildEmergencyContacts(
  row: ParsedRow,
): Array<{ name: string; phone: string; email: string; isPrimary: boolean }> {
  const raw = row.raw;
  const col = (index: number): string => raw[`col_${index}`] ?? '';
  const contacts: Array<{ name: string; phone: string; email: string; isPrimary: boolean }> = [];

  if (col(20)) {
    contacts.push({
      name: col(20),
      phone: col(21) || '',
      email: col(22) || '',
      isPrimary: true,
    });
  }

  if (col(23)) {
    contacts.push({
      name: col(23),
      phone: col(24) || '',
      email: col(25) || '',
      isPrimary: false,
    });
  }

  return contacts;
}

/**
 * Maps a ParsedRow to LeadHealthPlan create data (Prisma-compatible).
 */
export function buildHealthPlanData(row: ParsedRow): Record<string, unknown> | null {
  const raw = row.raw;
  const col = (index: number): string => raw[`col_${index}`] ?? '';

  const operator = col(26);
  if (!operator) return null;

  return {
    operator,
    beneficiaryCode: col(27) || '',
    planType: col(28) || '',
    preferredHospital: col(29) || '',
  };
}

/**
 * Maps a ParsedRow to LeadEnrollmentInfo create data (Prisma-compatible).
 */
export function buildEnrollmentInfoData(row: ParsedRow): Record<string, unknown> {
  return {
    course: row.course || null,
    module: row.module || null,
    classGroup: row.classGroup || null,
  };
}
