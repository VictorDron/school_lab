import { prisma } from '../../config/database.js';
import { createRenewalContract } from './contract-core.service.js';
import { sendForSignature } from './contract-webhook.service.js';
import * as DefaultSignersService from '../contract-default-signers.service.js';
import logger from '../../utils/logger.js';

export interface BatchContractResult {
  total: number;
  created: number;
  failed: number;
  results: Array<{
    inviteId: string;
    studentName: string;
    success: boolean;
    contractId?: string;
    contractCode?: string;
    error?: string;
  }>;
}

export async function createBatchRenewalContracts(
  periodId: string,
  inviteIds: string[],
  sendForSignatureFlag: boolean,
  userId: string,
): Promise<BatchContractResult> {
  const defaultSigners = await DefaultSignersService.listActive();

  if (defaultSigners.length === 0) {
    throw Object.assign(
      new Error('Nenhum signatário padrão configurado. Configure os signatários padrão antes de criar contratos em massa.'),
      { statusCode: 400, code: 'NO_DEFAULT_SIGNERS' },
    );
  }

  // Fetch all invites with their student/lead data and financial info
  const invites = await prisma.reEnrollmentInvite.findMany({
    where: {
      id: { in: inviteIds },
      periodId,
    },
    include: {
      student: {
        include: {
          lead: {
            include: {
              parents: { select: { fullName: true, email: true, cpf: true, phone: true, parentType: true } },
              contracts: { where: { enrollmentType: 'RENEWAL', status: { not: 'CANCELLED' } }, select: { id: true } },
            },
          },
        },
      },
      period: true,
    },
  });

  // Fetch price table for the period
  const priceTable = await prisma.periodPriceTable.findMany({
    where: { periodId },
  });

  // Fetch family exceptions
  const studentIds = invites.map((i) => i.studentId);
  const exceptions = await prisma.familyPriceException.findMany({
    where: { periodId, studentId: { in: studentIds } },
  });
  const exceptionMap = new Map(exceptions.map((e) => [e.studentId, e]));

  const results: BatchContractResult['results'] = [];

  for (const invite of invites) {
    const studentName = invite.student.fullName;

    try {
      // Validate gate status
      const validStates = new Set(['FORMULARIO_CONFIRMADO', 'DOCS_APROVADOS']);
      if (!validStates.has(invite.gateStatus)) {
        results.push({
          inviteId: invite.id,
          studentName,
          success: false,
          error: `Etapa inválida: ${invite.gateStatus}. Esperado: Formulário Confirmado ou Docs Aprovados.`,
        });
        continue;
      }

      // Check if already has a renewal contract
      if (invite.student.lead?.contracts && invite.student.lead.contracts.length > 0) {
        results.push({
          inviteId: invite.id,
          studentName,
          success: false,
          error: 'Já possui contrato de rematrícula ativo.',
        });
        continue;
      }

      // Resolve financial data
      const grade = invite.student.grade;
      const exception = exceptionMap.get(invite.studentId);
      const priceEntry = priceTable.find((p) => p.grade === grade);

      if (!priceEntry && !exception) {
        results.push({
          inviteId: invite.id,
          studentName,
          success: false,
          error: `Tabela de preços não encontrada para a série ${grade}.`,
        });
        continue;
      }

      const baseAnnualValue = Number(priceEntry?.baseAnnualValue ?? 0);
      const enrollmentFee = Number(priceEntry?.enrollmentFee ?? 0);
      const exceptionDiscount = exception ? Number(exception.overrideDiscountPercent ?? 0) : 0;
      const finalAnnualValue = exception?.overrideAnnualValue
        ? Number(exception.overrideAnnualValue)
        : baseAnnualValue * (1 - exceptionDiscount / 100);

      // Build signers: parent from lead + default signers
      const leadParents = invite.student.lead?.parents ?? [];
      const parentWithEmail = leadParents.find((p) => p.email);

      const parentSigner = parentWithEmail
        ? {
            role: (parentWithEmail.parentType === 'FATHER' || parentWithEmail.parentType === 'MOTHER')
              ? 'PARENT' as const
              : 'GUARDIAN' as const,
            name: parentWithEmail.fullName || '',
            email: parentWithEmail.email || '',
            cpf: parentWithEmail.cpf || undefined,
            phone: parentWithEmail.phone || undefined,
          }
        : null;

      if (!parentSigner) {
        results.push({
          inviteId: invite.id,
          studentName,
          success: false,
          error: 'Nenhum responsável com e-mail encontrado no cadastro do lead.',
        });
        continue;
      }

      const signers = [
        parentSigner,
        ...defaultSigners.map((ds) => ({
          role: ds.role,
          name: ds.name,
          email: ds.email,
          cpf: ds.cpf || undefined,
          phone: ds.phone || undefined,
        })),
      ];

      const leadId = invite.student.leadId;
      if (!leadId) {
        results.push({
          inviteId: invite.id,
          studentName,
          success: false,
          error: 'Aluno sem lead vinculado.',
        });
        continue;
      }

      const contract = await createRenewalContract(
        leadId,
        invite.id,
        {
          totalAnnualValue: finalAnnualValue,
          installments: 12,
          discountPercent: exceptionDiscount || undefined,
          enrollmentFee: enrollmentFee || undefined,
          signers,
        },
        userId,
      );

      // Optionally send for signature
      if (sendForSignatureFlag && contract.id) {
        try {
          await sendForSignature(contract.id, userId);
        } catch (signErr) {
          logger.warn('Batch: auto send-for-signature failed', {
            contractId: contract.id,
            error: (signErr as Error).message,
          });
        }
      }

      results.push({
        inviteId: invite.id,
        studentName,
        success: true,
        contractId: contract.id,
        contractCode: contract.code,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('Batch contract creation failed for invite', { inviteId: invite.id, error: msg });
      results.push({
        inviteId: invite.id,
        studentName,
        success: false,
        error: msg,
      });
    }
  }

  return {
    total: invites.length,
    created: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
