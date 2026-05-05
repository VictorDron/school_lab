export interface ParentEmailState {
  parentId: string;
  parentType: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface AuthorizedPerson {
  name: string;
  bond: string;
  dateOfBirth: string;
  cpf: string;
  email: string;
  vehicle: { model: string; color: string; plate: string };
}

export interface FamilyVehicle {
  model: string;
  color: string;
  plate: string;
}

export interface AdditionalResponsible {
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
}

export const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
export const selectClass = `${inputClass} bg-white`;
export const checkboxClass =
  'h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500';
export const checkboxCardClass =
  'flex items-center gap-2 p-2 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors';
export const checkboxCardActiveClass = 'bg-primary-50 border-primary-300';
