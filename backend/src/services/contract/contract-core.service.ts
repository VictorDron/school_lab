import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import {
  ContractSignerRole,
  Prisma,
} from '@prisma/client';
import * as AdmissionGateService from '../admission-gate.service.js';
import { getSignedUrl, extractStoragePath } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import { createAppError } from '../../lib/error-messages.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';
import { CreateContractData, PrerequisiteItem } from '../../types/contract.types.js';
import { getNextGrade } from '../grade-progression.js';

// Limit concurrent Supabase signed-URL refresh calls to avoid connection exhaustion (D-08)
export const BATCH_SIZE = 5;

// ==================== HELPERS ====================

export function generateContractCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CTR-${yyyy}${mm}${dd}-${hex}`;
}

export const contractInclude = {
  signers: true,
  payments: true,
  lead: {
    select: { id: true, familyName: true, admissionGateStatus: true },
  },
  legalApprovedBy: {
    select: { id: true, displayName: true },
  },
  financialApprovedBy: {
    select: { id: true, displayName: true },
  },
};

// ==================== URL FRESHENING ====================

/**
 * Generates fresh signed URLs for a contract's document fields.
 * Supabase signed URLs expire after 7 days — this ensures the caller always
 * receives a URL valid for the next hour, regardless of when the document was created.
 */
export async function freshenContractUrls(contract: {
  documentUrl: string | null;
  signedDocumentUrl: string | null;
}): Promise<{ documentUrl: string | null; signedDocumentUrl: string | null }> {
  let freshDocUrl: string | null = null;
  let freshSignedUrl: string | null = null;

  if (contract.documentUrl) {
    const storagePath = extractStoragePath(contract.documentUrl);
    if (storagePath) {
      freshDocUrl = await getSignedUrl(storagePath, 3600); // 1 hour
    }
    // Legacy base64 or non-Supabase URL: return as-is
    if (!freshDocUrl && contract.documentUrl && !contract.documentUrl.startsWith('http')) {
      freshDocUrl = contract.documentUrl;
    }
  }

  if (contract.signedDocumentUrl) {
    const storagePath = extractStoragePath(contract.signedDocumentUrl);
    if (storagePath) {
      freshSignedUrl = await getSignedUrl(storagePath, 3600);
    }
  }

  return { documentUrl: freshDocUrl, signedDocumentUrl: freshSignedUrl };
}

// ==================== SERVICE FUNCTIONS ====================

/**
 * Creates a new contract with signers and payment schedule.
 */
export async function createContract(
  leadId: string,
  data: CreateContractData,
  userId: string,
) {
  const code = generateContractCode();

  // Calculate payment amounts
  const annualValue = data.totalAnnualValue;
  const discountPercent = data.discountPercent ?? 0;
  const discountedValue = annualValue * (1 - discountPercent / 100);
  const installmentAmount =
    data.installments > 0
      ? Math.round((discountedValue / data.installments) * 100) / 100
      : 0;

  // Build payment schedule
  const payments: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
  }> = [];

  const startDate = data.paymentStartDate
    ? new Date(data.paymentStartDate)
    : new Date();

  for (let i = 0; i < data.installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    payments.push({
      installmentNumber: i + 1,
      dueDate,
      amount: installmentAmount,
    });
  }

  // Use transaction to prevent race condition on duplicate check + create
  let contract;
  try {
    contract = await prisma.$transaction(async (tx) => {
    // Check for existing active contract inside transaction
    const existingContract = await tx.contract.findFirst({
      where: {
        leadId,
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (existingContract) {
      throw createAppError('CONTRACT_ALREADY_EXISTS');
    }

    const created = await tx.contract.create({
      data: {
        leadId,
        code,
        status: 'PENDING_LEGAL',
        templateVersion: data.templateVersion ?? null,
        totalAnnualValue: data.totalAnnualValue,
        installments: data.installments,
        discountPercent: data.discountPercent ?? null,
        enrollmentFee: data.enrollmentFee ?? null,
        signers: {
          create: data.signers.map((s) => ({
            role: s.role,
            name: s.name,
            email: s.email,
            cpf: s.cpf ?? null,
            phone: s.phone ?? null,
          })),
        },
        payments: {
          create: payments.map((p) => ({
            installmentNumber: p.installmentNumber,
            dueDate: p.dueDate,
            amount: p.amount,
          })),
        },
      },
      include: contractInclude,
    });

    // Record history inside transaction
    await tx.leadHistory.create({
      data: {
        leadId,
        action: 'CONTRACT_CREATED',
        actorId: userId,
        details: { contractId: created.id, code },
      },
    });

    return created;
  });
  } catch (err) {
    // Partial unique index violation = race condition caught at DB level
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw createAppError('CONTRACT_ALREADY_EXISTS');
    }
    throw err;
  }

  // Auto-advance gate to CONTRACT_PENDING when contract is created
  try {
    await AdmissionGateService.transition(leadId, 'CONTRACT_PENDING', userId, undefined, true);
  } catch (err) {
    logger.warn('Gate transition to CONTRACT_PENDING failed on contract creation', { leadId, error: (err as Error).message });
  }

  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:created', leadId }));
    getIO().to(`lead:${leadId}`).emit('crm:lead:updated', { leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return contract;
}

/**
 * Creates a renewal contract for a re-enrollment invite.
 * Validates invite is in FORMULARIO_CONFIRMADO state, creates contract with
 * enrollmentType=RENEWAL, and transitions re-enrollment gate to CONTRATO_PENDENTE.
 */
export async function createRenewalContract(
  leadId: string,
  inviteId: string,
  data: CreateContractData,
  userId: string,
) {
  // 1. Validate invite exists and is in a valid state for contract creation
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    include: { period: true, student: true },
  });
  if (!invite) throw createAppError('INVITE_NOT_FOUND');
  const validStatesForContract = new Set(['FORMULARIO_CONFIRMADO', 'DOCS_APROVADOS']);
  if (!validStatesForContract.has(invite.gateStatus)) {
    throw createAppError('RENEWAL_INVITE_NOT_CONFIRMED');
  }

  const code = generateContractCode();

  // Payment schedule calculation (same logic as createContract)
  const annualValue = data.totalAnnualValue;
  const discountPercent = data.discountPercent ?? 0;
  const discountedValue = annualValue * (1 - discountPercent / 100);
  const installmentAmount = data.installments > 0
    ? Math.round((discountedValue / data.installments) * 100) / 100
    : 0;

  const payments: Array<{ installmentNumber: number; dueDate: Date; amount: number }> = [];
  const startDate = data.paymentStartDate ? new Date(data.paymentStartDate) : new Date();
  for (let i = 0; i < data.installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    payments.push({ installmentNumber: i + 1, dueDate, amount: installmentAmount });
  }

  let contract;
  try {
    contract = await prisma.$transaction(async (tx) => {
      // Check for existing non-cancelled RENEWAL contract (scoped by enrollmentType)
      const existing = await tx.contract.findFirst({
        where: { leadId, enrollmentType: 'RENEWAL', status: { notIn: ['CANCELLED'] } },
      });
      if (existing) throw createAppError('RENEWAL_CONTRACT_ALREADY_EXISTS');

      // Resolve student grade for the contract (next grade for re-enrollment)
      const studentGrade = invite.student.grade
        ? (getNextGrade(invite.student.grade) ?? invite.student.grade)
        : null;

      const created = await tx.contract.create({
        data: {
          leadId,
          code,
          status: 'PENDING_LEGAL',
          enrollmentType: 'RENEWAL',
          studentId: invite.student.id,
          studentGrade,
          legalApprovalStatus: 'APPROVED',
          financialApprovalStatus: 'APPROVED',
          templateVersion: data.templateVersion ?? null,
          totalAnnualValue: data.totalAnnualValue,
          installments: data.installments,
          discountPercent: data.discountPercent ?? null,
          enrollmentFee: data.enrollmentFee ?? null,
          negotiatedDiscountPercent: data.negotiatedDiscountPercent ?? null,
          negotiatedFinalValue: data.negotiatedFinalValue ?? null,
          negotiationJustification: data.negotiationJustification ?? null,
          negotiationApprovedById: data.negotiationApprovedById ?? null,
          signers: {
            create: data.signers.map((s) => ({
              role: s.role, name: s.name, email: s.email,
              cpf: s.cpf ?? null, phone: s.phone ?? null,
            })),
          },
          payments: {
            create: payments.map((p) => ({
              installmentNumber: p.installmentNumber, dueDate: p.dueDate, amount: p.amount,
            })),
          },
        },
        include: contractInclude,
      });

      await tx.leadHistory.create({
        data: {
          leadId,
          action: 'CONTRACT_CREATED',
          actorId: userId,
          details: { contractId: created.id, code, enrollmentType: 'RENEWAL', inviteId },
        },
      });

      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw createAppError('RENEWAL_CONTRACT_ALREADY_EXISTS');
    }
    throw err;
  }

  // Transition re-enrollment gate: FORMULARIO_CONFIRMADO -> CONTRATO_PENDENTE
  try {
    const { transitionGate } = await import('../re-enrollment-gate.service.js');
    await transitionGate(inviteId, 'CONTRATO_PENDENTE', userId);
  } catch (err) {
    logger.warn('Re-enrollment gate transition to CONTRATO_PENDENTE failed', { inviteId, error: (err as Error).message });
  }

  // Emit CRM event
  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:created', leadId }));
    getIO().to(`lead:${leadId}`).emit('crm:lead:updated', { leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return contract;
}

// ==================== PREREQUISITES CHECK ====================

/**
 * Checks whether a lead has all required data for contract document generation.
 * Returns a list of prerequisite items with their status.
 */
export async function getContractPrerequisites(leadId: string): Promise<{
  ready: boolean;
  items: PrerequisiteItem[];
}> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      parents: true,
      children: true,
      address: true,
      financialResponsible: true,
    },
  });

  if (!lead) throw createAppError('LEAD_NOT_FOUND');

  const items: PrerequisiteItem[] = [];

  // 1. At least one parent with name and email
  const parentsWithData = lead.parents.filter(
    (p) => p.fullName && p.email,
  );
  items.push({
    key: 'parent_data',
    label: 'Responsável cadastrado com nome e e-mail',
    met: parentsWithData.length > 0,
    detail: parentsWithData.length > 0
      ? `${parentsWithData.length} responsável(is) completo(s)`
      : 'Cadastre ao menos um responsável com nome e e-mail',
  });

  // 2. At least one parent with CPF
  const parentsWithCpf = lead.parents.filter((p) => p.cpf);
  items.push({
    key: 'parent_cpf',
    label: 'CPF do responsável preenchido',
    met: parentsWithCpf.length > 0,
    detail: parentsWithCpf.length > 0
      ? `CPF informado para ${parentsWithCpf.length} responsável(is)`
      : 'Informe o CPF de ao menos um responsável',
  });

  // 3. At least one child (applicant) with name
  const applicants = lead.children.filter(
    (c) => c.isApplicant && c.fullName,
  );
  const anyChild = lead.children.filter((c) => c.fullName);
  const hasChild = applicants.length > 0 || anyChild.length > 0;
  items.push({
    key: 'child_data',
    label: 'Aluno(a) cadastrado(a) com nome',
    met: hasChild,
    detail: hasChild
      ? `${applicants.length || anyChild.length} aluno(s) cadastrado(s)`
      : 'Cadastre ao menos um aluno com nome completo',
  });

  // 4. At least one child with desired grade
  const childrenWithGrade = (applicants.length > 0 ? applicants : anyChild).filter(
    (c) => c.desiredGrade,
  );
  items.push({
    key: 'child_grade',
    label: 'Série desejada do aluno preenchida',
    met: childrenWithGrade.length > 0,
    detail: childrenWithGrade.length > 0
      ? childrenWithGrade.map((c) => `${c.fullName}: ${c.desiredGrade}`).join(', ')
      : 'Informe a série desejada para ao menos um aluno',
  });

  // 5. Lead address (city required at minimum)
  const hasAddress = !!(lead.address && lead.address.city);
  items.push({
    key: 'address',
    label: 'Endereço da família cadastrado',
    met: hasAddress,
    detail: hasAddress
      ? `${lead.address!.city}${lead.address!.state ? ` - ${lead.address!.state}` : ''}`
      : 'Cadastre o endereço com ao menos a cidade',
  });

  // 6. Financial responsible defined (explicit or via parents)
  const hasFinResp = !!(lead.financialResponsible) || lead.parents.length > 0;
  items.push({
    key: 'financial_responsible',
    label: 'Responsável financeiro definido',
    met: hasFinResp,
    detail: hasFinResp
      ? (lead.financialResponsible
          ? `Tipo: ${lead.financialResponsible.responsibleType}`
          : 'Usando responsável padrão (pai/mãe)')
      : 'Defina o responsável financeiro do aluno',
  });


  const ready = items.filter((i) => i.blocking !== false).every((i) => i.met);

  return { ready, items };
}

/**
 * Returns all contracts for a given lead, including signers and payments.
 * Document URLs are freshened on every call to avoid serving expired Supabase signed URLs.
 */
export async function findByLeadId(leadId: string) {
  const contracts = await prisma.contract.findMany({
    where: { leadId },
    include: contractInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Freshen signed URLs in batches to avoid unbounded concurrent Supabase calls (D-08)
  const freshened: typeof contracts = [];
  for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
    const batch = contracts.slice(i, i + BATCH_SIZE);
    const batchResult = await Promise.all(
      batch.map(async (c) => {
        const urls = await freshenContractUrls(c);
        return { ...c, ...urls };
      })
    );
    freshened.push(...batchResult);
  }

  return freshened;
}

/**
 * Adds a signer to an existing contract (before it is sent for signature).
 */
export async function addSigner(contractId: string, data: {
  role: ContractSignerRole;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (['SENT', 'SIGNED', 'ACTIVE'].includes(contract.status)) {
    throw createAppError('CONTRACT_ALREADY_SENT');
  }

  await prisma.contractSigner.create({
    data: { contractId, ...data },
  });

  return prisma.contract.findUnique({
    where: { id: contractId },
    include: contractInclude,
  });
}

/**
 * Updates a signer's data on an existing contract (before it is sent for signature).
 */
export async function updateSigner(contractId: string, signerId: string, data: {
  name?: string;
  email?: string;
  role?: ContractSignerRole;
  cpf?: string;
  phone?: string;
}) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (['SENT', 'SIGNED', 'ACTIVE', 'CANCELLED'].includes(contract.status)) {
    throw createAppError('CONTRACT_ALREADY_SENT');
  }

  // Validate signer belongs to this contract (prevent IDOR)
  const signer = await prisma.contractSigner.findFirst({
    where: { id: signerId, contractId },
  });
  if (!signer) throw createAppError('SIGNER_NOT_FOUND');

  await prisma.contractSigner.update({
    where: { id: signerId },
    data,
  });

  return prisma.contract.findUnique({
    where: { id: contractId },
    include: contractInclude,
  });
}

/**
 * Removes a signer from an existing contract (before it is sent for signature).
 */
export async function removeSigner(contractId: string, signerId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (['SENT', 'SIGNED', 'ACTIVE'].includes(contract.status)) {
    throw createAppError('CONTRACT_ALREADY_SENT');
  }

  await prisma.contractSigner.delete({ where: { id: signerId } });

  return prisma.contract.findUnique({
    where: { id: contractId },
    include: contractInclude,
  });
}

/**
 * Returns a single contract by ID with all relations.
 * Document URLs are freshened to avoid serving expired Supabase signed URLs.
 */
export async function findById(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: contractInclude,
  });
  if (!contract) return null;

  const urls = await freshenContractUrls(contract);
  return { ...contract, ...urls };
}
