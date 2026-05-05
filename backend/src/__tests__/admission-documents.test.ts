/**
 * Admission Documents — Per-Child (childIndex) Tests
 *
 * E2E-style tests for the childIndex feature that ensures documents
 * uploaded in the admission form are associated to the correct child.
 *
 * Covers:
 * 1. Upload API — accepts and persists childIndex
 * 2. Prefill API — returns childIndex in document list
 * 3. Form submission — resolves childIndex → childId after creating LeadChild records
 * 4. Frontend logic — per-child document filtering and validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Router } from 'express';

// ============================================================================
// Types
// ============================================================================

interface MockDocument {
  id: string;
  leadId: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  uploadedVia: string;
  childId: string | null;
  childIndex: number | null;
}

interface MockChild {
  id: string;
  leadId: string;
  fullName: string;
  desiredGrade: string;
}

// ============================================================================
// Mock Router — simulates public.routes.ts upload + prefill + submit
// ============================================================================

function createAdmissionTestRouter() {
  const router = Router();

  const mockLeads = new Map<string, any>();
  const mockDocuments = new Map<string, MockDocument>();
  const mockChildren = new Map<string, MockChild>();

  // Seed a valid lead
  mockLeads.set('valid-token', {
    id: 'lead-1',
    applicationToken: 'valid-token',
    applicationTokenExpires: new Date(Date.now() + 86400000),
    applicationStatus: 'LINK_SENT',
    formSubmissionCount: 0,
  });

  mockLeads.set('expired-token', {
    id: 'lead-2',
    applicationToken: 'expired-token',
    applicationTokenExpires: new Date(Date.now() - 86400000),
    applicationStatus: 'LINK_SENT',
    formSubmissionCount: 0,
  });

  let docCounter = 0;

  // ------------------------------------------------------------------
  // POST /application/:token/documents — Upload with childIndex
  // ------------------------------------------------------------------
  router.post('/application/:token/documents', express.json(), (req, res) => {
    const { token } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    const { documentType, childIndex } = req.body;

    docCounter++;
    const doc: MockDocument = {
      id: `doc-${docCounter}`,
      leadId: lead.id,
      name: `file-${docCounter}.pdf`,
      type: documentType || 'OTHER',
      url: `https://storage.example.com/doc-${docCounter}.pdf`,
      size: 1024,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'FAMILY',
      uploadedVia: 'PUBLIC_FORM',
      childId: null,
      childIndex: childIndex != null ? parseInt(childIndex) : null,
    };

    mockDocuments.set(doc.id, doc);

    return res.status(201).json({ success: true, data: [doc] });
  });

  // ------------------------------------------------------------------
  // GET /application/:token — Prefill (returns documents with childIndex)
  // ------------------------------------------------------------------
  router.get('/application/:token', (req, res) => {
    const { token } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    const documents = Array.from(mockDocuments.values())
      .filter(d => d.leadId === lead.id)
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        childIndex: doc.childIndex,
      }));

    return res.json({
      success: true,
      data: {
        leadCode: 'ADM-001',
        documents,
      },
    });
  });

  // ------------------------------------------------------------------
  // POST /application/:token/submit — Form submission (resolves childIndex → childId)
  // ------------------------------------------------------------------
  router.post('/application/:token/submit', express.json(), (req, res) => {
    const { token } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum aluno informado' });
    }

    // Simulate creating LeadChild records (like admissions.service.ts)
    const createdStudents: MockChild[] = [];
    for (let i = 0; i < students.length; i++) {
      const child: MockChild = {
        id: `child-${i + 1}`,
        leadId: lead.id,
        fullName: students[i].fullName,
        desiredGrade: students[i].desiredGrade,
      };
      mockChildren.set(child.id, child);
      createdStudents.push(child);
    }

    // Resolve childIndex → childId (the core logic we're testing)
    for (let i = 0; i < createdStudents.length; i++) {
      for (const doc of mockDocuments.values()) {
        if (doc.leadId === lead.id && doc.childIndex === i) {
          doc.childId = createdStudents[i].id;
        }
      }
    }

    lead.formSubmissionCount++;

    return res.status(200).json({
      success: true,
      message: 'Formulário enviado com sucesso',
      data: {
        leadCode: 'ADM-001',
        children: createdStudents,
      },
    });
  });

  // ------------------------------------------------------------------
  // GET /application/:token/documents — List documents (for verification)
  // ------------------------------------------------------------------
  router.get('/application/:token/documents', (req, res) => {
    const { token } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido' });
    }

    const documents = Array.from(mockDocuments.values())
      .filter(d => d.leadId === lead.id);

    return res.json({ success: true, data: documents });
  });

  // ------------------------------------------------------------------
  // DELETE /application/:token/documents/:documentId
  // ------------------------------------------------------------------
  router.delete('/application/:token/documents/:documentId', (req, res) => {
    const { token, documentId } = req.params;
    const lead = mockLeads.get(token);

    if (!lead) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const doc = mockDocuments.get(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }

    if (doc.leadId !== lead.id) {
      return res.status(403).json({ success: false, error: 'Sem permissao' });
    }

    mockDocuments.delete(documentId);
    return res.json({ success: true, message: 'Documento removido' });
  });

  return router;
}

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/public', createAdmissionTestRouter());
  return app;
}

// ============================================================================
// 1. UPLOAD API — childIndex persistence
// ============================================================================

describe('Admission Document Upload — childIndex', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should save childIndex=0 when uploading for the first child', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].childIndex).toBe(0);
    expect(res.body.data[0].type).toBe('SCHOOL_TRANSCRIPT');
  });

  it('should save childIndex=1 when uploading for the second child', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' })
      .expect(201);

    expect(res.body.data[0].childIndex).toBe(1);
  });

  it('should save childIndex=2 when uploading for the third child', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'PERFORMANCE_REPORT', childIndex: '2' })
      .expect(201);

    expect(res.body.data[0].childIndex).toBe(2);
    expect(res.body.data[0].type).toBe('PERFORMANCE_REPORT');
  });

  it('should save childIndex=null when childIndex is not provided', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT' })
      .expect(201);

    expect(res.body.data[0].childIndex).toBeNull();
  });

  it('should parse string childIndex "0" correctly (not falsy)', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(201);

    // childIndex=0 must NOT become null (common bug: if(childIndex) is falsy for 0)
    expect(res.body.data[0].childIndex).toBe(0);
    expect(res.body.data[0].childIndex).not.toBeNull();
  });

  it('should reject upload with expired token', async () => {
    const res = await request(app)
      .post('/public/application/expired-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(410);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should reject upload with invalid token', async () => {
    await request(app)
      .post('/public/application/nonexistent/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(404);
  });
});

// ============================================================================
// 2. PREFILL API — childIndex returned in document list
// ============================================================================

describe('Admission Prefill — childIndex in documents', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return childIndex in prefill documents', async () => {
    // Upload a doc with childIndex=0
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(201);

    // Fetch prefill
    const res = await request(app)
      .get('/public/application/valid-token')
      .expect(200);

    expect(res.body.data.documents).toHaveLength(1);
    expect(res.body.data.documents[0].childIndex).toBe(0);
  });

  it('should return multiple documents with correct childIndex per child', async () => {
    // Upload docs for 3 different children
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });

    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'PERFORMANCE_REPORT', childIndex: '2' });

    const res = await request(app)
      .get('/public/application/valid-token')
      .expect(200);

    const docs = res.body.data.documents;
    expect(docs).toHaveLength(3);

    const child0Docs = docs.filter((d: any) => d.childIndex === 0);
    const child1Docs = docs.filter((d: any) => d.childIndex === 1);
    const child2Docs = docs.filter((d: any) => d.childIndex === 2);

    expect(child0Docs).toHaveLength(1);
    expect(child0Docs[0].type).toBe('SCHOOL_TRANSCRIPT');

    expect(child1Docs).toHaveLength(1);
    expect(child1Docs[0].type).toBe('SCHOOL_TRANSCRIPT');

    expect(child2Docs).toHaveLength(1);
    expect(child2Docs[0].type).toBe('PERFORMANCE_REPORT');
  });

  it('should return null childIndex for legacy documents (uploaded without childIndex)', async () => {
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT' }); // no childIndex

    const res = await request(app)
      .get('/public/application/valid-token')
      .expect(200);

    expect(res.body.data.documents[0].childIndex).toBeNull();
  });
});

// ============================================================================
// 3. FORM SUBMISSION — childIndex → childId resolution
// ============================================================================

describe('Admission Form Submit — childIndex → childId resolution', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should associate documents to correct children after form submission', async () => {
    // Upload transcript for child 0 (Alice)
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });

    // Upload transcript for child 1 (Bob)
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    // Submit form with 2 students
    const submitRes = await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [
          { fullName: 'Alice Doe', desiredGrade: 'GRADE_3' },
          { fullName: 'Bob Doe', desiredGrade: 'GRADE_5' },
        ],
      })
      .expect(200);

    expect(submitRes.body.success).toBe(true);

    // Verify documents are now associated to children
    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const docs = docsRes.body.data;
    expect(docs).toHaveLength(2);

    const aliceDoc = docs.find((d: any) => d.childIndex === 0);
    const bobDoc = docs.find((d: any) => d.childIndex === 1);

    expect(aliceDoc.childId).toBe('child-1'); // Alice's LeadChild ID
    expect(bobDoc.childId).toBe('child-2');   // Bob's LeadChild ID
  });

  it('should correctly resolve 3 children with mixed document types', async () => {
    // Child 0: Kindergarten — PERFORMANCE_REPORT
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'PERFORMANCE_REPORT', childIndex: '0' });

    // Child 1: Grade 3 — SCHOOL_TRANSCRIPT
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    // Child 2: Grade 5 — SCHOOL_TRANSCRIPT
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '2' });

    // Submit
    await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [
          { fullName: 'Carlos', desiredGrade: 'PRE_K' },
          { fullName: 'Diana', desiredGrade: 'GRADE_3' },
          { fullName: 'Eduardo', desiredGrade: 'GRADE_5' },
        ],
      })
      .expect(200);

    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const docs = docsRes.body.data;

    expect(docs.find((d: any) => d.childIndex === 0).childId).toBe('child-1'); // Carlos
    expect(docs.find((d: any) => d.childIndex === 1).childId).toBe('child-2'); // Diana
    expect(docs.find((d: any) => d.childIndex === 2).childId).toBe('child-3'); // Eduardo
  });

  it('should NOT associate documents without childIndex to any child', async () => {
    // Upload a doc without childIndex (legacy behavior)
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'OTHER' });

    // Submit
    await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [{ fullName: 'Alice', desiredGrade: 'GRADE_3' }],
      })
      .expect(200);

    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const doc = docsRes.body.data[0];
    expect(doc.childIndex).toBeNull();
    expect(doc.childId).toBeNull();
  });

  it('should handle multiple documents per child correctly', async () => {
    // Child 0 uploads 2 documents
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'PERFORMANCE_REPORT', childIndex: '0' });

    // Child 1 uploads 1 document
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    // Submit
    await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [
          { fullName: 'Alice', desiredGrade: 'GRADE_3' },
          { fullName: 'Bob', desiredGrade: 'GRADE_5' },
        ],
      })
      .expect(200);

    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const docs = docsRes.body.data;
    expect(docs).toHaveLength(3);

    const aliceDocs = docs.filter((d: any) => d.childId === 'child-1');
    const bobDocs = docs.filter((d: any) => d.childId === 'child-2');

    expect(aliceDocs).toHaveLength(2);
    expect(bobDocs).toHaveLength(1);
  });

  it('should reject submission without students', async () => {
    const res = await request(app)
      .post('/public/application/valid-token/submit')
      .send({ students: [] })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

// ============================================================================
// 4. DOCUMENT DELETION — preserves other children's documents
// ============================================================================

describe('Document Deletion — per-child isolation', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should delete only the specified document, leaving other children docs intact', async () => {
    // Upload doc for child 0
    const res0 = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });
    const docId0 = res0.body.data[0].id;

    // Upload doc for child 1
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    // Delete child 0's document
    await request(app)
      .delete(`/public/application/valid-token/documents/${docId0}`)
      .expect(200);

    // Verify only child 1's doc remains
    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    expect(docsRes.body.data).toHaveLength(1);
    expect(docsRes.body.data[0].childIndex).toBe(1);
  });
});

// ============================================================================
// 5. FRONTEND LOGIC — per-child document filtering
// ============================================================================

describe('Frontend Logic — per-child document filtering', () => {
  // Simulates the frontend filtering logic from AdmissionFormPage.tsx

  interface FrontendDoc {
    id: string;
    type: string;
    childIndex: number | null;
    name: string;
  }

  const makeDocs = (): FrontendDoc[] => [
    { id: 'doc-1', type: 'SCHOOL_TRANSCRIPT', childIndex: 0, name: 'alice-transcript.pdf' },
    { id: 'doc-2', type: 'SCHOOL_TRANSCRIPT', childIndex: 1, name: 'bob-transcript.pdf' },
    { id: 'doc-3', type: 'PERFORMANCE_REPORT', childIndex: 2, name: 'carlos-report.pdf' },
    { id: 'doc-4', type: 'SCHOOL_TRANSCRIPT', childIndex: 0, name: 'alice-extra.pdf' },
    { id: 'doc-5', type: 'OTHER', childIndex: null, name: 'general-doc.pdf' },
  ];

  it('should filter documents by type AND childIndex (activeStudentTab=0)', () => {
    const uploadedDocuments = makeDocs();
    const activeStudentTab = 0;
    const expectedDocumentType = 'SCHOOL_TRANSCRIPT';

    const relevantDocuments = uploadedDocuments.filter(
      doc => doc.type === expectedDocumentType && doc.childIndex === activeStudentTab
    );

    expect(relevantDocuments).toHaveLength(2);
    expect(relevantDocuments.map(d => d.name)).toEqual(['alice-transcript.pdf', 'alice-extra.pdf']);
  });

  it('should filter documents for child 1 (activeStudentTab=1)', () => {
    const uploadedDocuments = makeDocs();
    const activeStudentTab = 1;
    const expectedDocumentType = 'SCHOOL_TRANSCRIPT';

    const relevantDocuments = uploadedDocuments.filter(
      doc => doc.type === expectedDocumentType && doc.childIndex === activeStudentTab
    );

    expect(relevantDocuments).toHaveLength(1);
    expect(relevantDocuments[0].name).toBe('bob-transcript.pdf');
  });

  it('should filter documents for child 2 with different document type', () => {
    const uploadedDocuments = makeDocs();
    const activeStudentTab = 2;
    const expectedDocumentType = 'PERFORMANCE_REPORT';

    const relevantDocuments = uploadedDocuments.filter(
      doc => doc.type === expectedDocumentType && doc.childIndex === activeStudentTab
    );

    expect(relevantDocuments).toHaveLength(1);
    expect(relevantDocuments[0].name).toBe('carlos-report.pdf');
  });

  it('should return empty when child has no documents of that type', () => {
    const uploadedDocuments = makeDocs();
    const activeStudentTab = 1;
    const expectedDocumentType = 'PERFORMANCE_REPORT'; // child 1 has TRANSCRIPT, not REPORT

    const relevantDocuments = uploadedDocuments.filter(
      doc => doc.type === expectedDocumentType && doc.childIndex === activeStudentTab
    );

    expect(relevantDocuments).toHaveLength(0);
  });

  it('should NOT show documents with childIndex=null in any child tab', () => {
    const uploadedDocuments = makeDocs();

    for (let tab = 0; tab < 3; tab++) {
      const relevantDocuments = uploadedDocuments.filter(
        doc => doc.type === 'OTHER' && doc.childIndex === tab
      );
      expect(relevantDocuments).toHaveLength(0);
    }
  });

  it('should NOT leak documents between children (cross-contamination check)', () => {
    const uploadedDocuments = makeDocs();

    // Child 0 should NOT see child 1's docs
    const child0Docs = uploadedDocuments.filter(
      doc => doc.type === 'SCHOOL_TRANSCRIPT' && doc.childIndex === 0
    );
    expect(child0Docs.every(d => d.name.startsWith('alice'))).toBe(true);

    // Child 1 should NOT see child 0's docs
    const child1Docs = uploadedDocuments.filter(
      doc => doc.type === 'SCHOOL_TRANSCRIPT' && doc.childIndex === 1
    );
    expect(child1Docs.every(d => d.name.startsWith('bob'))).toBe(true);
  });
});

// ============================================================================
// 6. FRONTEND LOGIC — per-child transcript validation
// ============================================================================

describe('Frontend Logic — per-child transcript validation', () => {
  // Simulates the validation logic from AdmissionFormPage.tsx

  interface FrontendDoc {
    id: string;
    type: string;
    childIndex: number | null;
  }

  // Mirror the grade helper functions from the frontend
  const FIRST_SCHOOL_GRADES = ['PRE_K', 'KINDER_1', 'KINDER_2', 'NURSERY'];
  const MAY_BE_FIRST_SCHOOL_GRADES = ['GRADE_1'];

  function isFirstSchoolGrade(grade: string): boolean {
    return FIRST_SCHOOL_GRADES.includes(grade);
  }

  function isMayBeFirstSchoolGrade(grade: string): boolean {
    return MAY_BE_FIRST_SCHOOL_GRADES.includes(grade);
  }

  /**
   * Replicate the Step 3 validation logic:
   * For each student whose grade requires a transcript,
   * check that there is at least one matching document with the correct childIndex.
   */
  function validateTranscriptsPerChild(
    students: Array<{ desiredGrade: string }>,
    uploadedDocuments: FrontendDoc[],
  ): { valid: boolean; missingChildIndex: number | null } {
    for (let i = 0; i < students.length; i++) {
      const grade = students[i].desiredGrade;
      if (!isFirstSchoolGrade(grade) && !isMayBeFirstSchoolGrade(grade)) {
        const hasTranscript = uploadedDocuments.some(
          doc => doc.type === 'SCHOOL_TRANSCRIPT' && doc.childIndex === i
        );
        if (!hasTranscript) {
          return { valid: false, missingChildIndex: i };
        }
      }
    }
    return { valid: true, missingChildIndex: null };
  }

  it('should pass when all eligible children have transcripts', () => {
    const students = [
      { desiredGrade: 'GRADE_3' },
      { desiredGrade: 'GRADE_5' },
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 0 },
      { id: '2', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 },
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(true);
    expect(result.missingChildIndex).toBeNull();
  });

  it('should fail when child 1 is missing a transcript', () => {
    const students = [
      { desiredGrade: 'GRADE_3' },
      { desiredGrade: 'GRADE_5' },
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 0 }, // only child 0 has it
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(false);
    expect(result.missingChildIndex).toBe(1);
  });

  it('should fail when child 0 is missing a transcript', () => {
    const students = [
      { desiredGrade: 'GRADE_3' },
      { desiredGrade: 'GRADE_5' },
    ];
    const docs: FrontendDoc[] = [
      { id: '2', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 }, // only child 1 has it
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(false);
    expect(result.missingChildIndex).toBe(0);
  });

  it('should skip validation for kindergarten children (PRE_K)', () => {
    const students = [
      { desiredGrade: 'PRE_K' },   // first school — no transcript needed
      { desiredGrade: 'GRADE_3' }, // needs transcript
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 },
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(true);
  });

  it('should skip validation for Grade 1 children (may be first school)', () => {
    const students = [
      { desiredGrade: 'GRADE_1' },  // may be first school — no transcript enforced
      { desiredGrade: 'GRADE_5' },  // needs transcript
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 },
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(true);
  });

  it('should pass when all children are kindergarten (no transcripts needed)', () => {
    const students = [
      { desiredGrade: 'PRE_K' },
      { desiredGrade: 'KINDER_1' },
      { desiredGrade: 'NURSERY' },
    ];
    const docs: FrontendDoc[] = []; // no docs at all

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(true);
  });

  it('should fail when 3 children need transcripts but only 2 have them', () => {
    const students = [
      { desiredGrade: 'GRADE_2' },
      { desiredGrade: 'GRADE_3' },
      { desiredGrade: 'GRADE_5' },
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 0 },
      { id: '2', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 },
      // child 2 missing!
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(false);
    expect(result.missingChildIndex).toBe(2);
  });

  it('should not accept PERFORMANCE_REPORT as a valid transcript for validation', () => {
    const students = [
      { desiredGrade: 'GRADE_3' }, // needs SCHOOL_TRANSCRIPT
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'PERFORMANCE_REPORT', childIndex: 0 }, // wrong type!
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(false);
    expect(result.missingChildIndex).toBe(0);
  });

  it('should not accept a transcript from another child as valid', () => {
    const students = [
      { desiredGrade: 'GRADE_3' },
      { desiredGrade: 'GRADE_5' },
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 0 }, // child 0 has it
      { id: '2', type: 'SCHOOL_TRANSCRIPT', childIndex: 0 }, // DUPLICATE for child 0, child 1 still missing
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(false);
    expect(result.missingChildIndex).toBe(1);
  });

  it('should handle mixed scenario: kindergarten + elementary children', () => {
    const students = [
      { desiredGrade: 'KINDER_2' }, // no transcript needed
      { desiredGrade: 'GRADE_3' },  // needs transcript
      { desiredGrade: 'PRE_K' },    // no transcript needed
      { desiredGrade: 'GRADE_7' },  // needs transcript
    ];
    const docs: FrontendDoc[] = [
      { id: '1', type: 'SCHOOL_TRANSCRIPT', childIndex: 1 }, // for GRADE_3 child
      { id: '2', type: 'SCHOOL_TRANSCRIPT', childIndex: 3 }, // for GRADE_7 child
    ];

    const result = validateTranscriptsPerChild(students, docs);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// 7. EDGE CASES — childIndex boundary conditions
// ============================================================================

describe('Edge Cases — childIndex boundary conditions', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should handle childIndex=0 distinctly from childIndex=null (falsy check)', async () => {
    // Upload with childIndex=0
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });

    // Upload without childIndex
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'OTHER' });

    const res = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const docs = res.body.data;
    const withIndex = docs.find((d: any) => d.childIndex === 0);
    const withoutIndex = docs.find((d: any) => d.childIndex === null);

    expect(withIndex).toBeDefined();
    expect(withoutIndex).toBeDefined();
    expect(withIndex.id).not.toBe(withoutIndex.id);
  });

  it('should handle uploading multiple documents for the same child', async () => {
    // Upload 3 docs for child 0
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/public/application/valid-token/documents')
        .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' });
    }

    const res = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    const child0Docs = res.body.data.filter((d: any) => d.childIndex === 0);
    expect(child0Docs).toHaveLength(3);
  });

  it('should correctly associate docs when only some children have uploads', async () => {
    // Only child 1 has a document (child 0 and 2 have none)
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' });

    // Submit with 3 students
    await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [
          { fullName: 'Alice', desiredGrade: 'PRE_K' },
          { fullName: 'Bob', desiredGrade: 'GRADE_3' },
          { fullName: 'Carlos', desiredGrade: 'PRE_K' },
        ],
      })
      .expect(200);

    const docsRes = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    expect(docsRes.body.data).toHaveLength(1);
    expect(docsRes.body.data[0].childIndex).toBe(1);
    expect(docsRes.body.data[0].childId).toBe('child-2'); // Bob is the 2nd child created
  });

  it('should handle the full e2e flow: upload → prefill → re-upload → submit → verify', async () => {
    // Step 1: Upload transcript for child 0
    const upload0 = await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(201);

    // Step 2: Upload transcript for child 1
    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '1' })
      .expect(201);

    // Step 3: Prefill — both docs should be there with correct childIndex
    const prefill = await request(app)
      .get('/public/application/valid-token')
      .expect(200);

    expect(prefill.body.data.documents).toHaveLength(2);
    expect(prefill.body.data.documents.some((d: any) => d.childIndex === 0)).toBe(true);
    expect(prefill.body.data.documents.some((d: any) => d.childIndex === 1)).toBe(true);

    // Step 4: Delete child 0's doc and re-upload
    await request(app)
      .delete(`/public/application/valid-token/documents/${upload0.body.data[0].id}`)
      .expect(200);

    await request(app)
      .post('/public/application/valid-token/documents')
      .send({ documentType: 'SCHOOL_TRANSCRIPT', childIndex: '0' })
      .expect(201);

    // Step 5: Submit form
    await request(app)
      .post('/public/application/valid-token/submit')
      .send({
        students: [
          { fullName: 'Alice', desiredGrade: 'GRADE_3' },
          { fullName: 'Bob', desiredGrade: 'GRADE_5' },
        ],
      })
      .expect(200);

    // Step 6: Verify all docs are properly associated
    const finalDocs = await request(app)
      .get('/public/application/valid-token/documents')
      .expect(200);

    expect(finalDocs.body.data).toHaveLength(2);

    const aliceDoc = finalDocs.body.data.find((d: any) => d.childIndex === 0);
    const bobDoc = finalDocs.body.data.find((d: any) => d.childIndex === 1);

    expect(aliceDoc.childId).toBe('child-1');
    expect(bobDoc.childId).toBe('child-2');
  });
});

// ============================================================================
// 8. childIndex PARSING — backend parseInt behavior
// ============================================================================

describe('childIndex parsing edge cases', () => {
  // Tests the parsing logic: childIndex != null ? parseInt(childIndex) : null

  it('should parse "0" as 0 (not null/falsy)', () => {
    const childIndex = '0';
    const parsed = childIndex != null ? parseInt(childIndex) : null;
    expect(parsed).toBe(0);
  });

  it('should parse "1" as 1', () => {
    const childIndex = '1';
    const parsed = childIndex != null ? parseInt(childIndex) : null;
    expect(parsed).toBe(1);
  });

  it('should parse "10" as 10 (double digit)', () => {
    const childIndex = '10';
    const parsed = childIndex != null ? parseInt(childIndex) : null;
    expect(parsed).toBe(10);
  });

  it('should return null when childIndex is undefined', () => {
    const childIndex = undefined;
    const parsed = childIndex != null ? parseInt(childIndex as any) : null;
    expect(parsed).toBeNull();
  });

  it('should return null when childIndex is null', () => {
    const childIndex = null;
    const parsed = childIndex != null ? parseInt(childIndex as any) : null;
    expect(parsed).toBeNull();
  });

  it('should handle numeric 0 (from JSON body, not FormData)', () => {
    const childIndex = 0;
    // childIndex != null is TRUE for 0, so parseInt(0) = 0
    const parsed = childIndex != null ? parseInt(childIndex as any) : null;
    expect(parsed).toBe(0);
  });
});
