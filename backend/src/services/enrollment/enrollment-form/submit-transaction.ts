import { Prisma, type Lead } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import { withTenantTx } from '../../../lib/tenant-context.js';
import type {
  PublicEnrollmentData,
  RequestMetadata,
} from '../../../types/enrollment.types.js';
import { assertSubmissionAllowed, assertChildIdsBelongToLead } from './validators.js';
import { applyParentUpdates } from './parent-updates.js';
import {
  applyDesiredGradeUpdates,
  applyPerChildSubmissionData,
} from './child-upserts.js';
import {
  replaceEmergencyContacts,
  upsertHealthPlan,
  upsertLeadTransport,
  upsertFinancialResponsible,
  recordSubmissionHistory,
} from './entity-upserts.js';

type Tx = Prisma.TransactionClient;

export interface SubmissionTransactionResult {
  lead: Lead;
  studentName: string;
  motherEmail: string | null | undefined;
}

/**
 * Bumping the timeout: the submission writes ~10 records across 8 tables and
 * Railway's pooled connections can be slow on the first transaction of a cold
 * worker. Defaults are 5s/5s — too tight in practice.
 */
const TX_OPTIONS = { maxWait: 10000, timeout: 60000 } as const;

async function runSubmissionWrites(
  tx: Tx,
  data: PublicEnrollmentData,
  metadata: RequestMetadata | undefined,
): Promise<SubmissionTransactionResult> {
  const existingLead = await tx.lead.findFirst({
    where: { enrollmentToken: data.enrollmentToken },
    include: { children: true, parents: true },
  });

  if (!existingLead) {
    throw new Error('TOKEN_NOT_FOUND');
  }

  const { applicantChildren } = assertSubmissionAllowed(existingLead, data);
  // Legacy: first applicant child carries the single-child shape
  const applicantChild = applicantChildren[0];

  const father = existingLead.parents.find(p => p.parentType === 'FATHER');
  const mother = existingLead.parents.find(p => p.parentType === 'MOTHER');

  const lead = await tx.lead.update({
    where: { id: existingLead.id },
    data: {
      enrollmentStatus: 'FORM_RECEIVED',
      enrollmentSubmittedAt: new Date(),
      enrollmentSubmissionCount: { increment: 1 },
    },
  });

  await applyParentUpdates(tx, { father, mother }, data);
  await applyDesiredGradeUpdates(tx, applicantChild, data);

  assertChildIdsBelongToLead(applicantChildren, data);
  await applyPerChildSubmissionData(tx, lead.id, applicantChild, data);

  await replaceEmergencyContacts(tx, lead.id, data);
  await upsertHealthPlan(tx, lead.id, data);
  await upsertLeadTransport(tx, lead.id, data);
  await upsertFinancialResponsible(tx, lead.id, data);
  await recordSubmissionHistory(
    tx,
    lead.id,
    applicantChild.fullName,
    data,
    existingLead.enrollmentSubmissionCount || 0,
    metadata,
  );

  return { lead, studentName: applicantChild.fullName, motherEmail: mother?.email };
}

/**
 * Run every write the enrollment submission needs inside a single transaction.
 * The caller is responsible for the token-presence guard and the post-submit
 * side effects (email, notifications) — those must run after the transaction
 * commits so a rollback never leaks downstream work.
 */
export async function runSubmissionTransaction(
  data: PublicEnrollmentData,
  metadata: RequestMetadata | undefined,
): Promise<SubmissionTransactionResult> {
  // Phase 6: withTenantTx scopes app.current_tenant_id for RLS
  // enforcement. ALS is established by withTenantFromToken on the
  // public route — the GUC inherits that tenantId.
  return withTenantTx<SubmissionTransactionResult, Tx>(
    prisma,
    (tx) => runSubmissionWrites(tx, data, metadata),
    { txOptions: TX_OPTIONS },
  );
}
