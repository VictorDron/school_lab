import type { FinancialResponsibleType, FinancialPersonType } from './enums';

// Financial responsible interfaces

export interface FinancialResponsibleAddress {
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

export interface FinancialResponsible {
  responsibleType: FinancialResponsibleType;
  relationship?: string;
  personType?: FinancialPersonType;
  // Pessoa Física fields
  fullName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  // Pessoa Jurídica fields
  companyName?: string;
  cnpj?: string;
  tradeName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Address (shared)
  address?: FinancialResponsibleAddress;
}
