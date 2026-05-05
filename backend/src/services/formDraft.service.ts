import { prisma } from '../config/database.js';
import { FormDraftType } from '@prisma/client';

const DRAFT_EXPIRY_HOURS = 72;

export async function upsertDraft(
  token: string,
  formType: FormDraftType,
  data: unknown,
  step: number
) {
  const expiresAt = new Date(Date.now() + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000);

  return prisma.formDraft.upsert({
    where: { token_formType: { token, formType } },
    create: { token, formType, data: data as any, step, expiresAt },
    update: { data: data as any, step, expiresAt },
  });
}

export async function getDraft(token: string, formType: FormDraftType) {
  const draft = await prisma.formDraft.findUnique({
    where: { token_formType: { token, formType } },
  });

  if (!draft || draft.expiresAt < new Date()) {
    return null;
  }

  return {
    data: draft.data,
    step: draft.step,
    updatedAt: draft.updatedAt,
  };
}

export async function deleteDraft(token: string, formType: FormDraftType) {
  try {
    await prisma.formDraft.delete({
      where: { token_formType: { token, formType } },
    });
  } catch {
    // Silently ignore if draft doesn't exist
  }
}

/**
 * Validates that a token belongs to a lead and has not expired (SEC-03).
 * Used by form draft save/load endpoints.
 */
export async function validateDraftToken(token: string): Promise<{ valid: true } | { valid: false; error: 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' }> {
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [
        { applicationToken: token },
        { enrollmentToken: token },
      ],
    },
    select: {
      id: true,
      applicationToken: true,
      enrollmentToken: true,
      applicationTokenExpires: true,
      enrollmentTokenExpires: true,
    },
  });

  if (!lead) {
    return { valid: false, error: 'TOKEN_NOT_FOUND' };
  }

  const isApplicationToken = lead.applicationToken === token;
  const expiry = isApplicationToken ? lead.applicationTokenExpires : lead.enrollmentTokenExpires;
  if (expiry && new Date() > expiry) {
    return { valid: false, error: 'TOKEN_EXPIRED' };
  }

  return { valid: true };
}
