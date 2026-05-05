/**
 * E2E Admission Flow Tests
 *
 * Simulates the ADMISSION form flow end-to-end:
 *   1. Lead is created (CRM)
 *   2. Application token is generated & sent to family
 *   3. Family opens form → pre-fill data returned
 *   4. Family submits admission form (single child, multi-child, siblings)
 *   5. Re-submission (update) flow
 *   6. Document upload per child (childIndex)
 *   7. Validation error scenarios
 *   8. Legacy singular student format
 *   9. Complete admission journey
 *
 * Uses a mock in-memory database that simulates Prisma behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';

// ============================================================================
// MOCK IN-MEMORY DATABASE
// ============================================================================

interface MockChild {
  id: string;
  leadId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  desiredGrade: string;
  currentGrade?: string;
  currentSchool?: string;
  studentType: string;
  primaryLanguage: string;
  otherLanguages: string[];
  relationship: string;
  isApplicant: boolean;
  cpf?: string;
  specialNeeds?: string;
  nationality?: string;
}

interface MockParent {
  id: string;
  leadId: string;
  parentType: string;
  fullName: string;
  email: string;
  phone: string;
  cpf?: string;
  occupation?: string;
}

interface MockAddress {
  country: string;
  state?: string;
  city: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

interface MockAdmissionDocument {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  childIndex: number | null;
  uploadedAt: string;
}

interface MockLead {
  id: string;
  code: string;
  familyName: string;
  applicationToken: string | null;
  applicationTokenExpires: Date | null;
  applicationStatus: string;
  formSubmissionCount: number;
  enrollmentToken: string | null;
  enrollmentTokenExpires: Date | null;
  enrollmentStatus: string;
  children: MockChild[];
  parents: MockParent[];
  address: MockAddress | null;
  admissionDocuments: MockAdmissionDocument[];
}

// ============================================================================
// IN-MEMORY DB STORE
// ============================================================================

class MockDB {
  leads = new Map<string, MockLead>();
  private idCounter = 0;

  generateId() {
    return `mock-${++this.idCounter}-${Date.now()}`;
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  createLead(familyName: string): MockLead {
    const id = this.generateId();
    const code = `LEAD-${String(this.idCounter).padStart(4, '0')}`;
    const lead: MockLead = {
      id,
      code,
      familyName,
      applicationToken: null,
      applicationTokenExpires: null,
      applicationStatus: 'PENDING',
      formSubmissionCount: 0,
      enrollmentToken: null,
      enrollmentTokenExpires: null,
      enrollmentStatus: 'NOT_STARTED',
      children: [],
      parents: [],
      address: null,
      admissionDocuments: [],
    };
    this.leads.set(id, lead);
    return lead;
  }

  generateApplicationToken(leadId: string): string {
    const lead = this.leads.get(leadId)!;
    const token = this.generateToken();
    lead.applicationToken = token;
    lead.applicationTokenExpires = new Date(Date.now() + 168 * 60 * 60 * 1000);
    lead.applicationStatus = 'LINK_SENT';
    return token;
  }

  generateEnrollmentToken(leadId: string): string {
    const lead = this.leads.get(leadId)!;
    const token = this.generateToken();
    lead.enrollmentToken = token;
    lead.enrollmentTokenExpires = new Date(Date.now() + 168 * 60 * 60 * 1000);
    lead.enrollmentStatus = 'LINK_SENT';
    return token;
  }

  findLeadByApplicationToken(token: string): MockLead | undefined {
    for (const lead of this.leads.values()) {
      if (lead.applicationToken === token) return lead;
    }
    return undefined;
  }
}

// ============================================================================
// CREATE ADMISSION E2E ROUTER
// ============================================================================

function createAdmissionRouter(db: MockDB) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // GET /application/:token — Pre-fill data
  router.get('/application/:token', (req: Request, res: Response) => {
    const lead = db.findLeadByApplicationToken(req.params.token);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }
    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    return res.json({
      success: true,
      data: {
        leadCode: lead.code,
        familyName: lead.familyName,
        students: lead.children.filter(c => c.isApplicant).map(c => ({
          id: c.id,
          fullName: c.fullName,
          dateOfBirth: c.dateOfBirth,
          gender: c.gender,
          desiredGrade: c.desiredGrade,
          currentGrade: c.currentGrade,
          studentType: c.studentType,
          primaryLanguage: c.primaryLanguage,
          nationality: c.nationality,
        })),
        father: lead.parents.find(p => p.parentType === 'FATHER') || null,
        mother: lead.parents.find(p => p.parentType === 'MOTHER') || null,
        address: lead.address,
        documents: lead.admissionDocuments.map(d => ({
          id: d.id,
          fileName: d.fileName,
          childIndex: d.childIndex,
        })),
      },
    });
  });

  // POST /admissions — Submit admission form
  router.post('/admissions', express.json(), (req: Request, res: Response) => {
    const { applicationToken, students, student, father, mother, address, siblings } = req.body;

    // 1. applicationToken required
    if (!applicationToken) {
      return res.status(400).json({ success: false, error: 'Token obrigatório', code: 'TOKEN_REQUIRED' });
    }

    // 2. Token must exist
    const lead = db.findLeadByApplicationToken(applicationToken);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    // 3. Token not expired
    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    // 4. formSubmissionCount < 5
    if (lead.formSubmissionCount >= 5) {
      return res.status(429).json({ success: false, error: 'Limite atingido', code: 'MAX_SUBMISSIONS_EXCEEDED' });
    }

    // 5. At least 1 student
    const studentList = students || (student ? [student] : []);
    if (studentList.length === 0) {
      return res.status(400).json({ success: false, error: 'Pelo menos um estudante obrigatório' });
    }

    // 6. father.name and mother.name required
    if (!father?.name) {
      return res.status(400).json({ success: false, error: 'Nome do pai obrigatório' });
    }
    if (!mother?.name) {
      return res.status(400).json({ success: false, error: 'Nome da mãe obrigatório' });
    }

    // 7. father.email valid, father.phone min(8), same for mother
    if (father.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(father.email)) {
      return res.status(400).json({ success: false, error: 'Email do pai inválido' });
    }
    if (father.phone && father.phone.length < 8) {
      return res.status(400).json({ success: false, error: 'Telefone do pai muito curto' });
    }
    if (mother.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mother.email)) {
      return res.status(400).json({ success: false, error: 'Email da mãe inválido' });
    }
    if (mother.phone && mother.phone.length < 8) {
      return res.status(400).json({ success: false, error: 'Telefone da mae muito curto' });
    }

    // 8. address.country and address.city required
    if (!address?.country || !address?.city) {
      return res.status(400).json({ success: false, error: 'Endereço incompleto (país e cidade obrigatórios)' });
    }

    // Create children records
    lead.children = studentList.map((s: any) => ({
      id: db.generateId(),
      leadId: lead.id,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      desiredGrade: s.desiredGrade,
      currentGrade: s.currentGrade || '',
      currentSchool: s.currentSchool || '',
      studentType: s.studentType,
      primaryLanguage: s.primaryLanguage,
      otherLanguages: s.otherLanguages ? [s.otherLanguages] : [],
      relationship: 'STUDENT',
      isApplicant: true,
      cpf: s.cpf,
      nationality: s.nationality,
    }));

    // Add siblings
    if (siblings?.length > 0) {
      for (const sib of siblings) {
        lead.children.push({
          id: db.generateId(),
          leadId: lead.id,
          fullName: sib.name,
          dateOfBirth: sib.dateOfBirth || '',
          gender: sib.gender || '',
          desiredGrade: sib.grade || '',
          studentType: '',
          primaryLanguage: '',
          otherLanguages: [],
          relationship: 'SIBLING',
          isApplicant: false,
        });
      }
    }

    // Create parent records
    lead.parents = [
      {
        id: db.generateId(),
        leadId: lead.id,
        parentType: 'FATHER',
        fullName: father.name,
        email: father.email || '',
        phone: father.phone || '',
        cpf: father.cpf,
        occupation: father.occupation,
      },
      {
        id: db.generateId(),
        leadId: lead.id,
        parentType: 'MOTHER',
        fullName: mother.name,
        email: mother.email || '',
        phone: mother.phone || '',
        cpf: mother.cpf,
        occupation: mother.occupation,
      },
    ];

    // Save address
    lead.address = address || null;

    // Update status
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount++;

    const isUpdate = lead.formSubmissionCount > 1;
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Dados atualizados' : 'Inscrição recebida',
      data: { leadCode: lead.code },
    });
  });

  // POST /application/:token/documents — Upload admission docs
  router.post('/application/:token/documents', upload.array('files', 10), (req: Request, res: Response) => {
    const lead = db.findLeadByApplicationToken(req.params.token);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const childIndex = req.body.childIndex != null ? parseInt(req.body.childIndex) : null;

    const newDocs: MockAdmissionDocument[] = files.map(f => ({
      id: db.generateId(),
      leadId: lead.id,
      fileName: f.originalname,
      fileUrl: `https://storage.test/${lead.id}/${f.originalname}`,
      fileSize: f.size,
      mimeType: f.mimetype,
      childIndex,
      uploadedAt: new Date().toISOString(),
    }));

    lead.admissionDocuments.push(...newDocs);

    return res.status(201).json({
      success: true,
      data: newDocs.map(d => ({
        id: d.id,
        fileName: d.fileName,
        childIndex: d.childIndex,
      })),
    });
  });

  // DELETE /application/:token/documents/:documentId — Delete admission doc
  router.delete('/application/:token/documents/:documentId', (req: Request, res: Response) => {
    const lead = db.findLeadByApplicationToken(req.params.token);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    }

    const idx = lead.admissionDocuments.findIndex(d => d.id === req.params.documentId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }

    lead.admissionDocuments.splice(idx, 1);
    return res.json({ success: true, message: 'Documento removido' });
  });

  return router;
}

function createAdmissionApp(db: MockDB) {
  const app = express();
  app.use('/public', createAdmissionRouter(db));
  return app;
}

// ============================================================================
// TEST DATA — REALISTIC BRAZILIAN FAMILY
// ============================================================================

const FAMILY = {
  name: 'Família Santos',
  father: {
    name: 'Roberto Santos',
    email: 'roberto@email.com',
    phone: '(11) 99888-7766',
    cpf: '111.222.333-44',
    occupation: 'Advogado',
  },
  mother: {
    name: 'Claudia Lima Santos',
    email: 'claudia@email.com',
    phone: '(11) 99777-6655',
    cpf: '555.666.777-88',
    occupation: 'Professora',
  },
  student: {
    fullName: 'Gabriel Lima Santos',
    dateOfBirth: '2015-07-20',
    gender: 'M',
    nationality: 'Brasileiro',
    desiredGrade: '4th Grade',
    currentGrade: '3rd Grade',
    studentType: 'NEW',
    primaryLanguage: 'Portuguese',
    otherLanguages: 'English',
  },
  student2: {
    fullName: 'Sofia Lima Santos',
    dateOfBirth: '2018-02-14',
    gender: 'F',
    nationality: 'Brasileira',
    desiredGrade: '1st Grade',
    currentGrade: 'Pre-K',
    studentType: 'NEW',
    primaryLanguage: 'Portuguese',
  },
  address: {
    country: 'Brasil',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Jardins',
    street: 'Rua Oscar Freire',
    number: '890',
    complement: '',
    zipCode: '01426-001',
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('E2E: Admission Flow — Single Child', () => {
  let db: MockDB;
  let app: express.Application;
  let leadId: string;
  let applicationToken: string;
  let leadCode: string;

  beforeEach(() => {
    db = new MockDB();
    app = createAdmissionApp(db);
  });

  // ==================== PHASE 1: LEAD LIFECYCLE ====================

  describe('Phase 1: Lead Lifecycle', () => {
    it('should create lead with PENDING status', () => {
      const lead = db.createLead(FAMILY.name);
      expect(lead.id).toBeTruthy();
      expect(lead.code).toMatch(/^LEAD-/);
      expect(lead.familyName).toBe(FAMILY.name);
      expect(lead.applicationStatus).toBe('PENDING');
      expect(lead.children).toHaveLength(0);
      expect(lead.parents).toHaveLength(0);
      expect(lead.address).toBeNull();
    });

    it('should generate 64-char application token', () => {
      const lead = db.createLead(FAMILY.name);
      const token = db.generateApplicationToken(lead.id);
      expect(token).toHaveLength(64); // 32 bytes hex = 64 chars
    });

    it('should set token expiry to 48 hours in the future', () => {
      const lead = db.createLead(FAMILY.name);
      const before = Date.now();
      db.generateApplicationToken(lead.id);
      const after = Date.now();

      const expires = lead.applicationTokenExpires!;
      expect(expires).toBeInstanceOf(Date);
      // Expires should be ~7 days (168h) from now (within a small margin)
      const sevenDaysMs = 168 * 60 * 60 * 1000;
      expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs);
      expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs);
    });

    it('should update lead status to LINK_SENT', () => {
      const lead = db.createLead(FAMILY.name);
      expect(lead.applicationStatus).toBe('PENDING');

      db.generateApplicationToken(lead.id);
      expect(lead.applicationStatus).toBe('LINK_SENT');
    });
  });

  // ==================== PHASE 2: FORM PRE-FILL ====================

  describe('Phase 2: Form Pre-fill', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);
    });

    it('should return lead data with valid token', async () => {
      const res = await request(app)
        .get(`/public/application/${applicationToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.leadCode).toBe(leadCode);
    });

    it('should return 404 for invalid token', async () => {
      const res = await request(app)
        .get('/public/application/invalid-token-does-not-exist')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should return 410 for expired token', async () => {
      const lead = db.leads.get(leadId)!;
      lead.applicationTokenExpires = new Date(Date.now() - 1000); // expired 1s ago

      const res = await request(app)
        .get(`/public/application/${applicationToken}`)
        .expect(410);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return family name and lead code', async () => {
      const res = await request(app)
        .get(`/public/application/${applicationToken}`)
        .expect(200);

      expect(res.body.data.familyName).toBe(FAMILY.name);
      expect(res.body.data.leadCode).toBe(leadCode);
    });
  });

  // ==================== PHASE 3: FORM SUBMISSION ====================

  describe('Phase 3: Form Submission', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);
    });

    it('should submit single-child admission successfully (201)', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe(leadCode);
    });

    it('should persist student data correctly (fullName, dateOfBirth, gender, desiredGrade, studentType, primaryLanguage)', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.children).toHaveLength(1);
      const child = lead.children[0];
      expect(child.fullName).toBe(FAMILY.student.fullName);
      expect(child.dateOfBirth).toBe(FAMILY.student.dateOfBirth);
      expect(child.gender).toBe(FAMILY.student.gender);
      expect(child.desiredGrade).toBe(FAMILY.student.desiredGrade);
      expect(child.studentType).toBe(FAMILY.student.studentType);
      expect(child.primaryLanguage).toBe(FAMILY.student.primaryLanguage);
    });

    it('should persist parent data correctly (father + mother with names, emails, phones, cpfs)', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.parents).toHaveLength(2);

      const father = lead.parents.find(p => p.parentType === 'FATHER')!;
      expect(father.fullName).toBe(FAMILY.father.name);
      expect(father.email).toBe(FAMILY.father.email);
      expect(father.phone).toBe(FAMILY.father.phone);
      expect(father.cpf).toBe(FAMILY.father.cpf);

      const mother = lead.parents.find(p => p.parentType === 'MOTHER')!;
      expect(mother.fullName).toBe(FAMILY.mother.name);
      expect(mother.email).toBe(FAMILY.mother.email);
      expect(mother.phone).toBe(FAMILY.mother.phone);
      expect(mother.cpf).toBe(FAMILY.mother.cpf);
    });

    it('should persist address data correctly', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.address).toEqual(FAMILY.address);
    });

    it('should set applicationStatus to FORM_RECEIVED', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.applicationStatus).toBe('FORM_RECEIVED');
    });

    it('should increment formSubmissionCount to 1', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.formSubmissionCount).toBe(1);
    });

    it('should set student relationship to STUDENT and isApplicant to true', async () => {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(201);

      const lead = db.leads.get(leadId)!;
      expect(lead.children[0].relationship).toBe('STUDENT');
      expect(lead.children[0].isApplicant).toBe(true);
    });
  });

  // ==================== PHASE 4: RE-SUBMISSION (UPDATE) ====================

  describe('Phase 4: Re-submission (Update)', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);
    });

    const submitForm = (overrides: any = {}) => {
      return request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          ...overrides,
        });
    };

    it('should accept re-submission with 200 status', async () => {
      // First submission
      await submitForm().expect(201);

      // Second submission (re-submission)
      const res = await submitForm().expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Dados atualizados');
    });

    it('should update student desiredGrade on re-submission', async () => {
      await submitForm().expect(201);

      const updatedStudent = { ...FAMILY.student, desiredGrade: '5th Grade' };
      await submitForm({ students: [updatedStudent] }).expect(200);

      const lead = db.leads.get(leadId)!;
      expect(lead.children[0].desiredGrade).toBe('5th Grade');
    });

    it('should update parent email on re-submission', async () => {
      await submitForm().expect(201);

      const updatedFather = { ...FAMILY.father, email: 'roberto.new@email.com' };
      await submitForm({ father: updatedFather }).expect(200);

      const lead = db.leads.get(leadId)!;
      const father = lead.parents.find(p => p.parentType === 'FATHER')!;
      expect(father.email).toBe('roberto.new@email.com');
    });

    it('should increment formSubmissionCount to 2', async () => {
      await submitForm().expect(201);
      await submitForm().expect(200);

      const lead = db.leads.get(leadId)!;
      expect(lead.formSubmissionCount).toBe(2);
    });

    it('should reject 6th submission with 429 MAX_SUBMISSIONS_EXCEEDED', async () => {
      // Submit 5 times
      for (let i = 0; i < 5; i++) {
        await submitForm();
      }

      const lead = db.leads.get(leadId)!;
      expect(lead.formSubmissionCount).toBe(5);

      // 6th submission should fail
      const res = await submitForm().expect(429);
      expect(res.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
    });
  });

  // ==================== PHASE 5: VALIDATION ERRORS ====================

  describe('Phase 5: Validation Errors', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);
    });

    it('should reject missing applicationToken with TOKEN_REQUIRED', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(400);

      expect(res.body.code).toBe('TOKEN_REQUIRED');
    });

    it('should reject invalid token with TOKEN_NOT_FOUND', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken: 'does-not-exist-token-xyz',
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(404);

      expect(res.body.code).toBe('TOKEN_NOT_FOUND');
    });

    it('should reject expired token with TOKEN_EXPIRED', async () => {
      const lead = db.leads.get(leadId)!;
      lead.applicationTokenExpires = new Date(Date.now() - 1000);

      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(410);

      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject submission without students', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject submission without father name', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: { email: 'test@test.com', phone: '12345678' },
          mother: FAMILY.mother,
          address: FAMILY.address,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject submission without mother name', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: { email: 'test@test.com', phone: '12345678' },
          address: FAMILY.address,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});

// ============================================================================
// E2E: ADMISSION FLOW — MULTI-CHILD
// ============================================================================

describe('E2E: Admission Flow — Multi-Child', () => {
  let db: MockDB;
  let app: express.Application;
  let leadId: string;
  let applicationToken: string;

  beforeEach(() => {
    db = new MockDB();
    app = createAdmissionApp(db);
    const lead = db.createLead(FAMILY.name);
    leadId = lead.id;
    applicationToken = db.generateApplicationToken(leadId);
  });

  const submitAdmission = (overrides: any = {}) => {
    return request(app)
      .post('/public/admissions')
      .send({
        applicationToken,
        students: [FAMILY.student, FAMILY.student2],
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        ...overrides,
      });
  };

  it('should submit 2 students successfully', async () => {
    const res = await submitAdmission().expect(201);
    expect(res.body.success).toBe(true);

    const lead = db.leads.get(leadId)!;
    expect(lead.children.filter(c => c.relationship === 'STUDENT')).toHaveLength(2);
  });

  it('should submit 3 students successfully', async () => {
    const student3 = {
      fullName: 'Lucas Lima Santos',
      dateOfBirth: '2020-11-03',
      gender: 'M',
      nationality: 'Brasileiro',
      desiredGrade: 'Pre-K',
      studentType: 'NEW',
      primaryLanguage: 'Portuguese',
    };

    const res = await submitAdmission({
      students: [FAMILY.student, FAMILY.student2, student3],
    }).expect(201);

    expect(res.body.success).toBe(true);
    const lead = db.leads.get(leadId)!;
    expect(lead.children.filter(c => c.relationship === 'STUDENT')).toHaveLength(3);
  });

  it('should persist all children with correct data', async () => {
    await submitAdmission().expect(201);

    const lead = db.leads.get(leadId)!;
    const applicants = lead.children.filter(c => c.relationship === 'STUDENT');

    expect(applicants[0].fullName).toBe(FAMILY.student.fullName);
    expect(applicants[0].dateOfBirth).toBe(FAMILY.student.dateOfBirth);
    expect(applicants[0].gender).toBe('M');
    expect(applicants[0].desiredGrade).toBe(FAMILY.student.desiredGrade);

    expect(applicants[1].fullName).toBe(FAMILY.student2.fullName);
    expect(applicants[1].dateOfBirth).toBe(FAMILY.student2.dateOfBirth);
    expect(applicants[1].gender).toBe('F');
    expect(applicants[1].desiredGrade).toBe(FAMILY.student2.desiredGrade);
  });

  it('should set all children as isApplicant=true', async () => {
    await submitAdmission().expect(201);

    const lead = db.leads.get(leadId)!;
    const applicants = lead.children.filter(c => c.relationship === 'STUDENT');
    for (const child of applicants) {
      expect(child.isApplicant).toBe(true);
    }
  });

  it('should handle students with siblings', async () => {
    await submitAdmission({
      siblings: [
        { name: 'Ana Santos', dateOfBirth: '2022-01-15', grade: 'Nursery' },
      ],
    }).expect(201);

    const lead = db.leads.get(leadId)!;
    const students = lead.children.filter(c => c.relationship === 'STUDENT');
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');

    expect(students).toHaveLength(2);
    expect(siblings).toHaveLength(1);
    expect(siblings[0].fullName).toBe('Ana Santos');
  });

  it('should persist siblings with relationship=SIBLING and isApplicant=false', async () => {
    await submitAdmission({
      siblings: [
        { name: 'Ana Santos', dateOfBirth: '2022-01-15', grade: 'Nursery' },
      ],
    }).expect(201);

    const lead = db.leads.get(leadId)!;
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');
    expect(siblings).toHaveLength(1);
    expect(siblings[0].relationship).toBe('SIBLING');
    expect(siblings[0].isApplicant).toBe(false);
  });

  it('should handle mixed: 2 applicants + 1 sibling', async () => {
    await submitAdmission({
      siblings: [
        { name: 'Ana Santos', dateOfBirth: '2022-01-15', grade: 'Nursery' },
      ],
    }).expect(201);

    const lead = db.leads.get(leadId)!;
    expect(lead.children).toHaveLength(3);

    const students = lead.children.filter(c => c.relationship === 'STUDENT');
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');

    expect(students).toHaveLength(2);
    expect(siblings).toHaveLength(1);

    // All students are applicants
    for (const s of students) {
      expect(s.isApplicant).toBe(true);
    }
    // Siblings are not applicants
    for (const s of siblings) {
      expect(s.isApplicant).toBe(false);
    }
  });
});

// ============================================================================
// E2E: ADMISSION DOCUMENTS — PER-CHILD UPLOAD
// ============================================================================

describe('E2E: Admission Documents — Per-Child Upload', () => {
  let db: MockDB;
  let app: express.Application;
  let leadId: string;
  let applicationToken: string;

  beforeEach(() => {
    db = new MockDB();
    app = createAdmissionApp(db);
    const lead = db.createLead(FAMILY.name);
    leadId = lead.id;
    applicationToken = db.generateApplicationToken(leadId);
  });

  it('should upload document for child 0 (childIndex=0)', async () => {
    const res = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('transcript-child0'), 'transcript_gabriel.pdf')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].childIndex).toBe(0);
    expect(res.body.data[0].fileName).toBe('transcript_gabriel.pdf');
  });

  it('should upload document for child 1 (childIndex=1)', async () => {
    const res = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '1')
      .attach('files', Buffer.from('transcript-child1'), 'transcript_sofia.pdf')
      .expect(201);

    expect(res.body.data[0].childIndex).toBe(1);
    expect(res.body.data[0].fileName).toBe('transcript_sofia.pdf');
  });

  it('should handle upload without childIndex (legacy)', async () => {
    const res = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .attach('files', Buffer.from('general-doc'), 'general_doc.pdf')
      .expect(201);

    expect(res.body.data[0].childIndex).toBeNull();
    expect(res.body.data[0].fileName).toBe('general_doc.pdf');
  });

  it('should upload multiple files in single request', async () => {
    const res = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('file1-content'), 'doc1.pdf')
      .attach('files', Buffer.from('file2-content'), 'doc2.pdf')
      .attach('files', Buffer.from('file3-content'), 'doc3.pdf')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].fileName).toBe('doc1.pdf');
    expect(res.body.data[1].fileName).toBe('doc2.pdf');
    expect(res.body.data[2].fileName).toBe('doc3.pdf');

    // All should have the same childIndex
    for (const doc of res.body.data) {
      expect(doc.childIndex).toBe(0);
    }
  });

  it('should return 404 for invalid token on upload', async () => {
    const res = await request(app)
      .post('/public/application/invalid-token-xyz/documents')
      .attach('files', Buffer.from('content'), 'file.pdf')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should return 400 when no files attached', async () => {
    const res = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should delete a specific document', async () => {
    // Upload a document first
    const uploadRes = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('content'), 'to_delete.pdf')
      .expect(201);

    const docId = uploadRes.body.data[0].id;
    const lead = db.leads.get(leadId)!;
    expect(lead.admissionDocuments).toHaveLength(1);

    // Delete
    const deleteRes = await request(app)
      .delete(`/public/application/${applicationToken}/documents/${docId}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);
    expect(lead.admissionDocuments).toHaveLength(0);
  });

  it('should return 404 when deleting non-existent document', async () => {
    const res = await request(app)
      .delete(`/public/application/${applicationToken}/documents/non-existent-doc-id`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('should not affect other documents when deleting one', async () => {
    // Upload 3 documents
    const upload1 = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('c1'), 'child0_doc.pdf')
      .expect(201);

    await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '1')
      .attach('files', Buffer.from('c2'), 'child1_doc.pdf')
      .expect(201);

    await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('c3'), 'child0_doc2.pdf')
      .expect(201);

    const lead = db.leads.get(leadId)!;
    expect(lead.admissionDocuments).toHaveLength(3);

    // Delete the first document only
    const docId = upload1.body.data[0].id;
    await request(app)
      .delete(`/public/application/${applicationToken}/documents/${docId}`)
      .expect(200);

    // Other 2 should remain
    expect(lead.admissionDocuments).toHaveLength(2);
    expect(lead.admissionDocuments.find(d => d.id === docId)).toBeUndefined();
    expect(lead.admissionDocuments.some(d => d.fileName === 'child1_doc.pdf')).toBe(true);
    expect(lead.admissionDocuments.some(d => d.fileName === 'child0_doc2.pdf')).toBe(true);
  });
});

// ============================================================================
// E2E: ADMISSION FLOW — LEGACY SINGULAR STUDENT FORMAT
// ============================================================================

describe('E2E: Admission Flow — Legacy singular student format', () => {
  let db: MockDB;
  let app: express.Application;
  let leadId: string;
  let applicationToken: string;

  beforeEach(() => {
    db = new MockDB();
    app = createAdmissionApp(db);
    const lead = db.createLead(FAMILY.name);
    leadId = lead.id;
    applicationToken = db.generateApplicationToken(leadId);
  });

  it('should accept singular "student" field instead of "students" array', async () => {
    const res = await request(app)
      .post('/public/admissions')
      .send({
        applicationToken,
        student: FAMILY.student, // singular, not array
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    const lead = db.leads.get(leadId)!;
    expect(lead.children).toHaveLength(1);
    expect(lead.children[0].fullName).toBe(FAMILY.student.fullName);
  });

  it('should normalize singular to array internally', async () => {
    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken,
        student: FAMILY.student,
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
      })
      .expect(201);

    const lead = db.leads.get(leadId)!;

    // Should be stored the same as if an array was provided
    expect(lead.children).toHaveLength(1);
    expect(lead.children[0].relationship).toBe('STUDENT');
    expect(lead.children[0].isApplicant).toBe(true);
    expect(lead.children[0].fullName).toBe(FAMILY.student.fullName);
    expect(lead.children[0].desiredGrade).toBe(FAMILY.student.desiredGrade);
  });
});

// ============================================================================
// E2E: COMPLETE ADMISSION JOURNEY
// ============================================================================

describe('E2E: Complete Admission Journey', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createAdmissionApp(db);
  });

  it('should complete the FULL admission flow: create lead -> generate token -> pre-fill -> upload docs -> submit -> re-submit -> verify', async () => {
    // ========================================================
    // STEP 1: Create lead
    // ========================================================
    const lead = db.createLead(FAMILY.name);
    const leadId = lead.id;
    const leadCode = lead.code;
    expect(lead.applicationStatus).toBe('PENDING');
    expect(lead.children).toHaveLength(0);

    // ========================================================
    // STEP 2: Generate application token
    // ========================================================
    const applicationToken = db.generateApplicationToken(leadId);
    expect(applicationToken).toHaveLength(64);
    expect(lead.applicationStatus).toBe('LINK_SENT');
    expect(lead.applicationTokenExpires!.getTime()).toBeGreaterThan(Date.now());

    // ========================================================
    // STEP 3: Fetch pre-fill (empty, no data yet)
    // ========================================================
    const prefillRes = await request(app)
      .get(`/public/application/${applicationToken}`)
      .expect(200);

    expect(prefillRes.body.success).toBe(true);
    expect(prefillRes.body.data.familyName).toBe(FAMILY.name);
    expect(prefillRes.body.data.leadCode).toBe(leadCode);
    expect(prefillRes.body.data.students).toHaveLength(0);
    expect(prefillRes.body.data.father).toBeNull();
    expect(prefillRes.body.data.mother).toBeNull();
    expect(prefillRes.body.data.address).toBeNull();
    expect(prefillRes.body.data.documents).toHaveLength(0);

    // ========================================================
    // STEP 4: Upload docs for child 0
    // ========================================================
    const uploadRes = await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '0')
      .attach('files', Buffer.from('transcript-gabriel'), 'historico_gabriel.pdf')
      .expect(201);

    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data[0].childIndex).toBe(0);
    expect(lead.admissionDocuments).toHaveLength(1);

    // Upload doc for child 1
    await request(app)
      .post(`/public/application/${applicationToken}/documents`)
      .field('childIndex', '1')
      .attach('files', Buffer.from('transcript-sofia'), 'historico_sofia.pdf')
      .expect(201);

    expect(lead.admissionDocuments).toHaveLength(2);

    // ========================================================
    // STEP 5: Submit form with 2 students + 1 sibling
    // ========================================================
    const submitRes = await request(app)
      .post('/public/admissions')
      .send({
        applicationToken,
        students: [FAMILY.student, FAMILY.student2],
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [
          { name: 'Pedro Lima Santos', dateOfBirth: '2022-03-10', grade: 'Nursery' },
        ],
      })
      .expect(201);

    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.leadCode).toBe(leadCode);

    // ========================================================
    // STEP 6: Verify data after first submission
    // ========================================================
    expect(lead.applicationStatus).toBe('FORM_RECEIVED');
    expect(lead.formSubmissionCount).toBe(1);

    // Children: 2 students + 1 sibling
    expect(lead.children).toHaveLength(3);
    const students = lead.children.filter(c => c.relationship === 'STUDENT');
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');
    expect(students).toHaveLength(2);
    expect(siblings).toHaveLength(1);

    expect(students[0].fullName).toBe(FAMILY.student.fullName);
    expect(students[0].isApplicant).toBe(true);
    expect(students[1].fullName).toBe(FAMILY.student2.fullName);
    expect(students[1].isApplicant).toBe(true);
    expect(siblings[0].fullName).toBe('Pedro Lima Santos');
    expect(siblings[0].isApplicant).toBe(false);

    // Parents
    const father = lead.parents.find(p => p.parentType === 'FATHER')!;
    const mother = lead.parents.find(p => p.parentType === 'MOTHER')!;
    expect(father.fullName).toBe(FAMILY.father.name);
    expect(father.email).toBe(FAMILY.father.email);
    expect(father.cpf).toBe(FAMILY.father.cpf);
    expect(mother.fullName).toBe(FAMILY.mother.name);
    expect(mother.email).toBe(FAMILY.mother.email);
    expect(mother.cpf).toBe(FAMILY.mother.cpf);

    // Address
    expect(lead.address).toEqual(FAMILY.address);

    // Documents still present
    expect(lead.admissionDocuments).toHaveLength(2);

    // ========================================================
    // STEP 7: Fetch pre-fill again (now with data)
    // ========================================================
    const prefillRes2 = await request(app)
      .get(`/public/application/${applicationToken}`)
      .expect(200);

    expect(prefillRes2.body.data.students).toHaveLength(2);
    expect(prefillRes2.body.data.students[0].fullName).toBe(FAMILY.student.fullName);
    expect(prefillRes2.body.data.students[1].fullName).toBe(FAMILY.student2.fullName);
    expect(prefillRes2.body.data.father).toBeTruthy();
    expect(prefillRes2.body.data.father.fullName).toBe(FAMILY.father.name);
    expect(prefillRes2.body.data.mother).toBeTruthy();
    expect(prefillRes2.body.data.mother.fullName).toBe(FAMILY.mother.name);
    expect(prefillRes2.body.data.address).toEqual(FAMILY.address);
    expect(prefillRes2.body.data.documents).toHaveLength(2);

    // ========================================================
    // STEP 8: Re-submit with updated data
    // ========================================================
    const updatedStudent = { ...FAMILY.student, desiredGrade: '5th Grade' };
    const updatedMother = { ...FAMILY.mother, email: 'claudia.new@email.com' };

    const resubmitRes = await request(app)
      .post('/public/admissions')
      .send({
        applicationToken,
        students: [updatedStudent, FAMILY.student2],
        father: FAMILY.father,
        mother: updatedMother,
        address: FAMILY.address,
      })
      .expect(200);

    expect(resubmitRes.body.success).toBe(true);
    expect(resubmitRes.body.message).toBe('Dados atualizados');

    // ========================================================
    // STEP 9: Verify updates
    // ========================================================
    expect(lead.formSubmissionCount).toBe(2);
    expect(lead.children.filter(c => c.relationship === 'STUDENT')[0].desiredGrade).toBe('5th Grade');
    const updatedMotherData = lead.parents.find(p => p.parentType === 'MOTHER')!;
    expect(updatedMotherData.email).toBe('claudia.new@email.com');

    // ========================================================
    // STEP 10: Generate enrollment token (admin action)
    // ========================================================
    const enrollmentToken = db.generateEnrollmentToken(leadId);
    expect(enrollmentToken).toHaveLength(64);

    // ========================================================
    // STEP 11: Verify enrollment token exists and status is LINK_SENT
    // ========================================================
    expect(lead.enrollmentToken).toBe(enrollmentToken);
    expect(lead.enrollmentStatus).toBe('LINK_SENT');
    expect(lead.enrollmentTokenExpires).toBeInstanceOf(Date);
    expect(lead.enrollmentTokenExpires!.getTime()).toBeGreaterThan(Date.now());

    // Final state summary verification
    expect(lead.applicationStatus).toBe('FORM_RECEIVED');
    expect(lead.enrollmentStatus).toBe('LINK_SENT');
    expect(lead.formSubmissionCount).toBe(2);
    expect(lead.admissionDocuments).toHaveLength(2);
  });
});
