/**
 * Wave 1 / 2.5 export-surface regression guard.
 *
 * Locks the public export surface of the subdomain services that replaced
 * the wave 1 god services. The leads/* and students/* aggregators stay as
 * the canonical entry points; re-enrollment is now five sibling services
 * (period, invite, gate, eligibility, analytics).
 *
 * Mocks every infrastructure module that the services import so the import
 * graph resolves without a live database, Redis, or Supabase.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () => vi.fn(),
          },
        ),
    },
  ),
}));

vi.mock('../config/redis.js', () => ({
  redis: { publish: vi.fn(), get: vi.fn(), set: vi.fn() },
}));

vi.mock('../config/supabase.js', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getSignedUrl: vi.fn(),
  supabaseAdmin: {},
}));

vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

vi.mock('./audit.service.js', () => ({ createAuditLog: vi.fn() }));
vi.mock('./email.service.js', () => ({
  sendEmail: vi.fn(),
  sendApplicationLinkEmail: vi.fn(),
  sendEnrollmentLinkEmail: vi.fn(),
}));
vi.mock('./notification.service.js', () => ({
  notifyUsers: vi.fn(),
  publishCrmEvent: vi.fn(),
}));
vi.mock('./notifications.service.js', () => ({
  createNotification: vi.fn(),
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const LEADS_EXPECTED_EXPORTS = [
  'BATCH_SIZE',
  'findMany',
  'findById',
  'getDefaultColumn',
  'findDuplicates',
  'create',
  'update',
  'remove',
  'updateColumn',
  'toggleFlag',
  'addComment',
  'deleteComment',
  'addChild',
  'updateChild',
  'updateParent',
  'updateAddress',
  'updateChildHealth',
  'updateChildTransport',
  'createEmergencyContact',
  'updateEmergencyContact',
  'deleteEmergencyContact',
  'updateFinancialResponsible',
  'updateHealthPlan',
  'deleteChild',
  'uploadDocument',
  'deleteDocument',
  'generateApplicationLink',
  'getTokenStatus',
  'revokeToken',
  'sendApplicationLinkByEmail',
  'getOverviewStats',
  'getPipelineStats',
  'updateApplicationStatus',
] as const;

const STUDENTS_EXPECTED_EXPORTS = [
  'syncLeadChildToStudents',
  'createStudentsFromEnrollment',
  'createStudentFromReEnrollment',
  'findMany',
  'findById',
  'findByIdWithDocuments',
  'updateStatus',
  'updateStudent',
  'getStudentDashboardStats',
  'bulkUpdate',
  'exportCsv',
  'uploadAvatar',
  'getEvolutionStats',
  'uploadStudentDocument',
  'reviewStudentDocument',
  'updateStudentDocumentType',
  'deleteStudentDocument',
  'updateStudentHealth',
  'updateStudentTransport',
  'updateStudentEnrollmentInfo',
  'updateStudentHealthPlan',
  'updateStudentEmergencyContact',
  'updateStudentParent',
  'auditIntegrity',
  'repairIntegrity',
] as const;

const REENROLLMENT_PERIOD_EXPORTS = [
  'canTransitionPeriod',
  'assertNoOtherOpenPeriod',
  'createPeriod',
  'transitionPeriod',
  'updatePeriod',
  'deletePeriod',
  'findPeriodById',
  'findManyPeriods',
  'getPeriodTimeline',
] as const;

const REENROLLMENT_INVITE_EXPORTS = [
  'createInvite',
  'createInviteForStudent',
  'findInviteByToken',
  'updateInviteStatus',
  'updateInviteEmailStatus',
  'findManyInvitesByPeriod',
] as const;

const REENROLLMENT_GATE_EXPORTS = ['canTransitionGate', 'transitionGate'] as const;

const REENROLLMENT_ELIGIBILITY_EXPORTS = [
  'findEligibleStudents',
  'findUnifiedManagement',
  'createBatchInvites',
] as const;

const REENROLLMENT_ANALYTICS_EXPORTS = [
  'getFunnelData',
  'getBottleneckAnalysis',
  'getPeriodDashboardStats',
  'generatePeriodReport',
  'getPreReEnrollmentReport',
] as const;

describe('subdomain export surface (regression guard)', () => {
  it('services/leads aggregator exports the documented symbols', async () => {
    const mod = await import('../services/leads/index.js');
    for (const name of LEADS_EXPECTED_EXPORTS) {
      expect(mod, `missing export: services/leads.${name}`).toHaveProperty(name);
    }
  });

  it('services/students aggregator exports the documented symbols', async () => {
    const mod = await import('../services/students/index.js');
    for (const name of STUDENTS_EXPECTED_EXPORTS) {
      expect(mod, `missing export: services/students.${name}`).toHaveProperty(
        name,
      );
    }
  });

  it('re-enrollment-period exports the documented symbols', async () => {
    const mod = await import('../services/re-enrollment-period.service.js');
    for (const name of REENROLLMENT_PERIOD_EXPORTS) {
      expect(mod, `missing export: re-enrollment-period.${name}`).toHaveProperty(name);
    }
  });

  it('re-enrollment-invite exports the documented symbols', async () => {
    const mod = await import('../services/re-enrollment-invite.service.js');
    for (const name of REENROLLMENT_INVITE_EXPORTS) {
      expect(mod, `missing export: re-enrollment-invite.${name}`).toHaveProperty(name);
    }
  });

  it('re-enrollment-gate exports the documented symbols', async () => {
    const mod = await import('../services/re-enrollment-gate.service.js');
    for (const name of REENROLLMENT_GATE_EXPORTS) {
      expect(mod, `missing export: re-enrollment-gate.${name}`).toHaveProperty(name);
    }
  });

  it('re-enrollment-eligibility exports the documented symbols', async () => {
    const mod = await import('../services/re-enrollment-eligibility.service.js');
    for (const name of REENROLLMENT_ELIGIBILITY_EXPORTS) {
      expect(mod, `missing export: re-enrollment-eligibility.${name}`).toHaveProperty(name);
    }
  });

  it('re-enrollment-analytics exports the documented symbols', async () => {
    const mod = await import('../services/re-enrollment-analytics.service.js');
    for (const name of REENROLLMENT_ANALYTICS_EXPORTS) {
      expect(mod, `missing export: re-enrollment-analytics.${name}`).toHaveProperty(name);
    }
  });
});
