// ---------------------------------------------------------------------------
// Marital status options (shared between father and mother forms)
// ---------------------------------------------------------------------------

export interface MaritalStatusOption {
  value: string;
  pt: string;
  en: string;
}

export const MARITAL_STATUS_OPTIONS: MaritalStatusOption[] = [
  { value: 'SOLTEIRO', pt: 'Solteiro(a)', en: 'Single' },
  { value: 'CASADO', pt: 'Casado(a)', en: 'Married' },
  { value: 'DIVORCIADO', pt: 'Divorciado(a)', en: 'Divorced' },
  { value: 'VIUVO', pt: 'Viúvo(a)', en: 'Widowed' },
  { value: 'SEPARADO', pt: 'Separado(a)', en: 'Separated' },
  { value: 'UNIAO_ESTAVEL', pt: 'União Estável', en: 'Domestic Partnership' },
];
