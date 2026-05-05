import { prisma } from '../config/database.js';

export const DEFAULT_FEE_TABLE = [
  { faixa: 'Nursery ao Pre-K4', anuidade: 69600, entrada: 1400 },
  { faixa: 'Kinder', anuidade: 75600, entrada: 1400 },
  { faixa: '1º ao 2º ano', anuidade: 82800, entrada: 1400 },
  { faixa: '3º ao 5º ano', anuidade: 87600, entrada: 1400 },
  { faixa: '6º ano', anuidade: 93600, entrada: 1400 },
  { faixa: '7º ao 8º', anuidade: 100800, entrada: 1400 },
  { faixa: '9º ao 11º ano', anuidade: 106800, entrada: 1400 },
  { faixa: '12º ano', anuidade: 106800, entrada: 1400 },
] as const;

export const DEFAULT_DISCOUNT_OPTIONS = [
  0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

export const DEFAULT_FOOD_TABLE = [
  { faixa: 'Nursery ao Pre-K4', alimentacaoAnual: 8568, parcela12: 714 },
  { faixa: 'Kinder ao 5º ano', alimentacaoAnual: 9241.2, parcela12: 770.1 },
  { faixa: '6º ao 12º ano', alimentacaoAnual: 9914.4, parcela12: 826.2 },
] as const;

const DEFAULT_SETTINGS = {
  schoolName: 'School Lab',
  defaultLanguage: 'pt',
  dateFormat: 'DD/MM/YYYY',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
};

export interface UpdateSettingsData {
  schoolName?: string;
  legalName?: string | null;
  cnpj?: string | null;
  legalAddress?: string | null;
  legalCity?: string | null;
  defaultLanguage?: string;
  dateFormat?: string;
  currency?: string;
  timezone?: string;
}

export interface UpdateFeesData {
  feeTable?: unknown;
  foodTable?: unknown;
  discountOptions?: unknown;
}

// All settings reads/writes are now scoped to a single tenant. Each Tenant
// owns at most one SystemSettings row (1:1 in the schema), looked up via
// the unique tenantId. Phase 0: callers either pass req.tenantId once it
// exists, or fall back to getDefaultTenant().id during the transition.

export async function getOrCreateSettings(tenantId: string) {
  const existing = await prisma.systemSettings.findUnique({ where: { tenantId } });
  if (existing) return existing;

  return prisma.systemSettings.create({ data: { ...DEFAULT_SETTINGS, tenantId } });
}

export async function updateSettings(tenantId: string, data: UpdateSettingsData) {
  const existing = await prisma.systemSettings.findUnique({ where: { tenantId } });

  if (!existing) {
    return prisma.systemSettings.create({ data: { ...data, tenantId } });
  }

  return prisma.systemSettings.update({
    where: { id: existing.id },
    data,
  });
}

export async function updateLogoUrl(tenantId: string, logoUrl: string) {
  const existing = await prisma.systemSettings.findUnique({ where: { tenantId } });

  if (!existing) {
    return prisma.systemSettings.create({ data: { logoUrl, tenantId } });
  }

  return prisma.systemSettings.update({
    where: { id: existing.id },
    data: { logoUrl },
  });
}

export async function getFees(tenantId: string) {
  const settings = await prisma.systemSettings.findUnique({ where: { tenantId } });
  return {
    feeTable: settings?.feeTable ?? DEFAULT_FEE_TABLE,
    foodTable: settings?.foodTable ?? DEFAULT_FOOD_TABLE,
    discountOptions: settings?.discountOptions ?? DEFAULT_DISCOUNT_OPTIONS,
  };
}

export async function updateFees(tenantId: string, data: UpdateFeesData) {
  const existing = await prisma.systemSettings.findUnique({ where: { tenantId } });

  const settings = !existing
    ? await prisma.systemSettings.create({
        data: {
          tenantId,
          feeTable: (data.feeTable ?? DEFAULT_FEE_TABLE) as never,
          foodTable: (data.foodTable ?? DEFAULT_FOOD_TABLE) as never,
          discountOptions: (data.discountOptions ??
            DEFAULT_DISCOUNT_OPTIONS) as never,
        },
      })
    : await prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          ...(data.feeTable !== undefined && { feeTable: data.feeTable as never }),
          ...(data.foodTable !== undefined && {
            foodTable: data.foodTable as never,
          }),
          ...(data.discountOptions !== undefined && {
            discountOptions: data.discountOptions as never,
          }),
        },
      });

  return {
    id: settings.id,
    feeTable: settings.feeTable ?? DEFAULT_FEE_TABLE,
    foodTable: settings.foodTable ?? DEFAULT_FOOD_TABLE,
    discountOptions: settings.discountOptions ?? DEFAULT_DISCOUNT_OPTIONS,
  };
}
