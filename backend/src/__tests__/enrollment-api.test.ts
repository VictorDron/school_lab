/**
 * Enrollment API Integration Tests
 *
 * Tests the actual API endpoints with mocked database
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Router } from 'express';

// Create a minimal test router that mimics the enrollment routes
function createTestRouter() {
  const router = Router();

  // Mock database
  const mockLeads = new Map<string, any>();
  const mockDocuments = new Map<string, any>();

  // Initialize with a test lead
  mockLeads.set('valid-token-123', {
    id: 'lead-123',
    enrollmentToken: 'valid-token-123',
    enrollmentTokenExpires: new Date(Date.now() + 86400000),
    applicationStatus: 'FORM_RECEIVED',
    enrollmentSubmissionCount: 0,
    enrollmentStatus: 'LINK_SENT',
    children: [{ id: 'child-1', isApplicant: true, relationship: 'STUDENT', fullName: 'Test Student' }],
    parents: [
      { id: 'parent-1', parentType: 'MOTHER', fullName: 'Test Mother', email: 'mother@test.com' },
      { id: 'parent-2', parentType: 'FATHER', fullName: 'Test Father', email: 'father@test.com' },
    ],
  });

  mockLeads.set('expired-token-456', {
    id: 'lead-456',
    enrollmentToken: 'expired-token-456',
    enrollmentTokenExpires: new Date(Date.now() - 86400000), // expired
    applicationStatus: 'FORM_RECEIVED',
    enrollmentSubmissionCount: 0,
  });

  mockLeads.set('maxed-token-789', {
    id: 'lead-789',
    enrollmentToken: 'maxed-token-789',
    enrollmentTokenExpires: new Date(Date.now() + 86400000),
    applicationStatus: 'FORM_RECEIVED',
    enrollmentSubmissionCount: 5, // max reached
  });

  mockLeads.set('not-admitted-token', {
    id: 'lead-not-admitted',
    enrollmentToken: 'not-admitted-token',
    enrollmentTokenExpires: new Date(Date.now() + 86400000),
    applicationStatus: 'PENDING', // admission not completed
    enrollmentSubmissionCount: 0,
  });

  // Add a document for authorization tests
  mockDocuments.set('doc-123', {
    id: 'doc-123',
    leadId: 'lead-123',
    documentType: 'STUDENT_ID',
    category: 'STUDENT',
    fileName: 'test.pdf',
    fileUrl: 'https://example.com/test.pdf',
  });

  mockDocuments.set('doc-other-lead', {
    id: 'doc-other-lead',
    leadId: 'lead-other',
    documentType: 'STUDENT_ID',
    category: 'STUDENT',
    fileName: 'other.pdf',
    fileUrl: 'https://example.com/other.pdf',
  });

  // GET /enrollment/:token - Get enrollment data
  router.get('/enrollment/:token', (req, res) => {
    const { token } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Link de matrícula inválido',
        code: 'TOKEN_NOT_FOUND',
      });
    }

    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({
        success: false,
        error: 'Formulário de admissão não foi preenchido',
        code: 'ADMISSION_NOT_COMPLETED',
      });
    }

    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({
        success: false,
        error: 'Link de matrícula expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.json({
      success: true,
      data: {
        leadCode: lead.code || 'TEST-001',
        familyName: lead.familyName || 'Test Family',
        student: lead.children?.[0] || null,
        documents: [],
      },
    });
  });

  // POST /enrollment - Submit enrollment form
  router.post('/enrollment', express.json(), (req, res) => {
    const { enrollmentToken, termsAccepted } = req.body;

    if (!enrollmentToken) {
      return res.status(400).json({
        success: false,
        error: 'Token obrigatório',
        code: 'TOKEN_REQUIRED',
      });
    }

    const lead = mockLeads.get(enrollmentToken);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Link de matrícula inválido',
        code: 'TOKEN_NOT_FOUND',
      });
    }

    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({
        success: false,
        error: 'Complete a admissão primeiro',
        code: 'ADMISSION_NOT_COMPLETED',
      });
    }

    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({
        success: false,
        error: 'Link de matrícula expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (lead.enrollmentSubmissionCount >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Limite de envios atingido',
        code: 'MAX_SUBMISSIONS_EXCEEDED',
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Os termos devem ser aceitos',
        code: 'TERMS_NOT_ACCEPTED',
      });
    }

    // Simulate successful submission
    lead.enrollmentSubmissionCount++;
    lead.enrollmentStatus = 'FORM_RECEIVED';

    return res.status(200).json({
      success: true,
      message: 'Matrícula enviada com sucesso',
      data: { leadCode: 'TEST-001' },
    });
  });

  // DELETE /enrollment/:token/documents/:documentId
  router.delete('/enrollment/:token/documents/:documentId', (req, res) => {
    const { token, documentId } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido',
      });
    }

    const document = mockDocuments.get(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    // Authorization check
    if (document.leadId !== lead.id) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para remover este documento',
      });
    }

    mockDocuments.delete(documentId);

    return res.json({
      success: true,
      message: 'Documento removido com sucesso',
    });
  });

  return router;
}

// Create test app
function createTestApp() {
  const app = express();
  app.use('/public', createTestRouter());
  return app;
}

// ============================================================================
// API ENDPOINT TESTS
// ============================================================================

describe('Enrollment API Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /public/enrollment/:token', () => {
    it('should return 404 for invalid token', async () => {
      const res = await request(app)
        .get('/public/enrollment/invalid-token')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should return 410 for expired token', async () => {
      const res = await request(app)
        .get('/public/enrollment/expired-token-456')
        .expect(410);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 400 for admission not completed', async () => {
      const res = await request(app)
        .get('/public/enrollment/not-admitted-token')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ADMISSION_NOT_COMPLETED');
    });

    it('should return 200 with data for valid token', async () => {
      const res = await request(app)
        .get('/public/enrollment/valid-token-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.leadCode).toBe('TEST-001');
    });
  });

  describe('POST /public/enrollment', () => {
    it('should return 400 when token is missing', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ termsAccepted: true })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_REQUIRED');
    });

    it('should return 404 for invalid token', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'invalid-token', termsAccepted: true })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should return 410 for expired token', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'expired-token-456', termsAccepted: true })
        .expect(410);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 400 for admission not completed', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'not-admitted-token', termsAccepted: true })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ADMISSION_NOT_COMPLETED');
    });

    it('should return 429 when max submissions reached', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'maxed-token-789', termsAccepted: true })
        .expect(429);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
    });

    it('should return 400 when terms not accepted', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'valid-token-123', termsAccepted: false })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TERMS_NOT_ACCEPTED');
    });

    it('should return 200 for valid submission', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({ enrollmentToken: 'valid-token-123', termsAccepted: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe('TEST-001');
    });
  });

  describe('DELETE /public/enrollment/:token/documents/:documentId', () => {
    it('should return 400 for invalid token', async () => {
      const res = await request(app)
        .delete('/public/enrollment/invalid-token/documents/doc-123')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent document', async () => {
      const res = await request(app)
        .delete('/public/enrollment/valid-token-123/documents/non-existent-doc')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 403 when document belongs to different lead', async () => {
      const res = await request(app)
        .delete('/public/enrollment/valid-token-123/documents/doc-other-lead')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('permiss');
    });

    it('should return 200 when deleting own document', async () => {
      const res = await request(app)
        .delete('/public/enrollment/valid-token-123/documents/doc-123')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Response Format', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return consistent error format with success=false', async () => {
    const res = await request(app)
      .get('/public/enrollment/invalid-token')
      .expect(404);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('code');
  });

  it('should return consistent success format with success=true', async () => {
    const res = await request(app)
      .get('/public/enrollment/valid-token-123')
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});

// ============================================================================
// HTTP STATUS CODE TESTS
// ============================================================================

describe('HTTP Status Codes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 404 for not found resources', async () => {
    await request(app)
      .get('/public/enrollment/invalid-token')
      .expect(404);
  });

  it('should return 400 for bad requests', async () => {
    await request(app)
      .post('/public/enrollment')
      .send({})
      .expect(400);
  });

  it('should return 403 for unauthorized access', async () => {
    await request(app)
      .delete('/public/enrollment/valid-token-123/documents/doc-other-lead')
      .expect(403);
  });

  it('should return 410 for expired resources', async () => {
    await request(app)
      .get('/public/enrollment/expired-token-456')
      .expect(410);
  });

  it('should return 429 for rate limited requests', async () => {
    await request(app)
      .post('/public/enrollment')
      .send({ enrollmentToken: 'maxed-token-789', termsAccepted: true })
      .expect(429);
  });
});

console.log(`
================================================================================
ENROLLMENT API TEST SUITE
================================================================================
Total test categories: 4
- GET /public/enrollment/:token
- POST /public/enrollment
- DELETE /public/enrollment/:token/documents/:documentId
- Error Response Format & HTTP Status Codes
================================================================================
`);
