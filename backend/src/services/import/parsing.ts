import * as iconv from 'iconv-lite';
import * as XLSX from 'xlsx';
import {
  GRADE_MAP,
  buildEmergencyContacts,
  buildEnrollmentInfoData,
  buildHealthData,
  buildHealthPlanData,
  buildTransportData,
} from '../import-mapping.js';
import type { ParsedRow, RowError } from '../../types/import.types.js';

/**
 * Decode a CSV upload to UTF-8. Excel-on-Windows still saves CSVs as
 * latin1 unless the user picks "CSV UTF-8", so we sniff for the BOM and
 * fall back to iconv. Without this, accented Portuguese names round-trip
 * as mojibake.
 */
export function decodeCSVBuffer(buffer: Buffer): string {
  // UTF-8 BOM (0xEF 0xBB 0xBF)
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.toString('utf-8');
  }
  return iconv.decode(buffer, 'latin1');
}

/**
 * Parse an .xlsx or .csv into a header row and 2D string matrix. CSVs are
 * forced through the latin1-aware decoder and use ';' as the field
 * separator (the Brazilian Excel default).
 */
export function parseImportFile(
  buffer: Buffer,
  fileName: string,
): { headers: string[]; rows: string[][]; totalRows: number } {
  let workbook: XLSX.WorkBook;

  if (fileName.toLowerCase().endsWith('.csv')) {
    const text = decodeCSVBuffer(buffer);
    workbook = XLSX.read(text, { type: 'string', FS: ';' });
  } else {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
  });

  if (data.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = data[0].map((h: unknown) => String(h ?? ''));
  const rows = data.slice(1).map((row) => row.map((cell: unknown) => String(cell ?? '')));

  return { headers, rows, totalRows: rows.length };
}

/**
 * Walk each row, validate required fields, and run the column-mapping
 * builders to materialize health / transport / emergency / health-plan /
 * enrollment-info structs. Errors collect missing-required fields per
 * row; the caller decides whether to continue importing the valid rows.
 */
export function validateRows(
  rows: string[][],
  _headers: string[],
): { parsedRows: ParsedRow[]; errors: RowError[] } {
  const parsedRows: ParsedRow[] = [];
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // 1-indexed + header row

    const raw: Record<string, string> = {};
    for (let j = 0; j < row.length; j++) {
      raw[`col_${j}`] = row[j] ?? '';
    }

    const studentName = (row[3] ?? '').trim();
    const course = (row[0] ?? '').trim();
    const module = (row[1] ?? '').trim();
    const classGroup = (row[2] ?? '').trim();

    if (!studentName) {
      errors.push({
        row: rowNumber,
        field: 'studentName',
        message: 'Nome do aluno é obrigatório.',
        severity: 'error',
      });
    }

    const grade = GRADE_MAP[module] ?? module;

    const parsedRow: ParsedRow = {
      rowNumber,
      studentName,
      course,
      module,
      classGroup,
      grade,
      raw,
      health: {},
      transport: {},
      emergencyContacts: [],
      healthPlan: {},
      enrollmentInfo: {},
    };

    parsedRow.health = buildHealthData(parsedRow);
    parsedRow.transport = buildTransportData(parsedRow);
    parsedRow.emergencyContacts = buildEmergencyContacts(parsedRow);
    const hp = buildHealthPlanData(parsedRow);
    parsedRow.healthPlan = hp ?? {};
    parsedRow.enrollmentInfo = buildEnrollmentInfoData(parsedRow);

    parsedRows.push(parsedRow);
  }

  return { parsedRows, errors };
}
