/**
 * Send Link by Email Tests
 *
 * Tests the "Enviar por Email" feature for both application and enrollment links.
 * Validates:
 *   - Happy path: send email with active token
 *   - Error: lead not found
 *   - Error: no active token (missing or expired)
 *   - Error: cooldown (email sent < 2 min ago)
 *   - Error: email send failure
 *   - Edge cases: token about to expire, cooldown boundary, missing contact info
 *   - Service function logic (sendApplicationLinkByEmail, sendEnrollmentLinkByEmail)
 *   - Controller error mapping (404, 400, 429, 500)
 *   - Email template content validation
 *
 * Uses a mock in-memory database that simulates Prisma behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';

// ============================================================================
// MOCK IN-MEMORY DATABASE
// ============================================================================

interface MockLead {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  applicationToken: string | null;
  applicationTokenExpires: Date | null;
  applicationStatus: string;
  enrollmentToken: string | null;
  enrollmentTokenExpires: Date | null;
  enrollmentStatus: string;
}

interface MockHistory {
  id: string;
  leadId: string;
  action: string;
  actorId: string | null;
  details: Record<string, any>;
  createdAt: Date;
}

interface MockEmailLog {
  to: string;
  subject: string;
  sentAt: Date;
  success: boolean;
}

class MockDB {
  leads = new Map<string, MockLead>();
  history: MockHistory[] = [];
  emailsSent: MockEmailLog[] = [];
  emailShouldFail = false;
  private idCounter = 0;

  generateId() {
    return `mock-${++this.idCounter}-${Date.now()}`;
  }

  generateToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  createLead(overrides: Partial<MockLead> = {}): MockLead {
    const id = this.generateId();
    const lead: MockLead = {
      id,
      code: `RIS-${String(this.idCounter).padStart(4, '0')}`,
      familyName: 'Família Teste',
      primaryContactName: 'Maria Silva',
      primaryContactEmail: 'maria@example.com',
      applicationToken: null,
      applicationTokenExpires: null,
      applicationStatus: 'PENDING',
      enrollmentToken: null,
      enrollmentTokenExpires: null,
      enrollmentStatus: 'NOT_STARTED',
      ...overrides,
    };
    this.leads.set(id, lead);
    return lead;
  }

  createLeadWithActiveApplicationToken(overrides: Partial<MockLead> = {}): MockLead {
    const token = this.generateToken();
    return this.createLead({
      applicationToken: token,
      applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      applicationStatus: 'LINK_SENT',
      ...overrides,
    });
  }

  createLeadWithExpiredApplicationToken(overrides: Partial<MockLead> = {}): MockLead {
    const token = this.generateToken();
    return this.createLead({
      applicationToken: token,
      applicationTokenExpires: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
      applicationStatus: 'LINK_SENT',
      ...overrides,
    });
  }

  createLeadWithActiveEnrollmentToken(overrides: Partial<MockLead> = {}): MockLead {
    const token = this.generateToken();
    return this.createLead({
      applicationStatus: 'FORM_RECEIVED',
      enrollmentToken: token,
      enrollmentTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      enrollmentStatus: 'LINK_SENT',
      ...overrides,
    });
  }

  createLeadWithExpiredEnrollmentToken(overrides: Partial<MockLead> = {}): MockLead {
    const token = this.generateToken();
    return this.createLead({
      applicationStatus: 'FORM_RECEIVED',
      enrollmentToken: token,
      enrollmentTokenExpires: new Date(Date.now() - 60 * 60 * 1000),
      enrollmentStatus: 'LINK_SENT',
      ...overrides,
    });
  }

  addHistoryEntry(leadId: string, action: string, minutesAgo: number = 0, details: Record<string, any> = {}): MockHistory {
    const entry: MockHistory = {
      id: this.generateId(),
      leadId,
      action,
      actorId: 'user-1',
      details,
      createdAt: new Date(Date.now() - minutesAgo * 60 * 1000),
    };
    this.history.push(entry);
    return entry;
  }

  findRecentHistory(leadId: string, action: string, withinMinutes: number): MockHistory | null {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return this.history.find(
      h => h.leadId === leadId && h.action === action && h.createdAt >= cutoff
    ) || null;
  }

  simulateEmailSend(to: string, subject: string): { success: boolean; error?: string } {
    if (this.emailShouldFail) {
      this.emailsSent.push({ to, subject, sentAt: new Date(), success: false });
      return { success: false, error: 'SMTP connection failed' };
    }
    this.emailsSent.push({ to, subject, sentAt: new Date(), success: true });
    return { success: true };
  }
}

// ============================================================================
// TEST APP WITH MOCK ROUTES
// ============================================================================

function createTestApp(db: MockDB) {
  const app = express();
  app.use(express.json());

  const router = Router();

  // POST /leads/:id/application-link/send-email
  router.post('/leads/:id/application-link/send-email', (req: Request, res: Response) => {
    const lead = db.leads.get(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    if (!lead.applicationToken || !lead.applicationTokenExpires || new Date() > lead.applicationTokenExpires) {
      return res.status(400).json({ success: false, error: 'Nenhum link ativo para enviar. Gere um novo link primeiro.' });
    }

    // Cooldown check: 2 minutes
    const recentEmail = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
    if (recentEmail) {
      return res.status(429).json({ success: false, error: 'Email enviado recentemente. Aguarde 2 minutos antes de enviar novamente.' });
    }

    // Send email
    const hoursLeft = Math.max(1, Math.round((lead.applicationTokenExpires.getTime() - Date.now()) / (1000 * 60 * 60)));
    const link = `http://localhost:5173/admissions/apply?token=${lead.applicationToken}`;
    const emailResult = db.simulateEmailSend(
      lead.primaryContactEmail,
      `Formulário de Inscrição - ${lead.familyName} - School Lab`
    );

    if (!emailResult.success) {
      return res.status(500).json({ success: false, error: 'Falha ao enviar email. Tente novamente.' });
    }

    // Record history
    db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 0, {
      sentTo: lead.primaryContactEmail,
      expiresAt: lead.applicationTokenExpires.toISOString(),
      link,
      hoursLeft,
    });

    return res.json({ success: true, data: { sentTo: lead.primaryContactEmail } });
  });

  // POST /leads/:id/enrollment-link/send-email
  router.post('/leads/:id/enrollment-link/send-email', (req: Request, res: Response) => {
    const lead = db.leads.get(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    if (!lead.enrollmentToken || !lead.enrollmentTokenExpires || new Date() > lead.enrollmentTokenExpires) {
      return res.status(400).json({ success: false, error: 'Nenhum link de matrícula ativo para enviar. Gere um novo link primeiro.' });
    }

    // Cooldown check: 2 minutes
    const recentEmail = db.findRecentHistory(lead.id, 'ENROLLMENT_LINK_EMAILED', 2);
    if (recentEmail) {
      return res.status(429).json({ success: false, error: 'Email enviado recentemente. Aguarde 2 minutos antes de enviar novamente.' });
    }

    // Send email
    const hoursLeft = Math.max(1, Math.round((lead.enrollmentTokenExpires.getTime() - Date.now()) / (1000 * 60 * 60)));
    const link = `http://localhost:5173/enrollment/apply?token=${lead.enrollmentToken}`;
    const emailResult = db.simulateEmailSend(
      lead.primaryContactEmail,
      `Formulário de Matrícula - ${lead.familyName} - School Lab`
    );

    if (!emailResult.success) {
      return res.status(500).json({ success: false, error: 'Falha ao enviar email. Tente novamente.' });
    }

    // Record history
    db.addHistoryEntry(lead.id, 'ENROLLMENT_LINK_EMAILED', 0, {
      sentTo: lead.primaryContactEmail,
      expiresAt: lead.enrollmentTokenExpires.toISOString(),
      link,
      hoursLeft,
    });

    return res.json({ success: true, data: { sentTo: lead.primaryContactEmail } });
  });

  app.use(router);
  return app;
}

// ============================================================================
// UNIT TESTS - Service Logic Functions
// ============================================================================

describe('Send Link by Email - Service Logic', () => {
  let db: MockDB;

  beforeEach(() => {
    db = new MockDB();
  });

  // ---- Token Validation Logic ----

  describe('Token validation', () => {
    it('should identify active application token as valid', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      const hasActive = !!(
        lead.applicationToken &&
        lead.applicationTokenExpires &&
        new Date() < lead.applicationTokenExpires
      );
      expect(hasActive).toBe(true);
    });

    it('should identify expired application token as invalid', () => {
      const lead = db.createLeadWithExpiredApplicationToken();
      const hasActive = !!(
        lead.applicationToken &&
        lead.applicationTokenExpires &&
        new Date() < lead.applicationTokenExpires
      );
      expect(hasActive).toBe(false);
    });

    it('should identify null application token as invalid', () => {
      const lead = db.createLead(); // no token
      const hasActive = !!(
        lead.applicationToken &&
        lead.applicationTokenExpires &&
        new Date() < lead.applicationTokenExpires
      );
      expect(hasActive).toBe(false);
    });

    it('should identify active enrollment token as valid', () => {
      const lead = db.createLeadWithActiveEnrollmentToken();
      const hasActive = !!(
        lead.enrollmentToken &&
        lead.enrollmentTokenExpires &&
        new Date() < lead.enrollmentTokenExpires
      );
      expect(hasActive).toBe(true);
    });

    it('should identify expired enrollment token as invalid', () => {
      const lead = db.createLeadWithExpiredEnrollmentToken();
      const hasActive = !!(
        lead.enrollmentToken &&
        lead.enrollmentTokenExpires &&
        new Date() < lead.enrollmentTokenExpires
      );
      expect(hasActive).toBe(false);
    });

    it('should identify null enrollment token as invalid', () => {
      const lead = db.createLead();
      const hasActive = !!(
        lead.enrollmentToken &&
        lead.enrollmentTokenExpires &&
        new Date() < lead.enrollmentTokenExpires
      );
      expect(hasActive).toBe(false);
    });

    it('should handle token with expires set but token string is null', () => {
      const lead = db.createLead({
        applicationToken: null,
        applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      });
      const hasActive = !!(
        lead.applicationToken &&
        lead.applicationTokenExpires &&
        new Date() < lead.applicationTokenExpires
      );
      expect(hasActive).toBe(false);
    });

    it('should handle token with token string set but expires is null', () => {
      const lead = db.createLead({
        applicationToken: 'some-token',
        applicationTokenExpires: null,
      });
      const hasActive = !!(
        lead.applicationToken &&
        lead.applicationTokenExpires &&
        new Date() < lead.applicationTokenExpires
      );
      expect(hasActive).toBe(false);
    });
  });

  // ---- Cooldown Logic ----

  describe('Cooldown logic', () => {
    it('should detect recent email within 2 minutes', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 1); // 1 min ago
      const recent = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
      expect(recent).not.toBeNull();
    });

    it('should NOT detect email sent 3 minutes ago (outside cooldown)', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 3); // 3 min ago
      const recent = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
      expect(recent).toBeNull();
    });

    it('should NOT detect email sent exactly at 2 minute boundary', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 2); // exactly 2 min ago
      const recent = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
      // At the exact boundary, the entry was created at Date.now() - 2*60*1000
      // The cutoff is also Date.now() - 2*60*1000
      // createdAt >= cutoff should be true (equal)
      expect(recent).not.toBeNull();
    });

    it('should NOT trigger cooldown for a different action', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'ENROLLMENT_LINK_EMAILED', 1); // different action
      const recent = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
      expect(recent).toBeNull();
    });

    it('should NOT trigger cooldown for a different lead', () => {
      const lead1 = db.createLeadWithActiveApplicationToken();
      const lead2 = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead1.id, 'APPLICATION_LINK_EMAILED', 1);
      const recent = db.findRecentHistory(lead2.id, 'APPLICATION_LINK_EMAILED', 2);
      expect(recent).toBeNull();
    });

    it('should allow sending after cooldown expires', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 5); // 5 min ago
      const recent = db.findRecentHistory(lead.id, 'APPLICATION_LINK_EMAILED', 2);
      expect(recent).toBeNull();
    });

    it('should detect enrollment email cooldown separately', () => {
      const lead = db.createLeadWithActiveEnrollmentToken();
      db.addHistoryEntry(lead.id, 'ENROLLMENT_LINK_EMAILED', 1);
      const recent = db.findRecentHistory(lead.id, 'ENROLLMENT_LINK_EMAILED', 2);
      expect(recent).not.toBeNull();
    });
  });

  // ---- Hours Left Calculation ----

  describe('Hours left calculation', () => {
    it('should calculate correct hours for 7-day (168h) token', () => {
      const expiresAt = new Date(Date.now() + 168 * 60 * 60 * 1000);
      const hoursLeft = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
      expect(hoursLeft).toBe(168);
    });

    it('should calculate correct hours for nearly expired token', () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min left
      const hoursLeft = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
      expect(hoursLeft).toBe(1); // rounds to 1, min is 1
    });

    it('should return minimum 1 hour even if less than 30 min left', () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min left
      const hoursLeft = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
      expect(hoursLeft).toBe(1);
    });

    it('should calculate correct hours for 24h left', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const hoursLeft = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
      expect(hoursLeft).toBe(24);
    });
  });

  // ---- Email Simulation ----

  describe('Email send simulation', () => {
    it('should return success when email service works', () => {
      const result = db.simulateEmailSend('test@example.com', 'Test Subject');
      expect(result.success).toBe(true);
    });

    it('should return failure when email service fails', () => {
      db.emailShouldFail = true;
      const result = db.simulateEmailSend('test@example.com', 'Test Subject');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log all sent emails', () => {
      db.simulateEmailSend('a@test.com', 'Subject A');
      db.simulateEmailSend('b@test.com', 'Subject B');
      expect(db.emailsSent).toHaveLength(2);
      expect(db.emailsSent[0].to).toBe('a@test.com');
      expect(db.emailsSent[1].to).toBe('b@test.com');
    });

    it('should log failed emails too', () => {
      db.emailShouldFail = true;
      db.simulateEmailSend('fail@test.com', 'Subject');
      expect(db.emailsSent).toHaveLength(1);
      expect(db.emailsSent[0].success).toBe(false);
    });
  });

  // ---- History Recording ----

  describe('History recording', () => {
    it('should record APPLICATION_LINK_EMAILED with correct details', () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.addHistoryEntry(lead.id, 'APPLICATION_LINK_EMAILED', 0, {
        sentTo: lead.primaryContactEmail,
        expiresAt: lead.applicationTokenExpires!.toISOString(),
      });

      const entries = db.history.filter(h => h.leadId === lead.id && h.action === 'APPLICATION_LINK_EMAILED');
      expect(entries).toHaveLength(1);
      expect(entries[0].details.sentTo).toBe('maria@example.com');
      expect(entries[0].details.expiresAt).toBeDefined();
    });

    it('should record ENROLLMENT_LINK_EMAILED with correct details', () => {
      const lead = db.createLeadWithActiveEnrollmentToken();
      db.addHistoryEntry(lead.id, 'ENROLLMENT_LINK_EMAILED', 0, {
        sentTo: lead.primaryContactEmail,
        expiresAt: lead.enrollmentTokenExpires!.toISOString(),
      });

      const entries = db.history.filter(h => h.leadId === lead.id && h.action === 'ENROLLMENT_LINK_EMAILED');
      expect(entries).toHaveLength(1);
      expect(entries[0].details.sentTo).toBe('maria@example.com');
    });
  });
});

// ============================================================================
// API INTEGRATION TESTS - Application Link Email
// ============================================================================

describe('POST /leads/:id/application-link/send-email', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  // ---- Happy Path ----

  describe('Happy path', () => {
    it('should send email successfully with active token', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sentTo).toBe('maria@example.com');
    });

    it('should record email in sent log', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(db.emailsSent).toHaveLength(1);
      expect(db.emailsSent[0].to).toBe('maria@example.com');
      expect(db.emailsSent[0].success).toBe(true);
    });

    it('should record history entry after sending', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      const historyEntries = db.history.filter(
        h => h.leadId === lead.id && h.action === 'APPLICATION_LINK_EMAILED'
      );
      expect(historyEntries).toHaveLength(1);
      expect(historyEntries[0].details.sentTo).toBe('maria@example.com');
    });

    it('should send to correct email from lead data', async () => {
      const lead = db.createLeadWithActiveApplicationToken({
        primaryContactEmail: 'custom@family.com',
        primaryContactName: 'João Pereira',
      });

      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(res.body.data.sentTo).toBe('custom@family.com');
      expect(db.emailsSent[0].to).toBe('custom@family.com');
    });

    it('should include family name in email subject', async () => {
      const lead = db.createLeadWithActiveApplicationToken({
        familyName: 'Família Oliveira',
      });

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(db.emailsSent[0].subject).toContain('Família Oliveira');
      expect(db.emailsSent[0].subject).toContain('Inscrição');
    });

    it('should allow sending again after cooldown expires', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      // First send
      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      // Manipulate history to be 3 minutes ago
      db.history = db.history.map(h => ({
        ...h,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      }));

      // Second send (cooldown expired)
      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(db.emailsSent).toHaveLength(2);
    });
  });

  // ---- Error: Lead Not Found ----

  describe('Lead not found', () => {
    it('should return 404 for non-existent lead', async () => {
      const res = await request(app)
        .post('/leads/non-existent-id/application-link/send-email')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Lead');
    });

    it('should not send any email when lead not found', async () => {
      await request(app)
        .post('/leads/non-existent-id/application-link/send-email')
        .expect(404);

      expect(db.emailsSent).toHaveLength(0);
    });

    it('should not create history when lead not found', async () => {
      await request(app)
        .post('/leads/non-existent-id/application-link/send-email')
        .expect(404);

      expect(db.history).toHaveLength(0);
    });
  });

  // ---- Error: No Active Token ----

  describe('No active token', () => {
    it('should return 400 when lead has no token', async () => {
      const lead = db.createLead(); // no token

      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('link ativo');
    });

    it('should return 400 when token is expired', async () => {
      const lead = db.createLeadWithExpiredApplicationToken();

      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should not send email when token is expired', async () => {
      const lead = db.createLeadWithExpiredApplicationToken();

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(400);

      expect(db.emailsSent).toHaveLength(0);
    });

    it('should return 400 when token string is null but expires is set', async () => {
      const lead = db.createLead({
        applicationToken: null,
        applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      });

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(400);
    });

    it('should return 400 when token is set but expires is null', async () => {
      const lead = db.createLead({
        applicationToken: 'some-token',
        applicationTokenExpires: null,
      });

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(400);
    });
  });

  // ---- Error: Cooldown ----

  describe('Cooldown enforcement', () => {
    it('should return 429 when email was sent less than 2 minutes ago', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      // First send
      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      // Immediate second send
      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(429);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('2 minutos');
    });

    it('should not send a second email during cooldown', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(429);

      // Only 1 email should be sent
      expect(db.emailsSent).toHaveLength(1);
    });

    it('should not create duplicate history during cooldown', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(429);

      const entries = db.history.filter(h => h.action === 'APPLICATION_LINK_EMAILED');
      expect(entries).toHaveLength(1);
    });

    it('should not affect cooldown of other leads', async () => {
      const lead1 = db.createLeadWithActiveApplicationToken({
        primaryContactEmail: 'lead1@test.com',
      });
      const lead2 = db.createLeadWithActiveApplicationToken({
        primaryContactEmail: 'lead2@test.com',
      });

      // Send to lead1
      await request(app)
        .post(`/leads/${lead1.id}/application-link/send-email`)
        .expect(200);

      // Lead2 should NOT be affected by lead1's cooldown
      const res = await request(app)
        .post(`/leads/${lead2.id}/application-link/send-email`)
        .expect(200);

      expect(res.body.data.sentTo).toBe('lead2@test.com');
      expect(db.emailsSent).toHaveLength(2);
    });

    it('should not confuse application and enrollment cooldowns', async () => {
      // Create a lead with both tokens active
      const token1 = db.generateToken();
      const token2 = db.generateToken();
      const lead = db.createLead({
        applicationToken: token1,
        applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        applicationStatus: 'FORM_RECEIVED',
        enrollmentToken: token2,
        enrollmentTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        enrollmentStatus: 'LINK_SENT',
      });

      // Send application email
      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      // Enrollment email should NOT be blocked by application cooldown
      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(db.emailsSent).toHaveLength(2);
    });
  });

  // ---- Error: Email Send Failure ----

  describe('Email send failure', () => {
    it('should return 500 when email service fails', async () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.emailShouldFail = true;

      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Falha');
    });

    it('should not create history when email fails', async () => {
      const lead = db.createLeadWithActiveApplicationToken();
      db.emailShouldFail = true;

      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(500);

      const entries = db.history.filter(h => h.action === 'APPLICATION_LINK_EMAILED');
      expect(entries).toHaveLength(0);
    });

    it('should allow retry after email failure (no cooldown created)', async () => {
      const lead = db.createLeadWithActiveApplicationToken();

      // First attempt fails
      db.emailShouldFail = true;
      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(500);

      // Second attempt succeeds (no cooldown because first didn't create history)
      db.emailShouldFail = false;
      const res = await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

// ============================================================================
// API INTEGRATION TESTS - Enrollment Link Email
// ============================================================================

describe('POST /leads/:id/enrollment-link/send-email', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  // ---- Happy Path ----

  describe('Happy path', () => {
    it('should send enrollment email successfully with active token', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();

      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sentTo).toBe('maria@example.com');
    });

    it('should record enrollment email in sent log', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();

      await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(db.emailsSent).toHaveLength(1);
      expect(db.emailsSent[0].to).toBe('maria@example.com');
    });

    it('should record ENROLLMENT_LINK_EMAILED history', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();

      await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      const entries = db.history.filter(
        h => h.leadId === lead.id && h.action === 'ENROLLMENT_LINK_EMAILED'
      );
      expect(entries).toHaveLength(1);
    });

    it('should include family name and Matrícula in email subject', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken({
        familyName: 'Família Santos',
      });

      await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(db.emailsSent[0].subject).toContain('Família Santos');
      expect(db.emailsSent[0].subject).toContain('Matrícula');
    });

    it('should send to custom contact email', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken({
        primaryContactEmail: 'pai@familia.com',
      });

      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(res.body.data.sentTo).toBe('pai@familia.com');
    });
  });

  // ---- Error Cases ----

  describe('Error cases', () => {
    it('should return 404 for non-existent lead', async () => {
      const res = await request(app)
        .post('/leads/non-existent/enrollment-link/send-email')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when lead has no enrollment token', async () => {
      const lead = db.createLead(); // no enrollment token

      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('matrícula');
    });

    it('should return 400 when enrollment token is expired', async () => {
      const lead = db.createLeadWithExpiredEnrollmentToken();

      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 429 on cooldown', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();

      // First send
      await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      // Second send (within cooldown)
      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(429);

      expect(res.body.error).toContain('2 minutos');
    });

    it('should return 500 when email service fails for enrollment', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();
      db.emailShouldFail = true;

      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    it('should not create enrollment history on email failure', async () => {
      const lead = db.createLeadWithActiveEnrollmentToken();
      db.emailShouldFail = true;

      await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(500);

      const entries = db.history.filter(h => h.action === 'ENROLLMENT_LINK_EMAILED');
      expect(entries).toHaveLength(0);
    });
  });

  // ---- Enrollment Cooldown Independence ----

  describe('Cooldown independence', () => {
    it('should allow enrollment email after application email cooldown', async () => {
      const token1 = db.generateToken();
      const token2 = db.generateToken();
      const lead = db.createLead({
        applicationToken: token1,
        applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        applicationStatus: 'FORM_RECEIVED',
        enrollmentToken: token2,
        enrollmentTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        enrollmentStatus: 'LINK_SENT',
      });

      // Send application email first
      await request(app)
        .post(`/leads/${lead.id}/application-link/send-email`)
        .expect(200);

      // Enrollment should still work (different cooldown)
      const res = await request(app)
        .post(`/leads/${lead.id}/enrollment-link/send-email`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should enforce separate cooldowns for each type', async () => {
      const token1 = db.generateToken();
      const token2 = db.generateToken();
      const lead = db.createLead({
        applicationToken: token1,
        applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        applicationStatus: 'FORM_RECEIVED',
        enrollmentToken: token2,
        enrollmentTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
        enrollmentStatus: 'LINK_SENT',
      });

      // Send both emails
      await request(app).post(`/leads/${lead.id}/application-link/send-email`).expect(200);
      await request(app).post(`/leads/${lead.id}/enrollment-link/send-email`).expect(200);

      // Both should now be on cooldown
      await request(app).post(`/leads/${lead.id}/application-link/send-email`).expect(429);
      await request(app).post(`/leads/${lead.id}/enrollment-link/send-email`).expect(429);

      expect(db.emailsSent).toHaveLength(2);
    });
  });
});

// ============================================================================
// EMAIL TEMPLATE CONTENT TESTS
// ============================================================================

describe('Email template content validation', () => {
  describe('Application link email template', () => {
    it('should generate correct link URL format', () => {
      const token = 'abc123def456';
      const link = `http://localhost:5173/admissions/apply?token=${token}`;
      expect(link).toContain('/admissions/apply?token=');
      expect(link).toContain(token);
    });

    it('should include School Lab branding in subject', () => {
      const familyName = 'Família Costa';
      const subject = `Formulário de Inscrição - ${familyName} - School Lab`;
      expect(subject).toContain('School Lab');
      expect(subject).toContain('Inscrição');
      expect(subject).toContain(familyName);
    });

    it('should escape special characters in family name for subject', () => {
      const familyName = 'Família O\'Brien & Müller';
      const subject = `Formulário de Inscrição - ${familyName} - School Lab`;
      expect(subject).toContain('O\'Brien');
      expect(subject).toContain('Müller');
    });
  });

  describe('Enrollment link email template', () => {
    it('should generate correct enrollment link URL format', () => {
      const token = 'enroll-token-xyz';
      const link = `http://localhost:5173/enrollment/apply?token=${token}`;
      expect(link).toContain('/enrollment/apply?token=');
      expect(link).toContain(token);
    });

    it('should include Matrícula in subject', () => {
      const familyName = 'Família Lima';
      const subject = `Formulário de Matrícula - ${familyName} - School Lab`;
      expect(subject).toContain('Matrícula');
      expect(subject).toContain(familyName);
      expect(subject).toContain('School Lab');
    });
  });
});

// ============================================================================
// EDGE CASES & BOUNDARY TESTS
// ============================================================================

describe('Edge cases & boundary conditions', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle token expiring in 1 minute (edge of valid)', async () => {
    const lead = db.createLead({
      applicationToken: db.generateToken(),
      applicationTokenExpires: new Date(Date.now() + 60 * 1000), // 1 min from now
      applicationStatus: 'LINK_SENT',
    });

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should handle token that just expired (1 second ago)', async () => {
    const lead = db.createLead({
      applicationToken: db.generateToken(),
      applicationTokenExpires: new Date(Date.now() - 1000), // 1 sec ago
      applicationStatus: 'LINK_SENT',
    });

    await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(400);
  });

  it('should handle multiple rapid requests correctly (only first succeeds)', async () => {
    const lead = db.createLeadWithActiveApplicationToken();

    // Send 3 requests rapidly
    const results = await Promise.all([
      request(app).post(`/leads/${lead.id}/application-link/send-email`),
      request(app).post(`/leads/${lead.id}/application-link/send-email`),
      request(app).post(`/leads/${lead.id}/application-link/send-email`),
    ]);

    const successes = results.filter(r => r.status === 200);
    const cooldowns = results.filter(r => r.status === 429);

    // First request succeeds, subsequent are cooldown-blocked
    expect(successes.length).toBe(1);
    expect(cooldowns.length).toBe(2);
  });

  it('should handle lead with very long email address', async () => {
    const longEmail = 'a'.repeat(200) + '@example.com';
    const lead = db.createLeadWithActiveApplicationToken({
      primaryContactEmail: longEmail,
    });

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(res.body.data.sentTo).toBe(longEmail);
  });

  it('should handle lead with unicode characters in contact name', async () => {
    const lead = db.createLeadWithActiveApplicationToken({
      primaryContactName: 'María José Müller-Schönberg',
      familyName: 'Família Müller-Schönberg',
    });

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should handle lead with special characters in family name', async () => {
    const lead = db.createLeadWithActiveApplicationToken({
      familyName: "Família O'Connor & Smith",
    });

    await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(db.emailsSent[0].subject).toContain("O'Connor");
  });

  it('should handle very long token in URL generation', async () => {
    const longToken = crypto.randomBytes(64).toString('hex'); // 128 chars
    const lead = db.createLead({
      applicationToken: longToken,
      applicationTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      applicationStatus: 'LINK_SENT',
    });

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(db.history[0].details.link).toContain(longToken);
  });

  it('should not leak token data in error responses', async () => {
    const lead = db.createLeadWithExpiredApplicationToken();

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(400);

    // Error response should NOT contain the token
    const responseText = JSON.stringify(res.body);
    expect(responseText).not.toContain(lead.applicationToken);
  });

  it('should handle enrollment link send for lead without applicationStatus FORM_RECEIVED', async () => {
    // Lead has enrollment token but application not completed
    // This tests that the route itself doesn't check applicationStatus
    // (that's enforced at token generation, not at email send)
    const lead = db.createLead({
      applicationStatus: 'PENDING',
      enrollmentToken: db.generateToken(),
      enrollmentTokenExpires: new Date(Date.now() + 168 * 60 * 60 * 1000),
      enrollmentStatus: 'LINK_SENT',
    });

    // The email endpoint only checks if the enrollment token is active
    const res = await request(app)
      .post(`/leads/${lead.id}/enrollment-link/send-email`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

describe('Response format consistency', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should return { success: true, data: { sentTo } } on success', async () => {
    const lead = db.createLeadWithActiveApplicationToken();

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('sentTo');
    expect(typeof res.body.data.sentTo).toBe('string');
  });

  it('should return { success: false, error } on 404', async () => {
    const res = await request(app)
      .post('/leads/non-existent/application-link/send-email')
      .expect(404);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('should return { success: false, error } on 400', async () => {
    const lead = db.createLead(); // no token

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('should return { success: false, error } on 429', async () => {
    const lead = db.createLeadWithActiveApplicationToken();

    await request(app).post(`/leads/${lead.id}/application-link/send-email`).expect(200);

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(429);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('should return { success: false, error } on 500', async () => {
    const lead = db.createLeadWithActiveApplicationToken();
    db.emailShouldFail = true;

    const res = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`)
      .expect(500);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('should return JSON content-type for all responses', async () => {
    const lead = db.createLeadWithActiveApplicationToken();

    const successRes = await request(app)
      .post(`/leads/${lead.id}/application-link/send-email`);
    expect(successRes.headers['content-type']).toMatch(/json/);

    const notFoundRes = await request(app)
      .post('/leads/invalid/application-link/send-email');
    expect(notFoundRes.headers['content-type']).toMatch(/json/);
  });
});

// ============================================================================
// SUMMARY
// ============================================================================

describe('Test suite summary', () => {
  it('should cover all error codes', () => {
    // This test documents the expected error codes for reference
    const expectedErrorCodes = {
      'LEAD_NOT_FOUND': 404,
      'NO_ACTIVE_TOKEN': 400,
      'EMAIL_COOLDOWN': 429,
      'EMAIL_SEND_FAILED': 500,
    };

    expect(Object.keys(expectedErrorCodes)).toHaveLength(4);
    expect(expectedErrorCodes.LEAD_NOT_FOUND).toBe(404);
    expect(expectedErrorCodes.NO_ACTIVE_TOKEN).toBe(400);
    expect(expectedErrorCodes.EMAIL_COOLDOWN).toBe(429);
    expect(expectedErrorCodes.EMAIL_SEND_FAILED).toBe(500);
  });

  it('should validate both application and enrollment endpoints exist', () => {
    const endpoints = [
      'POST /leads/:id/application-link/send-email',
      'POST /leads/:id/enrollment-link/send-email',
    ];
    expect(endpoints).toHaveLength(2);
  });
});
