import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';
import type { CreateAddendumData } from './types.js';

function generateAddendumCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000).toString();
  return `ADT-${dateStr}-${rand}`;
}

export async function createAddendum(data: CreateAddendumData) {
  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
  });

  if (!contract) {
    throw new Error('CONTRACT_NOT_FOUND');
  }

  if (contract.status === 'CANCELLED') {
    throw new Error('INVALID_CONTRACT_STATUS');
  }

  const code = generateAddendumCode();

  // Inherit tenantId from the parent Contract — invariant ensured by
  // schema (Contract.tenantId NOT NULL) and our scope middleware
  // would have rejected the contract lookup if it didn't belong to
  // the active tenant.
  const addendum = await prisma.contractAddendum.create({
    data: {
      tenantId: contract.tenantId,
      contractId: data.contractId,
      code,
      type: data.type,
      status: 'DRAFT',
      description: data.description,
      changedValues: data.changedValues ?? [],
      signers: {
        create: data.signers.map((s) => ({
          role: s.role,
          name: s.name,
          email: s.email,
          cpf: s.cpf ?? null,
          phone: s.phone ?? null,
        })),
      },
    },
    include: { signers: true },
  });

  logger.info(`Addendum created: ${code} for contract ${contract.code}`);
  return addendum;
}

export async function listByContractId(contractId: string) {
  return prisma.contractAddendum.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
    include: { signers: true },
  });
}

export async function findById(id: string) {
  return prisma.contractAddendum.findUnique({
    where: { id },
    include: { signers: true },
  });
}

export async function cancelAddendum(addendumId: string) {
  const updated = await prisma.contractAddendum.update({
    where: { id: addendumId },
    data: { status: 'CANCELLED' },
    include: { signers: true },
  });

  logger.info(`Addendum cancelled: ${updated.code}`);
  return updated;
}
