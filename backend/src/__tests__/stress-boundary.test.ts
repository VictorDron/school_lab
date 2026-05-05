/**
 * Stress & Boundary Tests
 *
 * Tests STRESS scenarios, boundary conditions, concurrent operations,
 * large payloads, and edge cases for the enrollment/admission system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { publicEnrollmentSchema } from '../schemas/public.schemas.js';

// ============================================================================
// MOCK IN-MEMORY DATABASE
// ============================================================================

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
  enrollmentSubmissionCount: number;
  enrollmentSubmittedAt: Date | null;
  children: MockChild[];
  parents: MockParent[];
  address: MockAddress | null;
  enrollmentDocuments: MockEnrollmentDocument[];
  emergencyContacts: MockEmergencyContact[];
  healthPlan: MockHealthPlan | null;
  transport: MockTransport | null;
  enrollmentInfo: MockEnrollmentInfo[];
  childHealth: MockChildHealth[];
  financialResponsible: MockFinancialResponsible | null;
}

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
}

interface MockParent {
  id: string;
  leadId: string;
  parentType: string;
  fullName: string;
  email: string;
  phone: string;
  cpf?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuer?: string;
  dateOfBirth?: string;
  education?: string;
  religion?: string;
  zipCode?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  sameAddressAsOtherParent?: boolean;
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

interface MockEnrollmentDocument {
  id: string;
  leadId: string;
  childId: string | null;
  documentType: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  includesOtherDocs: string[];
  status: string;
  uploadedAt: string;
}

interface MockEmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  isPrimary: boolean;
}

interface MockHealthPlan {
  operator: string;
  beneficiaryCode: string;
  planType: string;
  preferredHospital: string;
}

interface MockTransport {
  dropoffPickupPersons: string[];
  transportMethod: string;
  canLeaveAlone: boolean;
  familyVehicles: any[];
  authorizedPersons: any[];
  [key: string]: any;
}

interface MockEnrollmentInfo {
  childId: string;
  personType: string;
  studentCpf: string;
  studentIdNumber: string;
  studentIdIssueDate: string;
  studentIdIssuer: string;
  termsAccepted: boolean;
}

interface MockChildHealth {
  childId: string;
  weight: string;
  height: string;
  bloodType: string;
  medicalConditions: string[];
  allergies: string[];
  feverMedications: string[];
  painMedications: string[];
  [key: string]: any;
}

interface MockFinancialResponsible {
  responsibleType: string;
  fullName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
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
      enrollmentSubmissionCount: 0,
      enrollmentSubmittedAt: null,
      children: [],
      parents: [],
      address: null,
      enrollmentDocuments: [],
      emergencyContacts: [],
      healthPlan: null,
      transport: null,
      enrollmentInfo: [],
      childHealth: [],
      financialResponsible: null,
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

  findLeadByEnrollmentToken(token: string): MockLead | undefined {
    for (const lead of this.leads.values()) {
      if (lead.enrollmentToken === token) return lead;
    }
    return undefined;
  }

  // Helper: set up a lead with admission completed and enrollment token
  setupEnrolledLead(familyName: string = 'Família Teste'): { lead: MockLead; enrollmentToken: string } {
    const lead = this.createLead(familyName);
    this.generateApplicationToken(lead.id);
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount = 1;
    lead.children = [{
      id: this.generateId(),
      leadId: lead.id,
      fullName: 'Lucas Teste',
      dateOfBirth: '2016-03-15',
      gender: 'M',
      desiredGrade: '3rd Grade',
      studentType: 'NEW',
      primaryLanguage: 'Portuguese',
      otherLanguages: [],
      relationship: 'STUDENT',
      isApplicant: true,
    }];
    lead.parents = [
      { id: this.generateId(), leadId: lead.id, parentType: 'FATHER', fullName: 'Carlos Teste', email: 'carlos@test.com', phone: '(31) 99111-2222' },
      { id: this.generateId(), leadId: lead.id, parentType: 'MOTHER', fullName: 'Maria Teste', email: 'maria@test.com', phone: '(31) 99333-4444' },
    ];
    lead.address = { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua A', number: '1', complement: '', zipCode: '30000-000' };
    const enrollmentToken = this.generateEnrollmentToken(lead.id);
    return { lead, enrollmentToken };
  }

  // Helper: pre-populate N documents for a lead
  addDocuments(leadId: string, count: number): void {
    const lead = this.leads.get(leadId)!;
    for (let i = 0; i < count; i++) {
      lead.enrollmentDocuments.push({
        id: this.generateId(),
        leadId: lead.id,
        childId: null,
        documentType: 'OTHER',
        category: 'STUDENT',
        fileName: `doc_${i}.pdf`,
        fileUrl: `https://storage.test/${lead.id}/doc_${i}.pdf`,
        fileSize: 1000,
        mimeType: 'application/pdf',
        includesOtherDocs: [],
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      });
    }
  }
}

// ============================================================================
// CREATE TEST ROUTER (simulates all public routes)
// ============================================================================

function createTestRouter(db: MockDB) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // ==================== ENROLLMENT ENDPOINTS ====================

  // GET /enrollment/:token - Get enrollment pre-fill data
  router.get('/enrollment/:token', (req: Request, res: Response) => {
    const lead = db.findLeadByEnrollmentToken(req.params.token);
    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, error: 'Admissão não preenchida', code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    const father = lead.parents.find(p => p.parentType === 'FATHER');
    const mother = lead.parents.find(p => p.parentType === 'MOTHER');
    const applicantChildren = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');

    return res.json({
      success: true,
      data: {
        leadCode: lead.code,
        familyName: lead.familyName,
        students: applicantChildren,
        father: father || null,
        mother: mother || null,
        address: lead.address,
        health: null,
        emergencyContacts: lead.emergencyContacts,
        healthPlan: lead.healthPlan,
        transport: lead.transport,
        financialResponsible: lead.financialResponsible,
        documents: lead.enrollmentDocuments,
        tokenExpires: lead.enrollmentTokenExpires?.toISOString(),
        enrollmentStatus: lead.enrollmentStatus,
      },
    });
  });

  // POST /enrollment/:token/documents - Upload enrollment docs
  router.post('/enrollment/:token/documents', upload.array('files', 10), (req: Request, res: Response) => {
    const lead = db.findLeadByEnrollmentToken(req.params.token);
    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, error: 'Admissão não preenchida', code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, error: 'Nenhum arquivo' });

    const { documentType, category, childId, includesOtherDocs } = req.body;

    // Check doc limit
    if (lead.enrollmentDocuments.length + files.length > 50) {
      return res.status(400).json({ success: false, error: 'Limite de docs atingido (maximo 50)', code: 'DOCUMENT_LIMIT_EXCEEDED' });
    }

    let parsedIncludes: string[] = [];
    if (includesOtherDocs) {
      try { parsedIncludes = JSON.parse(includesOtherDocs); } catch { /* ignore */ }
    }

    const newDocs: MockEnrollmentDocument[] = files.map(f => ({
      id: db.generateId(),
      leadId: lead.id,
      childId: childId || null,
      documentType: documentType || 'OTHER',
      category: category || 'STUDENT',
      fileName: f.originalname,
      fileUrl: `https://storage.test/${lead.id}/${f.originalname}`,
      fileSize: f.size,
      mimeType: f.mimetype,
      includesOtherDocs: parsedIncludes,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    }));

    lead.enrollmentDocuments.push(...newDocs);

    return res.status(201).json({ success: true, data: newDocs });
  });

  // DELETE /enrollment/:token/documents/:documentId
  router.delete('/enrollment/:token/documents/:documentId', (req: Request, res: Response) => {
    const lead = db.findLeadByEnrollmentToken(req.params.token);
    if (!lead) return res.status(400).json({ success: false, error: 'Token inválido' });

    const idx = lead.enrollmentDocuments.findIndex(d => d.id === req.params.documentId);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Documento não encontrado' });

    const doc = lead.enrollmentDocuments[idx];
    if (doc.leadId !== lead.id) return res.status(403).json({ success: false, error: 'Sem permissao' });

    lead.enrollmentDocuments.splice(idx, 1);
    return res.json({ success: true, message: 'Documento removido' });
  });

  // POST /enrollment - Submit enrollment form
  router.post('/enrollment', express.json({ limit: '1mb' }), (req: Request, res: Response) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false, error: 'Dados inválidos', code: 'VALIDATION_ERROR', details: [{ path: '', message: 'Body is empty' }],
      });
    }

    const zodResult = publicEnrollmentSchema.safeParse(req.body);
    if (!zodResult.success) {
      const errorSummary = zodResult.error.errors.map(e => ({
        path: e.path.join('.'), message: e.message, code: e.code,
      }));
      return res.status(400).json({
        success: false, error: 'Dados inválidos', code: 'VALIDATION_ERROR', details: errorSummary,
      });
    }

    const data = zodResult.data;
    const lead = db.findLeadByEnrollmentToken(data.enrollmentToken);

    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, error: 'Admissão não preenchida', code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (lead.enrollmentSubmissionCount >= 5) {
      return res.status(429).json({
        success: false,
        error: `Limite de envios atingido (${lead.enrollmentSubmissionCount}/5)`,
        code: 'MAX_SUBMISSIONS_EXCEEDED',
        count: lead.enrollmentSubmissionCount,
      });
    }
    if (!data.termsAccepted) {
      return res.status(400).json({ success: false, error: 'Termos não aceitos', code: 'TERMS_NOT_ACCEPTED' });
    }

    const applicants = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
    if (applicants.length === 0) {
      return res.status(400).json({ success: false, error: 'Aluno não encontrado', code: 'APPLICANT_NOT_FOUND' });
    }

    // Persist data
    const father = lead.parents.find(p => p.parentType === 'FATHER');
    const mother = lead.parents.find(p => p.parentType === 'MOTHER');
    if (father && data.fatherUpdates) Object.assign(father, data.fatherUpdates);
    if (mother && data.motherUpdates) Object.assign(mother, data.motherUpdates);

    if (data.childrenData && data.childrenData.length > 0) {
      for (const cd of data.childrenData) {
        if (cd.enrollmentInfo) lead.enrollmentInfo.push({ childId: cd.childId, ...cd.enrollmentInfo, termsAccepted: data.termsAccepted });
        if (cd.health) lead.childHealth.push({ childId: cd.childId, ...cd.health } as MockChildHealth);
      }
    } else {
      const childId = applicants[0].id;
      if (data.enrollmentInfo) lead.enrollmentInfo.push({ childId, ...data.enrollmentInfo, termsAccepted: data.termsAccepted });
      if (data.health) lead.childHealth.push({ childId, ...data.health } as MockChildHealth);
    }

    lead.emergencyContacts = data.emergencyContacts.map((c: any) => ({
      id: db.generateId(), name: c.name, phone: c.phone,
      email: c.email || '', relationship: c.relationship || '', isPrimary: c.isPrimary ?? false,
    }));
    lead.healthPlan = data.healthPlan as MockHealthPlan;
    lead.transport = data.transport as any;
    lead.financialResponsible = data.financialResponsible as MockFinancialResponsible;
    lead.enrollmentStatus = 'FORM_RECEIVED';
    lead.enrollmentSubmissionCount++;
    lead.enrollmentSubmittedAt = new Date();

    return res.status(200).json({
      success: true,
      message: 'Matrícula enviada com sucesso',
      data: { leadCode: lead.code },
    });
  });

  // ==================== ADMISSION ENDPOINTS (for independent count tests) ====================

  router.post('/admissions', express.json(), (req: Request, res: Response) => {
    const { applicationToken, students, father, mother, address } = req.body;
    if (!applicationToken) return res.status(400).json({ success: false, error: 'Token obrigatório', code: 'TOKEN_REQUIRED' });

    const lead = db.findLeadByApplicationToken(applicationToken);
    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (lead.formSubmissionCount >= 5) {
      return res.status(429).json({
        success: false,
        error: `Limite atingido (${lead.formSubmissionCount}/5)`,
        code: 'MAX_SUBMISSIONS_EXCEEDED',
        count: lead.formSubmissionCount,
      });
    }

    const studentList = students || [];
    if (studentList.length === 0) return res.status(400).json({ success: false, error: 'Estudante obrigatório' });
    if (!father?.name || !mother?.name) return res.status(400).json({ success: false, error: 'Pais obrigatórios' });

    lead.children = studentList.map((s: any) => ({
      id: db.generateId(), leadId: lead.id, fullName: s.fullName, dateOfBirth: s.dateOfBirth,
      gender: s.gender, desiredGrade: s.desiredGrade, studentType: s.studentType,
      primaryLanguage: s.primaryLanguage, otherLanguages: [], relationship: 'STUDENT', isApplicant: true,
    }));
    lead.parents = [
      { id: db.generateId(), leadId: lead.id, parentType: 'FATHER', fullName: father.name, email: father.email, phone: father.phone },
      { id: db.generateId(), leadId: lead.id, parentType: 'MOTHER', fullName: mother.name, email: mother.email, phone: mother.phone },
    ];
    lead.address = address || null;
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount++;

    return res.status(lead.formSubmissionCount > 1 ? 200 : 201).json({
      success: true, message: 'OK', data: { leadCode: lead.code },
    });
  });

  // ==================== FORM DRAFT ENDPOINTS ====================

  const drafts = new Map<string, any>();

  router.put('/form-draft/:token', express.json({ limit: '1mb' }), (req: Request, res: Response) => {
    const key = `${req.params.token}_${req.body.formType}`;
    drafts.set(key, { data: req.body.data, step: req.body.step, updatedAt: new Date().toISOString() });
    return res.json({ success: true, data: { key } });
  });

  router.get('/form-draft/:token', (req: Request, res: Response) => {
    const key = `${req.params.token}_${req.query.type}`;
    const draft = drafts.get(key);
    if (!draft) return res.status(404).json({ success: false, error: 'Draft não encontrado' });
    return res.json({ success: true, data: draft });
  });

  return router;
}

function createTestApp(db: MockDB) {
  const app = express();
  app.use('/public', createTestRouter(db));
  return app;
}

// ============================================================================
// TEST DATA
// ============================================================================

const FAMILY = {
  name: 'Família Teste',
  father: { name: 'Carlos Teste', email: 'carlos@test.com', phone: '(31) 99111-2222' },
  mother: { name: 'Maria Teste', email: 'maria@test.com', phone: '(31) 99333-4444' },
  student: { fullName: 'Lucas Teste', dateOfBirth: '2016-03-15', gender: 'M', desiredGrade: '3rd Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua A', number: '1', complement: '', zipCode: '30000-000' },
};

const VALID_PAYLOAD = {
  enrollmentToken: 'will-be-set',
  enrollmentInfo: {
    academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
    personType: 'INDIVIDUAL', studentCpf: '123.456.789-00',
    studentIdNumber: 'MG-12.345.678', studentIdIssueDate: '2020-01-15', studentIdIssuer: 'SSP',
  },
  fatherUpdates: {
    email: 'f@t.com', phone: '31999990000', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
    dateOfBirth: '', education: '', religion: '',
    address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
  },
  motherUpdates: {
    email: 'm@t.com', phone: '31999991111', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
    dateOfBirth: '', education: '', religion: '',
    address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
    sameAddressAsOtherParent: true,
  },
  health: {
    weight: '35', height: '140', bloodType: 'O+',
    medicalConditions: ['NONE'], allergies: ['NONE'],
    feverMedications: ['DIPIRONA'], painMedications: ['IBUPROFENO'],
    hasHospitalizations: false, hasSeizures: false, hasEatingDisorder: false,
    medicalConditionsNotes: '', hospitalizationsNotes: '', seizuresNotes: '',
    allergiesNotes: '', feverMedicationOther: '', painMedicationOther: '',
    medicationRestrictions: '', regularMedications: '', eatingDisorderNotes: '', additionalHealthInfo: '',
  },
  emergencyContacts: [{ name: 'Tia', phone: '31999990000', email: '', relationship: 'TIA', isPrimary: true }],
  healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
  transport: {
    dropoffPickupPersons: ['FATHER'], transportMethod: 'CAR',
    familyVehicles: [{ model: 'Civic', color: 'Silver', plate: 'ABC1234' }],
    canLeaveAlone: false, isAthlete: false, athleteSchedule: {},
    schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
    hasLegalRestrictions: false, legalRestrictionsNotes: '',
    allowThirdPartyPickup: false, authorizedPersons: [],
  },
  financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
  termsAccepted: true as const,
};

function makePayload(enrollmentToken: string, overrides: Record<string, any> = {}) {
  return { ...VALID_PAYLOAD, enrollmentToken, ...overrides };
}

// ============================================================================
// TESTS
// ============================================================================

// ============================================================================
// 1. BOUNDARY: Document Limits
// ============================================================================

describe('Boundary: Document Limits', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should accept exactly 50 documents (boundary)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 49);
    expect(lead.enrollmentDocuments.length).toBe(49);

    // 50th upload
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('content'), 'doc_50.pdf')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(lead.enrollmentDocuments.length).toBe(50);
  });

  it('should reject 51st document', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 50);
    expect(lead.enrollmentDocuments.length).toBe(50);

    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('fail'), 'doc_51.pdf')
      .expect(400);

    expect(res.body.code).toBe('DOCUMENT_LIMIT_EXCEEDED');
    expect(lead.enrollmentDocuments.length).toBe(50);
  });

  it('should handle upload after delete (50 -> delete 1 -> upload 1 = 50 again)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 50);
    const docToDelete = lead.enrollmentDocuments[0].id;

    // Delete 1
    await request(app)
      .delete(`/public/enrollment/${enrollmentToken}/documents/${docToDelete}`)
      .expect(200);

    expect(lead.enrollmentDocuments.length).toBe(49);

    // Upload 1 (should succeed, now 50 again)
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('replacement'), 'replacement.pdf')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(lead.enrollmentDocuments.length).toBe(50);
  });

  it('should handle batch upload of 10 files at once', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    const req = request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT');

    for (let i = 0; i < 10; i++) {
      req.attach('files', Buffer.from(`content-${i}`), `batch_${i}.pdf`);
    }

    const res = await req.expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(10);
    expect(lead.enrollmentDocuments.length).toBe(10);
  });

  it('should handle upload of 10 files when 41 exist (41 + 10 = 51 -> REJECT)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 41);

    const req = request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT');

    for (let i = 0; i < 10; i++) {
      req.attach('files', Buffer.from(`content-${i}`), `batch_${i}.pdf`);
    }

    const res = await req.expect(400);
    expect(res.body.code).toBe('DOCUMENT_LIMIT_EXCEEDED');
    expect(lead.enrollmentDocuments.length).toBe(41); // unchanged
  });

  it('should handle upload of 10 files when 40 exist (40 + 10 = 50 -> ACCEPT)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 40);

    const req = request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT');

    for (let i = 0; i < 10; i++) {
      req.attach('files', Buffer.from(`content-${i}`), `batch_${i}.pdf`);
    }

    const res = await req.expect(201);
    expect(res.body.success).toBe(true);
    expect(lead.enrollmentDocuments.length).toBe(50);
  });

  it('should track document count across multiple upload requests', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Upload 20 in 4 batches of 5
    for (let batch = 0; batch < 4; batch++) {
      const req = request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT');

      for (let i = 0; i < 5; i++) {
        req.attach('files', Buffer.from(`b${batch}-f${i}`), `b${batch}_f${i}.pdf`);
      }

      await req.expect(201);
    }

    expect(lead.enrollmentDocuments.length).toBe(20);
  });

  it('should reset count correctly after bulk deletion', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    db.addDocuments(lead.id, 50);

    // Delete all 50 documents
    const docIds = lead.enrollmentDocuments.map(d => d.id);
    for (const docId of docIds) {
      await request(app)
        .delete(`/public/enrollment/${enrollmentToken}/documents/${docId}`)
        .expect(200);
    }

    expect(lead.enrollmentDocuments.length).toBe(0);

    // Now upload 5 new ones
    const req = request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT');

    for (let i = 0; i < 5; i++) {
      req.attach('files', Buffer.from(`new-${i}`), `new_${i}.pdf`);
    }

    const res = await req.expect(201);
    expect(res.body.success).toBe(true);
    expect(lead.enrollmentDocuments.length).toBe(5);
  });
});

// ============================================================================
// 2. BOUNDARY: Submission Count
// ============================================================================

describe('Boundary: Submission Count', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should accept submission #1 through #5', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    for (let i = 1; i <= 5; i++) {
      // Reset enrollmentInfo and childHealth to avoid accumulation issues
      lead.enrollmentInfo = [];
      lead.childHealth = [];

      const res = await request(app)
        .post('/public/enrollment')
        .send(makePayload(enrollmentToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(lead.enrollmentSubmissionCount).toBe(i);
    }
  });

  it('should reject submission #6', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    lead.enrollmentSubmissionCount = 5;

    const res = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(429);

    expect(res.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
    expect(lead.enrollmentSubmissionCount).toBe(5); // unchanged
  });

  it('should track enrollment and admission counts independently', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    const appToken = lead.applicationToken!;

    // Set admission count to 3
    lead.formSubmissionCount = 3;

    // Submit enrollment (should succeed, enrollment count is 0)
    const res = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(lead.enrollmentSubmissionCount).toBe(1);
    expect(lead.formSubmissionCount).toBe(3); // unchanged
  });

  it('should allow 5 admission submissions + 5 enrollment submissions (independent limits)', async () => {
    const lead = db.createLead('Família Independente');
    const appToken = db.generateApplicationToken(lead.id);

    // 5 admission submissions
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken: appToken,
          students: [FAMILY.student],
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
        });
    }

    expect(lead.formSubmissionCount).toBe(5);

    // Generate enrollment token (admission already completed)
    const enrollmentToken = db.generateEnrollmentToken(lead.id);

    // 5 enrollment submissions
    for (let i = 0; i < 5; i++) {
      lead.enrollmentInfo = [];
      lead.childHealth = [];

      const res = await request(app)
        .post('/public/enrollment')
        .send(makePayload(enrollmentToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    }

    expect(lead.enrollmentSubmissionCount).toBe(5);
    expect(lead.formSubmissionCount).toBe(5);
  });

  it('should correctly report count in error response', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    lead.enrollmentSubmissionCount = 5;

    const res = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(429);

    expect(res.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
    expect(res.body.count).toBe(5);
  });

  it('should handle count at exact boundary (count=4 -> accept, count=5 -> reject)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // count=4 -> accept (#5)
    lead.enrollmentSubmissionCount = 4;
    lead.enrollmentInfo = [];
    lead.childHealth = [];
    const res1 = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(200);
    expect(res1.body.success).toBe(true);
    expect(lead.enrollmentSubmissionCount).toBe(5);

    // count=5 -> reject (#6)
    const res2 = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(429);
    expect(res2.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
  });
});

// ============================================================================
// 3. BOUNDARY: Token Expiry Edge Cases
// ============================================================================

describe('Boundary: Token Expiry Edge Cases', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should accept token 1 second before expiry', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    // Set token to expire 1 second from now
    lead.enrollmentTokenExpires = new Date(Date.now() + 1000);

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject token 1 second after expiry', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    // Set token to have expired 1 second ago
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);

    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should handle token expiry during a sequence of operations', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // First operation: token is valid
    lead.enrollmentTokenExpires = new Date(Date.now() + 5000);
    const res1 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);
    expect(res1.body.success).toBe(true);

    // Simulate token expiring between operations
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);

    // Second operation: token is now expired
    const res2 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);
    expect(res2.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should accept freshly generated token', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.leadCode).toBeDefined();
  });

  it('should reject token with past expiry date', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    // Set expiry to 24 hours ago
    lead.enrollmentTokenExpires = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);

    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should handle null expiry date gracefully', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    // Set expiry to null (should not block — the check is `expires && now > expires`)
    lead.enrollmentTokenExpires = null;

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

// ============================================================================
// 4. STRESS: Large Payloads
// ============================================================================

describe('Stress: Large Payloads', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle enrollment payload with 10 emergency contacts', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    const contacts = Array.from({ length: 10 }, (_, i) => ({
      name: `Contact ${i + 1}`,
      phone: `3199999${String(i).padStart(4, '0')}`,
      email: `contact${i}@test.com`,
      relationship: 'OTHER',
      isPrimary: i === 0,
    }));

    const res = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken, { emergencyContacts: contacts }))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(lead.emergencyContacts).toHaveLength(10);
  });

  it('should handle enrollment payload with 5 children in childrenData', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Add 4 more children to the lead (already has 1)
    for (let i = 1; i < 5; i++) {
      lead.children.push({
        id: db.generateId(),
        leadId: lead.id,
        fullName: `Child ${i + 1}`,
        dateOfBirth: '2016-01-01',
        gender: 'M',
        desiredGrade: `Grade ${i + 1}`,
        studentType: 'NEW',
        primaryLanguage: 'Portuguese',
        otherLanguages: [],
        relationship: 'STUDENT',
        isApplicant: true,
      });
    }

    const childrenData = lead.children.map(c => ({
      childId: c.id,
      enrollmentInfo: {
        personType: 'INDIVIDUAL',
        studentCpf: `111.222.333-${String(lead.children.indexOf(c)).padStart(2, '0')}`,
        studentIdNumber: `MG-${c.id}`,
        studentIdIssueDate: '2020-01-01',
        studentIdIssuer: 'SSP',
      },
      health: {
        weight: '35', height: '140', bloodType: 'O+',
        medicalConditions: ['NONE'], allergies: ['NONE'],
        feverMedications: ['DIPIRONA'], painMedications: ['IBUPROFENO'],
        hasHospitalizations: false, hasSeizures: false, hasEatingDisorder: false,
      },
    }));

    const payload = makePayload(enrollmentToken, {
      childrenData,
      enrollmentInfo: undefined,
      health: undefined,
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(lead.enrollmentInfo).toHaveLength(5);
    expect(lead.childHealth).toHaveLength(5);
  });

  it('should handle very long strings in all optional fields (5000 chars each)', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();
    const longStr = 'A'.repeat(5000);

    const payload = makePayload(enrollmentToken, {
      health: {
        ...VALID_PAYLOAD.health,
        medicalConditionsNotes: longStr,
        hospitalizationsNotes: longStr,
        seizuresNotes: longStr,
        allergiesNotes: longStr,
        feverMedicationOther: longStr,
        painMedicationOther: longStr,
        medicationRestrictions: longStr,
        regularMedications: longStr,
        eatingDisorderNotes: longStr,
        additionalHealthInfo: longStr,
      },
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should handle health data with 20 items in medicalConditions array', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const conditions = Array.from({ length: 20 }, (_, i) => `CONDITION_${i + 1}`);
    const payload = makePayload(enrollmentToken, {
      health: { ...VALID_PAYLOAD.health, medicalConditions: conditions },
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should handle transport with 10 authorized persons', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const authorizedPersons = Array.from({ length: 10 }, (_, i) => ({
      name: `Person ${i + 1}`,
      dateOfBirth: '1980-01-01',
      cpf: `111.222.333-${String(i).padStart(2, '0')}`,
      email: `person${i}@test.com`,
      bond: 'OTHER',
      vehicle: { model: `Car ${i}`, color: 'Black', plate: `ABC${i}234` },
    }));

    const payload = makePayload(enrollmentToken, {
      transport: {
        ...VALID_PAYLOAD.transport,
        dropoffPickupPersons: ['FATHER', 'THIRD_PARTY'],
        authorizedPersons,
      },
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should handle transport with 10 family vehicles', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const familyVehicles = Array.from({ length: 10 }, (_, i) => ({
      model: `Vehicle ${i + 1}`,
      color: `Color ${i + 1}`,
      plate: `PLT${String(i).padStart(4, '0')}`,
    }));

    const payload = makePayload(enrollmentToken, {
      transport: {
        ...VALID_PAYLOAD.transport,
        familyVehicles,
      },
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

// ============================================================================
// 5. STRESS: Concurrent Operations
// ============================================================================

describe('Stress: Concurrent Operations', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle 10 parallel document uploads', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    const uploads = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT')
        .attach('files', Buffer.from(`parallel-${i}`), `parallel_${i}.pdf`)
    );

    const results = await Promise.all(uploads);

    // All should succeed
    results.forEach(res => {
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    expect(lead.enrollmentDocuments.length).toBe(10);
  });

  it('should handle 5 parallel form submissions (only first 5 succeed, 6th rejected)', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Submit 5 in parallel
    const submissions = Array.from({ length: 5 }, () =>
      request(app)
        .post('/public/enrollment')
        .send(makePayload(enrollmentToken))
    );

    const results = await Promise.all(submissions);

    // Count successes - in this synchronous mock, all 5 may succeed
    // because they all see count < 5 before any increments
    // With real DB transactions, only some would succeed
    const successes = results.filter(r => r.status === 200).length;
    const rejections = results.filter(r => r.status === 429).length;

    // At minimum some should succeed, total should be 5
    expect(successes + rejections).toBe(5);
    expect(successes).toBeGreaterThanOrEqual(1);

    // After all submissions, try 6th
    lead.enrollmentSubmissionCount = 5; // ensure count is at max
    lead.enrollmentInfo = [];
    lead.childHealth = [];

    const res6 = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(429);

    expect(res6.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
  });

  it('should handle parallel upload + delete operations', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Pre-upload 5 documents
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT')
        .attach('files', Buffer.from(`pre-${i}`), `pre_${i}.pdf`);
    }

    expect(lead.enrollmentDocuments.length).toBe(5);

    const docToDelete = lead.enrollmentDocuments[0].id;

    // Parallel: upload 2 new + delete 1 existing
    const [uploadRes1, uploadRes2, deleteRes] = await Promise.all([
      request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT')
        .attach('files', Buffer.from('new-1'), 'new_1.pdf'),
      request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT')
        .attach('files', Buffer.from('new-2'), 'new_2.pdf'),
      request(app)
        .delete(`/public/enrollment/${enrollmentToken}/documents/${docToDelete}`),
    ]);

    expect(uploadRes1.status).toBe(201);
    expect(uploadRes2.status).toBe(201);
    expect(deleteRes.status).toBe(200);

    // 5 - 1 + 2 = 6
    expect(lead.enrollmentDocuments.length).toBe(6);
  });

  it('should handle parallel pre-fill requests', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const requests = Array.from({ length: 10 }, () =>
      request(app).get(`/public/enrollment/${enrollmentToken}`)
    );

    const results = await Promise.all(requests);

    results.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBeDefined();
    });
  });

  it('should handle rapid sequential submissions', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Rapidly submit 5 sequentially
    for (let i = 0; i < 5; i++) {
      lead.enrollmentInfo = [];
      lead.childHealth = [];
      const res = await request(app)
        .post('/public/enrollment')
        .send(makePayload(enrollmentToken));
      expect(res.status).toBe(200);
    }

    expect(lead.enrollmentSubmissionCount).toBe(5);

    // 6th should fail
    const res6 = await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(429);

    expect(res6.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
  });
});

// ============================================================================
// 6. BOUNDARY: Empty and Null Edge Cases
// ============================================================================

describe('Boundary: Empty and Null Edge Cases', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle completely empty body on POST /enrollment', async () => {
    const res = await request(app)
      .post('/public/enrollment')
      .send('')
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should handle null values in optional fields', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const payload = makePayload(enrollmentToken, {
      healthPlan: { operator: null, beneficiaryCode: null, planType: null, preferredHospital: null },
    });

    // Zod will either coerce null -> '' or reject; either way it should not crash
    const res = await request(app)
      .post('/public/enrollment')
      .send(payload);

    // Should be 400 (validation error) or 200 (if Zod defaults handle it)
    expect([200, 400]).toContain(res.status);
    expect(res.body).toHaveProperty('success');
  });

  it('should handle empty object on POST /enrollment', async () => {
    const res = await request(app)
      .post('/public/enrollment')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should handle array of empty objects in emergencyContacts', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const payload = makePayload(enrollmentToken, {
      emergencyContacts: [{ name: '', phone: '', email: '', relationship: '', isPrimary: false }],
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    // name and phone are required (min(1))
    expect(res.body.details.some((d: any) => d.path.includes('name') || d.path.includes('phone'))).toBe(true);
  });

  it('should handle undefined nested objects', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const payload = {
      enrollmentToken,
      enrollmentInfo: VALID_PAYLOAD.enrollmentInfo,
      // fatherUpdates: undefined (omitted)
      // motherUpdates: undefined (omitted)
      health: VALID_PAYLOAD.health,
      emergencyContacts: VALID_PAYLOAD.emergencyContacts,
      transport: VALID_PAYLOAD.transport,
      financialResponsible: VALID_PAYLOAD.financialResponsible,
      termsAccepted: true as const,
    };

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    // fatherUpdates and motherUpdates are optional in the schema
    expect(res.body.success).toBe(true);
  });

  it('should handle missing Content-Type header', async () => {
    const res = await request(app)
      .post('/public/enrollment')
      .send('this is not json')
      .set('Content-Type', 'text/plain');

    // express.json() will not parse text/plain, resulting in empty body
    expect([400, 415]).toContain(res.status);
  });

  it('should handle valid JSON but wrong structure', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const res = await request(app)
      .post('/public/enrollment')
      .send({
        enrollmentToken,
        someRandomField: 'value',
        anotherField: 123,
        termsAccepted: 'not-a-boolean',
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should handle numeric values where strings expected', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const payload = makePayload(enrollmentToken, {
      enrollmentInfo: {
        ...VALID_PAYLOAD.enrollmentInfo,
        studentCpf: 12345678900, // number instead of string
        studentIdNumber: 12345678,
      },
    });

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ============================================================================
// 7. BOUNDARY: Token Format Edge Cases
// ============================================================================

describe('Boundary: Token Format Edge Cases', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle token with special characters (&, =, ?, #)', async () => {
    const res = await request(app)
      .get('/public/enrollment/token&with=special?chars#here')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should handle very short token (1 char)', async () => {
    const res = await request(app)
      .get('/public/enrollment/x')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should handle token with spaces', async () => {
    const res = await request(app)
      .get('/public/enrollment/token%20with%20spaces')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should handle token with newlines and tabs', async () => {
    const res = await request(app)
      .get('/public/enrollment/token%0Awith%09tabs')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should handle URL-encoded token in path', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // URL-encode the actual token
    const encoded = encodeURIComponent(enrollmentToken);

    const res = await request(app)
      .get(`/public/enrollment/${encoded}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should differentiate between similar tokens (differ by 1 char)', async () => {
    const { lead: lead1, enrollmentToken: token1 } = db.setupEnrolledLead('Família 1');
    const { lead: lead2, enrollmentToken: token2 } = db.setupEnrolledLead('Família 2');

    // tokens are crypto-random, so they naturally differ
    expect(token1).not.toBe(token2);

    const res1 = await request(app).get(`/public/enrollment/${token1}`).expect(200);
    const res2 = await request(app).get(`/public/enrollment/${token2}`).expect(200);

    expect(res1.body.data.familyName).toBe('Família 1');
    expect(res2.body.data.familyName).toBe('Família 2');

    // Slightly modified token should be 404
    const modifiedToken = token1.slice(0, -1) + (token1.slice(-1) === '0' ? '1' : '0');
    if (modifiedToken !== token2) {
      const res3 = await request(app).get(`/public/enrollment/${modifiedToken}`).expect(404);
      expect(res3.body.code).toBe('TOKEN_NOT_FOUND');
    }
  });
});

// ============================================================================
// 8. STRESS: Draft Operations
// ============================================================================

describe('Stress: Draft Operations', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should handle 100 draft save/restore cycles', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    for (let i = 0; i < 100; i++) {
      // Save
      await request(app)
        .put(`/public/form-draft/${enrollmentToken}`)
        .send({
          formType: 'ENROLLMENT',
          data: { step: i, value: `cycle-${i}` },
          step: (i % 7) + 1,
        })
        .expect(200);

      // Restore
      const res = await request(app)
        .get(`/public/form-draft/${enrollmentToken}?type=ENROLLMENT`)
        .expect(200);

      expect(res.body.data.data.value).toBe(`cycle-${i}`);
      expect(res.body.data.step).toBe((i % 7) + 1);
    }
  });

  it('should handle large draft data (50KB)', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // Generate ~50KB of draft data
    const bigData: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      bigData[`field_${i}`] = 'X'.repeat(1024); // 1KB per field
    }

    const saveRes = await request(app)
      .put(`/public/form-draft/${enrollmentToken}`)
      .send({
        formType: 'ENROLLMENT',
        data: bigData,
        step: 3,
      })
      .expect(200);

    expect(saveRes.body.success).toBe(true);

    const restoreRes = await request(app)
      .get(`/public/form-draft/${enrollmentToken}?type=ENROLLMENT`)
      .expect(200);

    expect(Object.keys(restoreRes.body.data.data)).toHaveLength(50);
    expect(restoreRes.body.data.data.field_0.length).toBe(1024);
  });

  it('should handle concurrent draft saves', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // Save 10 drafts in parallel
    const saves = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .put(`/public/form-draft/${enrollmentToken}`)
        .send({
          formType: 'ENROLLMENT',
          data: { concurrent: i },
          step: (i % 7) + 1,
        })
    );

    const results = await Promise.all(saves);
    results.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    // Last write wins
    const restoreRes = await request(app)
      .get(`/public/form-draft/${enrollmentToken}?type=ENROLLMENT`)
      .expect(200);

    expect(restoreRes.body.data.data).toHaveProperty('concurrent');
  });

  it('should handle draft save after form submission', async () => {
    const { lead, enrollmentToken } = db.setupEnrolledLead();

    // Submit form first
    await request(app)
      .post('/public/enrollment')
      .send(makePayload(enrollmentToken))
      .expect(200);

    expect(lead.enrollmentSubmissionCount).toBe(1);

    // Save draft after submission (should still work — drafts are independent)
    const saveRes = await request(app)
      .put(`/public/form-draft/${enrollmentToken}`)
      .send({
        formType: 'ENROLLMENT',
        data: { afterSubmission: true },
        step: 5,
      })
      .expect(200);

    expect(saveRes.body.success).toBe(true);

    const restoreRes = await request(app)
      .get(`/public/form-draft/${enrollmentToken}?type=ENROLLMENT`)
      .expect(200);

    expect(restoreRes.body.data.data.afterSubmission).toBe(true);
  });

  it('should handle different draft types (ADMISSION vs ENROLLMENT)', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // Save ADMISSION draft
    await request(app)
      .put(`/public/form-draft/${enrollmentToken}`)
      .send({
        formType: 'ADMISSION',
        data: { type: 'admission-draft' },
        step: 2,
      })
      .expect(200);

    // Save ENROLLMENT draft
    await request(app)
      .put(`/public/form-draft/${enrollmentToken}`)
      .send({
        formType: 'ENROLLMENT',
        data: { type: 'enrollment-draft' },
        step: 4,
      })
      .expect(200);

    // Restore ADMISSION draft
    const admissionDraft = await request(app)
      .get(`/public/form-draft/${enrollmentToken}?type=ADMISSION`)
      .expect(200);

    expect(admissionDraft.body.data.data.type).toBe('admission-draft');
    expect(admissionDraft.body.data.step).toBe(2);

    // Restore ENROLLMENT draft
    const enrollmentDraft = await request(app)
      .get(`/public/form-draft/${enrollmentToken}?type=ENROLLMENT`)
      .expect(200);

    expect(enrollmentDraft.body.data.data.type).toBe('enrollment-draft');
    expect(enrollmentDraft.body.data.step).toBe(4);
  });
});

// ============================================================================
// 9. BOUNDARY: Response Format Consistency
// ============================================================================

describe('Boundary: Response Format Consistency', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should always include success field in response', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // 200 response
    const res200 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);
    expect(res200.body).toHaveProperty('success');

    // 404 response
    const res404 = await request(app)
      .get('/public/enrollment/nonexistent-token')
      .expect(404);
    expect(res404.body).toHaveProperty('success');

    // 400 response
    const res400 = await request(app)
      .post('/public/enrollment')
      .send({})
      .expect(400);
    expect(res400.body).toHaveProperty('success');
  });

  it('should include error field on 4xx responses', async () => {
    // 404
    const res404 = await request(app)
      .get('/public/enrollment/nonexistent')
      .expect(404);
    expect(res404.body).toHaveProperty('error');
    expect(res404.body.success).toBe(false);

    // 400
    const res400 = await request(app)
      .post('/public/enrollment')
      .send({})
      .expect(400);
    expect(res400.body).toHaveProperty('error');
    expect(res400.body.success).toBe(false);

    // 410
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);
    const res410 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);
    expect(res410.body).toHaveProperty('error');
    expect(res410.body.success).toBe(false);
  });

  it('should include data field on 2xx responses', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // GET pre-fill
    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should include code field on error responses', async () => {
    // TOKEN_NOT_FOUND
    const res404 = await request(app)
      .get('/public/enrollment/nonexistent')
      .expect(404);
    expect(res404.body).toHaveProperty('code', 'TOKEN_NOT_FOUND');

    // VALIDATION_ERROR
    const res400 = await request(app)
      .post('/public/enrollment')
      .send({})
      .expect(400);
    expect(res400.body).toHaveProperty('code', 'VALIDATION_ERROR');

    // TOKEN_EXPIRED
    const { lead, enrollmentToken } = db.setupEnrolledLead();
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);
    const res410 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);
    expect(res410.body).toHaveProperty('code', 'TOKEN_EXPIRED');

    // MAX_SUBMISSIONS_EXCEEDED
    const { lead: lead2, enrollmentToken: token2 } = db.setupEnrolledLead();
    lead2.enrollmentSubmissionCount = 5;
    const res429 = await request(app)
      .post('/public/enrollment')
      .send(makePayload(token2))
      .expect(429);
    expect(res429.body).toHaveProperty('code', 'MAX_SUBMISSIONS_EXCEEDED');
  });

  it('should return proper JSON Content-Type', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should handle Accept header variations', async () => {
    const { enrollmentToken } = db.setupEnrolledLead();

    // Accept: application/json
    const res1 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .set('Accept', 'application/json')
      .expect(200);
    expect(res1.body.success).toBe(true);

    // Accept: */*
    const res2 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .set('Accept', '*/*')
      .expect(200);
    expect(res2.body.success).toBe(true);

    // Accept: text/html (Express still returns JSON from res.json())
    const res3 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .set('Accept', 'text/html')
      .expect(200);
    expect(res3.body.success).toBe(true);
  });
});
