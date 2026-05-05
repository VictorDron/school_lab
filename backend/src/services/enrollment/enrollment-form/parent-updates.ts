import type { Prisma, LeadParent } from '@prisma/client';
import type {
  ParentUpdatesData,
  PublicEnrollmentData,
} from '../../../types/enrollment.types.js';
import { normalizeCPF } from '../../../utils/formatters.js';

type Tx = Prisma.TransactionClient;

/**
 * Family forms let either parent tick "same address as the other parent".
 * The mirror has to happen against the addresses as the user posted them, not
 * against an already-mirrored copy — otherwise both parents end up with the
 * same empty address when both ticked the box. Snapshot first, mirror second.
 */
function applyMirroredAddresses(data: PublicEnrollmentData): void {
  const originalFatherAddress = data.fatherUpdates?.address ? { ...data.fatherUpdates.address } : null;
  const originalMotherAddress = data.motherUpdates?.address ? { ...data.motherUpdates.address } : null;

  if (data.fatherUpdates?.sameAddressAsOtherParent && originalMotherAddress) {
    data.fatherUpdates.address = { ...originalMotherAddress };
  }
  if (data.motherUpdates?.sameAddressAsOtherParent && originalFatherAddress) {
    data.motherUpdates.address = { ...originalFatherAddress };
  }
}

/**
 * Build the Prisma payload for one parent update. Required fields fall back
 * with `||` (never clear email/phone), optional fields use `!== undefined` so
 * the family can deliberately wipe a value, addresses use `??` to ignore null
 * but keep stored values when the form omits a field.
 */
function buildParentUpdatePayload(
  parent: LeadParent,
  updates: ParentUpdatesData,
): Prisma.LeadParentUpdateInput {
  return {
    email: updates.email || parent.email,
    phone: updates.phone || parent.phone,
    cpf: updates.cpf !== undefined ? normalizeCPF(updates.cpf) : parent.cpf,
    idNumber: updates.idNumber !== undefined ? updates.idNumber : parent.idNumber,
    idIssueDate: updates.idIssueDate !== undefined ? updates.idIssueDate : parent.idIssueDate,
    idIssuer: updates.idIssuer !== undefined ? updates.idIssuer : parent.idIssuer,
    occupation: updates.occupation !== undefined ? updates.occupation : parent.occupation,
    dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : parent.dateOfBirth,
    education: updates.education !== undefined ? updates.education : parent.education,
    religion: updates.religion !== undefined ? updates.religion : parent.religion,
    nationality: updates.nationality !== undefined ? updates.nationality : parent.nationality,
    maritalStatus: updates.maritalStatus !== undefined ? updates.maritalStatus : parent.maritalStatus,
    zipCode: updates.address?.zipCode ?? parent.zipCode,
    country: updates.address?.country ?? parent.country,
    state: updates.address?.state ?? parent.state,
    city: updates.address?.city ?? parent.city,
    neighborhood: updates.address?.neighborhood ?? parent.neighborhood,
    street: updates.address?.street ?? parent.street,
    number: updates.address?.number ?? parent.number,
    complement: updates.address?.complement ?? parent.complement,
    sameAddressAsOtherParent: updates.sameAddressAsOtherParent ?? false,
  };
}

/**
 * Apply the editable parent fields posted by the public enrollment form.
 * Mutates `data` to mirror addresses across the two parents when requested,
 * then issues the leadParent.update calls inside the open transaction.
 * Each parent update is independent — only the ones with corresponding
 * updates payload + matching parent record run.
 */
export async function applyParentUpdates(
  tx: Tx,
  parents: { father: LeadParent | undefined; mother: LeadParent | undefined },
  data: PublicEnrollmentData,
): Promise<void> {
  applyMirroredAddresses(data);

  if (data.fatherUpdates && parents.father) {
    await tx.leadParent.update({
      where: { id: parents.father.id },
      data: buildParentUpdatePayload(parents.father, data.fatherUpdates),
    });
  }

  if (data.motherUpdates && parents.mother) {
    await tx.leadParent.update({
      where: { id: parents.mother.id },
      data: buildParentUpdatePayload(parents.mother, data.motherUpdates),
    });
  }
}
