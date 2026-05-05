import type { ParsedRow } from '../../types/import.types.js';
import { parseCSVBoolean } from './parsers.js';

/**
 * Builds family vehicle JSON from parsed row columns.
 */
function buildFamilyVehicles(raw: Record<string, string>): unknown[] {
  const col = (index: number): string => raw[`col_${index}`] ?? '';
  const vehicles: unknown[] = [];

  if (col(39) || col(40) || col(41)) {
    vehicles.push({ model: col(39), colour: col(40), plate: col(41) });
  }
  if (col(43) || col(44) || col(45)) {
    vehicles.push({ model: col(43), colour: col(44), plate: col(45) });
  }
  if (col(47) || col(48) || col(49)) {
    vehicles.push({ model: col(47), colour: col(48), plate: col(49) });
  }

  return vehicles;
}

/**
 * Builds authorized persons JSON from parsed row columns.
 */
function buildAuthorizedPersons(raw: Record<string, string>): unknown[] {
  const col = (index: number): string => raw[`col_${index}`] ?? '';
  const persons: unknown[] = [];

  if (col(67)) {
    persons.push({
      name: col(67),
      document: col(68),
      cpf: col(69),
      email: col(70),
      relationship: col(71),
      vehicle: col(73) || col(74) || col(75)
        ? { model: col(73), colour: col(74), plate: col(75) }
        : null,
    });
  }
  if (col(77)) {
    persons.push({
      name: col(77),
      document: col(78),
      cpf: col(79),
      email: col(80),
      relationship: col(81),
      vehicle: col(83) || col(84) || col(85)
        ? { model: col(83), colour: col(84), plate: col(85) }
        : null,
    });
  }
  if (col(87)) {
    persons.push({
      name: col(87),
      document: col(88),
      cpf: col(89),
      email: col(90),
      relationship: col(91),
      vehicle: col(93) || col(94) || col(95)
        ? { model: col(93), colour: col(94), plate: col(95) }
        : null,
    });
  }

  return persons;
}

/**
 * Builds athlete schedule JSON from parsed row columns.
 */
function buildAthleteSchedule(raw: Record<string, string>): Record<string, string> | null {
  const col = (index: number): string => raw[`col_${index}`] ?? '';
  const mon = col(53);
  const tue = col(54);
  const wed = col(55);
  const thu = col(56);
  const fri = col(57);

  if (!mon && !tue && !wed && !thu && !fri) return null;

  return { mon, tue, wed, thu, fri };
}

/**
 * Maps a ParsedRow to LeadChildTransport create data (Prisma-compatible).
 */
export function buildTransportData(row: ParsedRow): Record<string, unknown> {
  const raw = row.raw;
  const col = (index: number): string => raw[`col_${index}`] ?? '';

  return {
    dropoffPickupPersons: col(33) ? [col(33)] : [],
    dropoffPickupOther: col(34) || null,
    transportMethod: col(35) || '',
    transportMethodOther: col(36) || null,
    familyVehicles: buildFamilyVehicles(raw),
    canLeaveAlone: parseCSVBoolean(col(50)),
    isAthlete: parseCSVBoolean(col(51)),
    athleteSchedule: buildAthleteSchedule(raw),
    schoolBusCompany: col(59) || null,
    schoolBusContactName: col(60) || null,
    schoolBusContactPhone: col(61) || null,
    schoolBusContactEmail: col(62) || null,
    hasLegalRestrictions: parseCSVBoolean(col(63)),
    allowThirdPartyPickup: parseCSVBoolean(col(64)),
    authorizedPersons: buildAuthorizedPersons(raw),
  };
}
