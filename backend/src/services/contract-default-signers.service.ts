import { prisma } from '../config/database.js';
import { ContractSignerRole } from '@prisma/client';
import logger from '../utils/logger.js';

export interface DefaultSignerData {
  role: ContractSignerRole;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}

export async function listActive() {
  return prisma.contractDefaultSigner.findMany({
    where: { isActive: true },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listAll() {
  return prisma.contractDefaultSigner.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function upsert(data: DefaultSignerData) {
  const existing = await prisma.contractDefaultSigner.findFirst({
    where: { role: data.role, email: data.email },
  });

  if (existing) {
    return prisma.contractDefaultSigner.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        cpf: data.cpf ?? null,
        phone: data.phone ?? null,
        isActive: true,
      },
    });
  }

  return prisma.contractDefaultSigner.create({
    data: {
      role: data.role,
      name: data.name,
      email: data.email,
      cpf: data.cpf ?? null,
      phone: data.phone ?? null,
    },
  });
}

export async function update(id: string, data: Partial<DefaultSignerData>) {
  return prisma.contractDefaultSigner.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.cpf !== undefined && { cpf: data.cpf ?? null }),
      ...(data.phone !== undefined && { phone: data.phone ?? null }),
    },
  });
}

export async function remove(id: string) {
  return prisma.contractDefaultSigner.delete({ where: { id } });
}

export async function replaceAll(signers: DefaultSignerData[]) {
  return prisma.$transaction(async (tx) => {
    await tx.contractDefaultSigner.deleteMany({});

    const created = [];
    for (const s of signers) {
      const record = await tx.contractDefaultSigner.create({
        data: {
          role: s.role,
          name: s.name,
          email: s.email,
          cpf: s.cpf ?? null,
          phone: s.phone ?? null,
        },
      });
      created.push(record);
    }

    logger.info('Default signers replaced', { count: created.length });
    return created;
  });
}
