import { AddendumType, ContractSignerRole } from '@prisma/client';

export interface CreateAddendumData {
  contractId: string;
  type: AddendumType;
  description: string;
  changedValues?: Array<{ field: string; oldValue: string; newValue: string }>;
  signers: Array<{ role: ContractSignerRole; name: string; email: string; cpf?: string; phone?: string }>;
}
