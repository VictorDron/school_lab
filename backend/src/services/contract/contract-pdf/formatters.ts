// ---------------------------------------------------------------------------
// Display formatters for the contract PDF and HTML renderers. All output is
// pt-BR, with explicit "Não informado" fallbacks so empty optional fields
// never leave blank gaps in the rendered contract.
// ---------------------------------------------------------------------------

interface AddressShape {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

export function formatAddress(parent: AddressShape): string {
  const parts: string[] = [];
  if (parent.street) {
    let addr = parent.street;
    if (parent.number) addr += `, ${parent.number}`;
    if (parent.complement) addr += ` - ${parent.complement}`;
    parts.push(addr);
  }
  if (parent.neighborhood) parts.push(parent.neighborhood);
  if (parent.city) {
    let cityState = parent.city;
    if (parent.state) cityState += ` - ${parent.state}`;
    parts.push(cityState);
  }
  if (parent.zipCode) parts.push(`CEP ${parent.zipCode}`);
  if (parent.country && parent.country !== 'Brasil' && parent.country !== 'BR') {
    parts.push(parent.country);
  }
  return parts.join(', ') || 'Não informado';
}

export function formatLeadAddress(addr: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  country: string;
} | null): string {
  if (!addr) return 'Não informado';
  return formatAddress(addr);
}

export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return 'Não informado';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

const MARITAL_STATUS_MAP: Record<string, string> = {
  SOLTEIRO: 'Solteiro(a)',
  CASADO: 'Casado(a)',
  DIVORCIADO: 'Divorciado(a)',
  VIUVO: 'Viúvo(a)',
  SEPARADO: 'Separado(a)',
  UNIAO_ESTAVEL: 'União Estável',
};

export function formatMaritalStatus(status: string | null | undefined): string {
  return MARITAL_STATUS_MAP[status ?? ''] ?? (status || null) ?? 'Não informado';
}

const NATIONALITY_MAP: Record<string, string> = {
  BRASILEIRA: 'Brasileira',
  AMERICANA: 'Americana',
  PORTUGUESA: 'Portuguesa',
  ARGENTINA: 'Argentina',
  COLOMBIANA: 'Colombiana',
  OUTRA: 'Outra',
};

export function formatNationality(nationality: string | null | undefined): string {
  return NATIONALITY_MAP[nationality ?? ''] ?? (nationality || null) ?? 'Não informado';
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Grade-level bucketing — collapses the many possible desiredGrade strings
// (Nursery, Pre-K, 1st, 2nd, ano, série…) into the buckets that match the
// fee-table rows used in the contract.
// ---------------------------------------------------------------------------

export function determineGradeLevel(desiredGrade: string | null | undefined): string {
  if (!desiredGrade) return '';
  const grade = desiredGrade.toLowerCase();
  if (grade.includes('nursery') || grade.includes('pre-k') || grade.includes('prek'))
    return 'Nursery ao Pre-K4';
  if (grade.includes('kinder')) return 'Kinder';
  if (grade.includes('1') && (grade.includes('st') || grade.includes('ano') || grade.includes('serie')))
    return '1o ao 2o ano';
  if (grade.includes('2') && (grade.includes('nd') || grade.includes('ano') || grade.includes('serie')))
    return '1o ao 2o ano';
  if (
    (grade.includes('3') || grade.includes('4') || grade.includes('5')) &&
    (grade.includes('rd') || grade.includes('th') || grade.includes('ano') || grade.includes('serie'))
  )
    return '3o ao 5o ano';
  if (grade.includes('6') && (grade.includes('th') || grade.includes('ano') || grade.includes('serie')))
    return '6o ano';
  if (
    (grade.includes('7') || grade.includes('8')) &&
    (grade.includes('th') || grade.includes('ano') || grade.includes('serie'))
  )
    return '7o ao 8o';
  if (
    (grade.includes('9') || grade.includes('10') || grade.includes('11')) &&
    (grade.includes('th') || grade.includes('ano') || grade.includes('serie'))
  )
    return '9o ao 11o ano';
  if (grade.includes('12') && (grade.includes('th') || grade.includes('ano') || grade.includes('serie')))
    return '12o ano';
  return '';
}

// ---------------------------------------------------------------------------
// School year window — runs June through June. June onwards rolls into the
// next year's window; January through May still belong to the prior cycle.
// ---------------------------------------------------------------------------

export function currentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  if (now.getMonth() >= 5) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}
