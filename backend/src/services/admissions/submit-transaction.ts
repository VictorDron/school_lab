import type { Lead, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import type { PublicAdmissionData } from './index.js';
import { assertSubmissionAllowed, normalizeStudentList } from './validators.js';
import { applyLeadUpdate } from './lead-update.js';
import { getOrCreateSettings } from '../settings.service.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import {
  cleanupFormSubmittedEntities,
  createAddress,
  createParents,
  recordSubmissionHistory,
} from './entity-creates.js';
import {
  associateDocumentsToChildren,
  createAdditionalInfoPerChild,
  createApplicantChildren,
  createEducationHistoryPerChild,
  createSiblings,
} from './child-creates.js';

type Tx = Prisma.TransactionClient;

interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface SubmissionTransactionResult {
  lead: Lead;
  studentName: string;
}

/**
 * Bumping the timeout: the submission writes ~10 records across 9 tables and
 * Railway's pooled connections can be slow on the first transaction of a
 * cold worker. Defaults are 5s/5s — too tight in practice.
 */
const TX_OPTIONS = { maxWait: 10000, timeout: 60000 } as const;

async function runSubmissionWrites(
  tx: Tx,
  data: PublicAdmissionData,
  metadata: RequestMetadata | undefined,
  schoolName: string,
): Promise<SubmissionTransactionResult> {
  const students = normalizeStudentList(data);

  const existingLead = await tx.lead.findFirst({
    where: { applicationToken: data.applicationToken },
  });

  if (!existingLead) {
    throw new Error('TOKEN_NOT_FOUND');
  }

  assertSubmissionAllowed(existingLead);

  const lead = await applyLeadUpdate(tx, existingLead, data, students, schoolName);

  await cleanupFormSubmittedEntities(tx, lead.id);

  const createdStudents = await createApplicantChildren(tx, lead.id, students);
  await createSiblings(tx, lead.id, data.siblings);
  await createAddress(tx, lead.id, data.address);
  await createParents(tx, lead.id, data.father, data.mother);

  await createEducationHistoryPerChild(tx, lead.id, createdStudents);
  await createAdditionalInfoPerChild(tx, lead.id, createdStudents);
  await associateDocumentsToChildren(tx, lead.id, createdStudents);

  await recordSubmissionHistory(
    tx,
    lead.id,
    data,
    createdStudents,
    existingLead.formSubmissionCount || 0,
    metadata,
  );

  return { lead, studentName: createdStudents[0].studentData.fullName };
}

/**
 * Run every write the admission submission needs inside a single transaction.
 * The caller is responsible for the token-presence guard and the post-submit
 * side effects (gate, email, notifications) — those must run after the
 * transaction commits so a rollback never leaks downstream work.
 */
export async function runSubmissionTransaction(
  data: PublicAdmissionData,
  metadata: RequestMetadata | undefined,
): Promise<SubmissionTransactionResult> {
  // Read once outside the transaction — settings is small and per-tenant
  // immutable for the request, so there's no value in including it in the tx.
  // Phase 3a: ALS is established by withTenantFromToken on the public
  // route, so requireTenantId() resolves to the right tenant.
  const tenantId = requireTenantId();
  const { schoolName } = await getOrCreateSettings(tenantId);

  return prisma.$transaction(
    (tx) => runSubmissionWrites(tx, data, metadata, schoolName),
    TX_OPTIONS,
  );
}
