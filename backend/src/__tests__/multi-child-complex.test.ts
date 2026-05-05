/**
 * Multi-Child Complex Scenarios Tests
 *
 * Tests complex MULTI-CHILD scenarios including:
 *   - Per-child health data isolation
 *   - Per-child document isolation
 *   - Per-child enrollment info
 *   - Asymmetric children data
 *   - Sibling handling edge cases
 *   - Parent data shared across children
 *   - Document upload order independence
 *   - Zod validation with childrenData
 *
 * Uses the same mock in-memory database pattern as e2e-enrollment-flow.test.ts.
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
}

// ============================================================================
// CREATE FULL E2E TEST ROUTER
// ============================================================================

function createE2ERouter(db: MockDB) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // GET /application/:token
  router.get('/application/:token', (req: Request, res: Response) => {
    const lead = db.findLeadByApplicationToken(req.params.token);
    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.json({
      success: true,
      data: {
        leadCode: lead.code,
        familyName: lead.familyName,
        students: lead.children.filter(c => c.isApplicant).map(c => ({
          id: c.id, fullName: c.fullName, dateOfBirth: c.dateOfBirth, gender: c.gender,
          desiredGrade: c.desiredGrade, studentType: c.studentType, primaryLanguage: c.primaryLanguage,
        })),
        father: lead.parents.find(p => p.parentType === 'FATHER') || null,
        mother: lead.parents.find(p => p.parentType === 'MOTHER') || null,
        address: lead.address,
        documents: [],
      },
    });
  });

  // POST /admissions
  router.post('/admissions', express.json(), (req: Request, res: Response) => {
    const { applicationToken, students, student, father, mother, address, livesWith, siblings, source } = req.body;

    if (!applicationToken) {
      return res.status(400).json({ success: false, error: 'Token obrigatório', code: 'TOKEN_REQUIRED' });
    }

    const lead = db.findLeadByApplicationToken(applicationToken);
    if (!lead) return res.status(404).json({ success: false, error: 'Token inválido', code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (lead.formSubmissionCount >= 5) {
      return res.status(429).json({ success: false, error: 'Limite atingido', code: 'MAX_SUBMISSIONS_EXCEEDED' });
    }

    const studentList = students || (student ? [student] : []);
    if (studentList.length === 0) {
      return res.status(400).json({ success: false, error: 'Pelo menos um estudante obrigatório' });
    }
    if (!father?.name || !mother?.name) {
      return res.status(400).json({ success: false, error: 'Dados dos pais obrigatórios' });
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
      studentType: s.studentType,
      primaryLanguage: s.primaryLanguage,
      otherLanguages: s.otherLanguages || [],
      relationship: 'STUDENT',
      isApplicant: true,
      cpf: s.cpf,
    }));

    // Add siblings
    if (siblings?.length > 0) {
      for (const sib of siblings) {
        if (!sib.name || !sib.name.trim()) continue; // filter empty sibling names
        lead.children.push({
          id: db.generateId(),
          leadId: lead.id,
          fullName: sib.name,
          dateOfBirth: sib.dateOfBirth || '',
          gender: '',
          desiredGrade: sib.grade || '',
          studentType: '',
          primaryLanguage: '',
          otherLanguages: [],
          relationship: 'SIBLING',
          isApplicant: false,
          cpf: sib.cpf,
        });
      }
    }

    // Create parent records
    lead.parents = [
      {
        id: db.generateId(), leadId: lead.id, parentType: 'FATHER',
        fullName: father.name, email: father.email, phone: father.phone,
        cpf: father.cpf, ...({} as any),
      },
      {
        id: db.generateId(), leadId: lead.id, parentType: 'MOTHER',
        fullName: mother.name, email: mother.email, phone: mother.phone,
        cpf: mother.cpf, ...({} as any),
      },
    ];

    lead.address = address || null;
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount++;

    const isUpdate = lead.formSubmissionCount > 1;
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Dados atualizados' : 'Inscrição recebida',
      data: { leadCode: lead.code },
    });
  });

  // GET /enrollment/:token
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

  // POST /enrollment/:token/documents
  router.post('/enrollment/:token/documents', upload.array('files', 10), (req: Request, res: Response) => {
    const lead = db.findLeadByEnrollmentToken(req.params.token);
    if (!lead) return res.status(404).json({ success: false, code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, code: 'ADMISSION_NOT_COMPLETED' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, error: 'Nenhum arquivo' });

    const { documentType, category, childId, includesOtherDocs } = req.body;

    // Check doc limit (across ALL children)
    if (lead.enrollmentDocuments.length + files.length > 50) {
      return res.status(400).json({ success: false, error: 'Limite de docs atingido', code: 'DOCUMENT_LIMIT_EXCEEDED' });
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
    if (!lead) return res.status(400).json({ success: false });

    const idx = lead.enrollmentDocuments.findIndex(d => d.id === req.params.documentId);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Documento não encontrado' });

    const doc = lead.enrollmentDocuments[idx];
    if (doc.leadId !== lead.id) return res.status(403).json({ success: false });

    lead.enrollmentDocuments.splice(idx, 1);
    return res.json({ success: true, message: 'Documento removido' });
  });

  // POST /enrollment - Submit enrollment form
  router.post('/enrollment', express.json(), (req: Request, res: Response) => {
    const body = req.body;

    const zodResult = publicEnrollmentSchema.safeParse(body);
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

    if (!lead) return res.status(404).json({ success: false, code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, code: 'TOKEN_EXPIRED' });
    }
    if (lead.enrollmentSubmissionCount >= 5) {
      return res.status(429).json({ success: false, code: 'MAX_SUBMISSIONS_EXCEEDED' });
    }
    if (!data.termsAccepted) {
      return res.status(400).json({ success: false, code: 'TERMS_NOT_ACCEPTED' });
    }

    const applicants = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
    if (applicants.length === 0) {
      return res.status(400).json({ success: false, code: 'APPLICANT_NOT_FOUND' });
    }

    // --- PERSIST DATA ---

    // Update parent data
    const father = lead.parents.find(p => p.parentType === 'FATHER');
    const mother = lead.parents.find(p => p.parentType === 'MOTHER');
    if (father && data.fatherUpdates) {
      Object.assign(father, {
        email: data.fatherUpdates.email || father.email,
        phone: data.fatherUpdates.phone || father.phone,
        cpf: data.fatherUpdates.cpf || father.cpf,
        idNumber: data.fatherUpdates.idNumber,
        idIssueDate: data.fatherUpdates.idIssueDate,
        idIssuer: data.fatherUpdates.idIssuer,
        dateOfBirth: data.fatherUpdates.dateOfBirth,
        education: data.fatherUpdates.education,
        religion: data.fatherUpdates.religion,
        ...(data.fatherUpdates.address ? {
          zipCode: data.fatherUpdates.address.zipCode,
          country: data.fatherUpdates.address.country,
          state: data.fatherUpdates.address.state,
          city: data.fatherUpdates.address.city,
          neighborhood: data.fatherUpdates.address.neighborhood,
          street: data.fatherUpdates.address.street,
          number: data.fatherUpdates.address.number,
          complement: data.fatherUpdates.address.complement,
        } : {}),
      });
    }
    if (mother && data.motherUpdates) {
      Object.assign(mother, {
        email: data.motherUpdates.email || mother.email,
        phone: data.motherUpdates.phone || mother.phone,
        cpf: data.motherUpdates.cpf || mother.cpf,
        idNumber: data.motherUpdates.idNumber,
        idIssueDate: data.motherUpdates.idIssueDate,
        idIssuer: data.motherUpdates.idIssuer,
        dateOfBirth: data.motherUpdates.dateOfBirth,
        education: data.motherUpdates.education,
        religion: data.motherUpdates.religion,
        ...(data.motherUpdates.address ? {
          zipCode: data.motherUpdates.address.zipCode,
          country: data.motherUpdates.address.country,
          state: data.motherUpdates.address.state,
          city: data.motherUpdates.address.city,
          neighborhood: data.motherUpdates.address.neighborhood,
          street: data.motherUpdates.address.street,
          number: data.motherUpdates.address.number,
          complement: data.motherUpdates.address.complement,
        } : {}),
        sameAddressAsOtherParent: data.motherUpdates.sameAddressAsOtherParent,
      });
    }

    // Per-child enrollment info & health (multi-child)
    if (data.childrenData && data.childrenData.length > 0) {
      for (const cd of data.childrenData) {
        if (cd.enrollmentInfo) {
          lead.enrollmentInfo.push({ childId: cd.childId, ...cd.enrollmentInfo, termsAccepted: data.termsAccepted });
        }
        if (cd.health) {
          lead.childHealth.push({ childId: cd.childId, ...cd.health } as MockChildHealth);
        }
      }
    } else {
      // Single-child
      const childId = applicants[0].id;
      if (data.enrollmentInfo) {
        lead.enrollmentInfo.push({ childId, ...data.enrollmentInfo, termsAccepted: data.termsAccepted });
      }
      if (data.health) {
        lead.childHealth.push({ childId, ...data.health } as MockChildHealth);
      }
    }

    // Emergency contacts
    lead.emergencyContacts = data.emergencyContacts.map((c: any) => ({
      id: db.generateId(), name: c.name, phone: c.phone,
      email: c.email || '', relationship: c.relationship || '', isPrimary: c.isPrimary ?? false,
    }));

    // Health plan
    lead.healthPlan = data.healthPlan as MockHealthPlan;

    // Transport
    lead.transport = data.transport as any;

    // Financial responsible
    lead.financialResponsible = data.financialResponsible as MockFinancialResponsible;

    // Update status
    lead.enrollmentStatus = 'FORM_RECEIVED';
    lead.enrollmentSubmissionCount++;
    lead.enrollmentSubmittedAt = new Date();

    return res.status(200).json({
      success: true,
      message: 'Matrícula enviada com sucesso',
      data: { leadCode: lead.code },
    });
  });

  return router;
}

function createE2EApp(db: MockDB) {
  const app = express();
  app.use('/public', createE2ERouter(db));
  return app;
}

// ============================================================================
// HELPERS
// ============================================================================

async function setupCompletedAdmission(db: MockDB, app: express.Application, students: any[], family: any) {
  const lead = db.createLead(family.name);
  const appToken = db.generateApplicationToken(lead.id);
  await request(app).post('/public/admissions').send({
    applicationToken: appToken, students, livesWith: 'BOTH_PARENTS',
    father: family.father, mother: family.mother, address: family.address,
    siblings: family.siblings || [], source: 'WEBSITE',
  });
  const enrollToken = db.generateEnrollmentToken(lead.id);
  return { lead, appToken, enrollToken };
}

// ============================================================================
// TEST DATA
// ============================================================================

const FAMILY_3_KIDS = {
  name: 'Família Oliveira',
  father: { name: 'Carlos Oliveira', email: 'carlos@test.com', phone: '(31) 99111-0000' },
  mother: { name: 'Patricia Oliveira', email: 'patricia@test.com', phone: '(31) 99222-0000' },
  students: [
    { fullName: 'Pedro Oliveira', dateOfBirth: '2013-03-10', gender: 'M', desiredGrade: '6th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
    { fullName: 'Ana Oliveira', dateOfBirth: '2016-07-22', gender: 'F', desiredGrade: '3rd Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
    { fullName: 'Luca Oliveira', dateOfBirth: '2019-11-05', gender: 'M', desiredGrade: 'Pre-K', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  ],
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
};

const VALID_FATHER_UPDATES = {
  email: 'carlos@test.com', phone: '(31) 99111-0000', cpf: '111.222.333-44',
  idNumber: 'MG-AAA', idIssueDate: '2014-01-01', idIssuer: 'SSP',
  dateOfBirth: '1980-01-01', education: 'SUPERIOR', religion: '',
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
};

const VALID_MOTHER_UPDATES = {
  email: 'patricia@test.com', phone: '(31) 99222-0000', cpf: '555.666.777-88',
  idNumber: 'MG-BBB', idIssueDate: '2015-01-01', idIssuer: 'SSP',
  dateOfBirth: '1983-05-15', education: 'SUPERIOR', religion: '',
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
  sameAddressAsOtherParent: true,
};

const VALID_TRANSPORT = {
  dropoffPickupPersons: ['FATHER', 'MOTHER'],
  dropoffPickupOther: '',
  transportMethod: 'CAR',
  transportMethodOther: '',
  familyVehicles: [{ model: 'Honda Civic', color: 'Prata', plate: 'ABC-1D23' }],
  canLeaveAlone: false,
  isAthlete: false,
  athleteSchedule: {},
  schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
  hasLegalRestrictions: false, legalRestrictionsNotes: '',
  allowThirdPartyPickup: false,
  authorizedPersons: [],
};

function makeHealthData(overrides: Partial<MockChildHealth> = {}): any {
  return {
    weight: '30', height: '130', bloodType: 'O+',
    medicalConditions: ['NONE'], medicalConditionsNotes: '',
    hasHospitalizations: false, hospitalizationsNotes: '',
    hasSeizures: false, seizuresNotes: '',
    allergies: ['NONE'], allergiesNotes: '',
    feverMedications: ['DIPIRONA'], feverMedicationOther: '',
    painMedications: ['IBUPROFENO'], painMedicationOther: '',
    medicationRestrictions: '', regularMedications: '',
    hasEatingDisorder: false, eatingDisorderNotes: '',
    additionalHealthInfo: '',
    ...overrides,
  };
}

function makeEnrollmentInfo(overrides: Record<string, any> = {}): any {
  return {
    personType: 'INDIVIDUAL',
    studentCpf: '111.222.333-44',
    studentIdNumber: 'MG-111',
    studentIdIssueDate: '2020-01-01',
    studentIdIssuer: 'SSP',
    ...overrides,
  };
}

function buildMultiChildPayload(enrollToken: string, childrenData: any[], extra: Record<string, any> = {}) {
  return {
    enrollmentToken: enrollToken,
    childrenData,
    fatherUpdates: VALID_FATHER_UPDATES,
    motherUpdates: VALID_MOTHER_UPDATES,
    emergencyContacts: [{ name: 'Tia Rosa', phone: '(31) 99999-0000', email: '', relationship: 'AUNT', isPrimary: true }],
    healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
    transport: VALID_TRANSPORT,
    financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
    termsAccepted: true as const,
    ...extra,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Multi-Child: Per-Child Health Data Isolation', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should store separate health data for each of 3 children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }), health: makeHealthData({ weight: '40', height: '150', bloodType: 'A+' }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }), health: makeHealthData({ weight: '28', height: '125', bloodType: 'O-' }) },
      { childId: children[2].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }), health: makeHealthData({ weight: '18', height: '100', bloodType: 'B+' }) },
    ]);

    const res = await request(app).post('/public/enrollment').send(payload).expect(200);
    expect(res.body.success).toBe(true);

    expect(lead.childHealth).toHaveLength(3);
    expect(lead.childHealth.find(h => h.childId === children[0].id)!.weight).toBe('40');
    expect(lead.childHealth.find(h => h.childId === children[1].id)!.weight).toBe('28');
    expect(lead.childHealth.find(h => h.childId === children[2].id)!.weight).toBe('18');
  });

  it('should not cross-contaminate allergies between children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }), health: makeHealthData({ allergies: ['PEANUTS'] }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }), health: makeHealthData({ allergies: ['NONE'] }) },
      { childId: children[2].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }), health: makeHealthData({ allergies: ['DUST'] }) },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const h0 = lead.childHealth.find(h => h.childId === children[0].id)!;
    const h1 = lead.childHealth.find(h => h.childId === children[1].id)!;
    const h2 = lead.childHealth.find(h => h.childId === children[2].id)!;

    expect(h0.allergies).toEqual(['PEANUTS']);
    expect(h1.allergies).toEqual(['NONE']);
    expect(h2.allergies).toEqual(['DUST']);

    // Cross-contamination checks
    expect(h0.allergies).not.toContain('DUST');
    expect(h1.allergies).not.toContain('PEANUTS');
    expect(h2.allergies).not.toContain('PEANUTS');
  });

  it('should not cross-contaminate blood types between children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }), health: makeHealthData({ bloodType: 'A+' }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }), health: makeHealthData({ bloodType: 'O-' }) },
      { childId: children[2].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }), health: makeHealthData({ bloodType: 'B+' }) },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.childHealth.find(h => h.childId === children[0].id)!.bloodType).toBe('A+');
    expect(lead.childHealth.find(h => h.childId === children[1].id)!.bloodType).toBe('O-');
    expect(lead.childHealth.find(h => h.childId === children[2].id)!.bloodType).toBe('B+');
  });

  it('should not cross-contaminate medications between children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }), health: makeHealthData({ feverMedications: ['DIPIRONA'], painMedications: ['IBUPROFENO'] }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }), health: makeHealthData({ feverMedications: ['PARACETAMOL'], painMedications: ['DIPIRONA'] }) },
      { childId: children[2].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }), health: makeHealthData({ feverMedications: ['IBUPROFENO'], painMedications: ['PARACETAMOL'] }) },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const h0 = lead.childHealth.find(h => h.childId === children[0].id)!;
    const h1 = lead.childHealth.find(h => h.childId === children[1].id)!;
    const h2 = lead.childHealth.find(h => h.childId === children[2].id)!;

    expect(h0.feverMedications).toEqual(['DIPIRONA']);
    expect(h1.feverMedications).toEqual(['PARACETAMOL']);
    expect(h2.feverMedications).toEqual(['IBUPROFENO']);

    expect(h0.painMedications).toEqual(['IBUPROFENO']);
    expect(h1.painMedications).toEqual(['DIPIRONA']);
    expect(h2.painMedications).toEqual(['PARACETAMOL']);
  });

  it('should handle child 0 with health conditions and child 1 with NONE', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData({
          medicalConditions: ['ASTHMA', 'DIABETES'],
          allergies: ['PEANUTS', 'LATEX'],
          hasHospitalizations: true,
          hasSeizures: true,
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData({
          medicalConditions: ['NONE'],
          allergies: ['NONE'],
          hasHospitalizations: false,
          hasSeizures: false,
        }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const h0 = lead.childHealth.find(h => h.childId === children[0].id)!;
    const h1 = lead.childHealth.find(h => h.childId === children[1].id)!;

    expect(h0.medicalConditions).toEqual(['ASTHMA', 'DIABETES']);
    expect(h0.allergies).toEqual(['PEANUTS', 'LATEX']);
    expect(h1.medicalConditions).toEqual(['NONE']);
    expect(h1.allergies).toEqual(['NONE']);
  });

  it('should handle all children with NONE conditions', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData({ medicalConditions: ['NONE'], allergies: ['NONE'] }),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    for (const child of children) {
      const health = lead.childHealth.find(h => h.childId === child.id)!;
      expect(health.medicalConditions).toEqual(['NONE']);
      expect(health.allergies).toEqual(['NONE']);
    }
  });

  it('should handle all children with different conditions', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const conditionSets = [
      { medicalConditions: ['ASTHMA'], allergies: ['PEANUTS'] },
      { medicalConditions: ['DIABETES'], allergies: ['DUST'] },
      { medicalConditions: ['EPILEPSY'], allergies: ['LATEX'] },
    ];

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(conditionSets[i]),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    for (let i = 0; i < children.length; i++) {
      const health = lead.childHealth.find(h => h.childId === children[i].id)!;
      expect(health.medicalConditions).toEqual(conditionSets[i].medicalConditions);
      expect(health.allergies).toEqual(conditionSets[i].allergies);
    }
  });

  it('should verify childId linkage is correct for each health record', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData({ weight: `${20 + i * 5}` }),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Verify every health record has a childId that matches an actual child
    for (const health of lead.childHealth) {
      const matchingChild = children.find(c => c.id === health.childId);
      expect(matchingChild).toBeDefined();
    }

    // Verify no duplicate childIds in health records
    const healthChildIds = lead.childHealth.map(h => h.childId);
    expect(new Set(healthChildIds).size).toBe(healthChildIds.length);
  });
});

// ============================================================================

describe('Multi-Child: Per-Child Document Isolation', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should upload documents to specific child by childId', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg-pedro'), 'rg_pedro.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(1);
    expect(lead.enrollmentDocuments[0].childId).toBe(children[0].id);
    expect(lead.enrollmentDocuments[0].fileName).toBe('rg_pedro.pdf');
  });

  it('should not leak child 0 documents to child 1', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload to child 0
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('doc-child0'), 'child0_rg.pdf')
      .expect(201);

    // Child 1 should have zero docs
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === children[1].id);
    expect(child1Docs).toHaveLength(0);
  });

  it('should not leak child 1 documents to child 0', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload to child 1
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'BIRTH_CERTIFICATE')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('doc-child1'), 'child1_cert.pdf')
      .expect(201);

    // Child 0 should have zero docs
    const child0Docs = lead.enrollmentDocuments.filter(d => d.childId === children[0].id);
    expect(child0Docs).toHaveLength(0);
  });

  it('should track document count per child independently', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload 3 docs to child 0
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/public/enrollment/${enrollToken}/documents`)
        .field('documentType', 'OTHER')
        .field('category', 'STUDENT')
        .field('childId', children[0].id)
        .attach('files', Buffer.from(`c0-doc-${i}`), `child0_doc${i}.pdf`)
        .expect(201);
    }

    // Upload 1 doc to child 1
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('c1-doc'), 'child1_doc.pdf')
      .expect(201);

    const child0Docs = lead.enrollmentDocuments.filter(d => d.childId === children[0].id);
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === children[1].id);

    expect(child0Docs).toHaveLength(3);
    expect(child1Docs).toHaveLength(1);
    expect(lead.enrollmentDocuments).toHaveLength(4);
  });

  it('should handle includesOtherDocs per child independently', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Child 0: STUDENT_ID includes STUDENT_CPF
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
      .attach('files', Buffer.from('rg0'), 'rg_child0.pdf')
      .expect(201);

    // Child 1: STUDENT_ID does NOT include STUDENT_CPF
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_child1.pdf')
      .expect(201);

    const child0Doc = lead.enrollmentDocuments.find(d => d.childId === children[0].id)!;
    const child1Doc = lead.enrollmentDocuments.find(d => d.childId === children[1].id)!;

    expect(child0Doc.includesOtherDocs).toEqual(['STUDENT_CPF']);
    expect(child1Doc.includesOtherDocs).toEqual([]);
  });

  it('should allow same documentType for different children', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Both children get STUDENT_ID
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_ana.pdf')
      .expect(201);

    const studentIds = lead.enrollmentDocuments.filter(d => d.documentType === 'STUDENT_ID');
    expect(studentIds).toHaveLength(2);
    expect(studentIds[0].childId).not.toBe(studentIds[1].childId);
  });

  it('should delete document from child 0 without affecting child 1', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload to child 0
    const res0 = await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    // Upload to child 1
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_ana.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(2);

    // Delete child 0's doc
    const docId0 = res0.body.data[0].id;
    await request(app)
      .delete(`/public/enrollment/${enrollToken}/documents/${docId0}`)
      .expect(200);

    expect(lead.enrollmentDocuments).toHaveLength(1);
    expect(lead.enrollmentDocuments[0].childId).toBe(children[1].id);
    expect(lead.enrollmentDocuments[0].fileName).toBe('rg_ana.pdf');
  });

  it('should delete document from child 1 without affecting child 0', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload to child 0
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    // Upload to child 1
    const res1 = await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'BIRTH_CERTIFICATE')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('cert1'), 'cert_ana.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(2);

    // Delete child 1's doc
    const docId1 = res1.body.data[0].id;
    await request(app)
      .delete(`/public/enrollment/${enrollToken}/documents/${docId1}`)
      .expect(200);

    expect(lead.enrollmentDocuments).toHaveLength(1);
    expect(lead.enrollmentDocuments[0].childId).toBe(children[0].id);
    expect(lead.enrollmentDocuments[0].fileName).toBe('rg_pedro.pdf');
  });

  it('should handle 3 children with different document sets', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Child 0: 3 docs
    const child0DocTypes = ['STUDENT_ID', 'BIRTH_CERTIFICATE', 'VACCINATION_CARD'];
    for (const dt of child0DocTypes) {
      await request(app)
        .post(`/public/enrollment/${enrollToken}/documents`)
        .field('documentType', dt)
        .field('category', 'STUDENT')
        .field('childId', children[0].id)
        .attach('files', Buffer.from(`${dt}-0`), `${dt.toLowerCase()}_pedro.pdf`)
        .expect(201);
    }

    // Child 1: 1 doc
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_ana.pdf')
      .expect(201);

    // Child 2: 2 docs
    for (const dt of ['STUDENT_ID', 'STUDENT_PHOTO']) {
      await request(app)
        .post(`/public/enrollment/${enrollToken}/documents`)
        .field('documentType', dt)
        .field('category', 'STUDENT')
        .field('childId', children[2].id)
        .attach('files', Buffer.from(`${dt}-2`), `${dt.toLowerCase()}_luca.pdf`)
        .expect(201);
    }

    expect(lead.enrollmentDocuments).toHaveLength(6);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[0].id)).toHaveLength(3);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[1].id)).toHaveLength(1);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[2].id)).toHaveLength(2);
  });

  it('should enforce 50 doc limit across ALL children (not per-child)', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Pre-fill 49 docs (25 for child 0, 24 for child 1)
    for (let i = 0; i < 25; i++) {
      lead.enrollmentDocuments.push({
        id: db.generateId(), leadId: lead.id, childId: children[0].id,
        documentType: 'OTHER', category: 'STUDENT', fileName: `c0_doc_${i}.pdf`,
        fileUrl: `https://test/${i}`, fileSize: 1000, mimeType: 'application/pdf',
        includesOtherDocs: [], status: 'PENDING', uploadedAt: new Date().toISOString(),
      });
    }
    for (let i = 0; i < 24; i++) {
      lead.enrollmentDocuments.push({
        id: db.generateId(), leadId: lead.id, childId: children[1].id,
        documentType: 'OTHER', category: 'STUDENT', fileName: `c1_doc_${i}.pdf`,
        fileUrl: `https://test/${i}`, fileSize: 1000, mimeType: 'application/pdf',
        includesOtherDocs: [], status: 'PENDING', uploadedAt: new Date().toISOString(),
      });
    }

    expect(lead.enrollmentDocuments).toHaveLength(49);

    // 50th doc should succeed (for child 1)
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('ok'), 'doc_50.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(50);

    // 51st doc should fail (limit is 50 across ALL children)
    const res = await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('fail'), 'doc_51.pdf')
      .expect(400);

    expect(res.body.code).toBe('DOCUMENT_LIMIT_EXCEEDED');
    expect(lead.enrollmentDocuments).toHaveLength(50);
  });
});

// ============================================================================

describe('Multi-Child: Per-Child Enrollment Info', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should store different studentCpf for each child', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }), health: makeHealthData() },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }), health: makeHealthData() },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo).toHaveLength(2);
    expect(lead.enrollmentInfo.find(e => e.childId === children[0].id)!.studentCpf).toBe('111.111.111-11');
    expect(lead.enrollmentInfo.find(e => e.childId === children[1].id)!.studentCpf).toBe('222.222.222-22');
  });

  it('should store different studentIdNumber for each child', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentIdNumber: 'MG-PEDRO-001' }), health: makeHealthData() },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentIdNumber: 'MG-ANA-002' }), health: makeHealthData() },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo.find(e => e.childId === children[0].id)!.studentIdNumber).toBe('MG-PEDRO-001');
    expect(lead.enrollmentInfo.find(e => e.childId === children[1].id)!.studentIdNumber).toBe('MG-ANA-002');
  });

  it('should handle child with enrollmentInfo but no health', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }), health: makeHealthData() },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo).toHaveLength(2);
    expect(lead.childHealth).toHaveLength(1);
    expect(lead.childHealth[0].childId).toBe(children[1].id);
  });

  it('should handle child with health but no enrollmentInfo', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, health: makeHealthData({ bloodType: 'AB+' }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }), health: makeHealthData() },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo).toHaveLength(1);
    expect(lead.enrollmentInfo[0].childId).toBe(children[1].id);
    expect(lead.childHealth).toHaveLength(2);
    expect(lead.childHealth.find(h => h.childId === children[0].id)!.bloodType).toBe('AB+');
  });

  it('should handle 3 children with completely different enrollment data', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ personType: 'INDIVIDUAL', studentCpf: '111.111.111-11', studentIdNumber: 'MG-001', studentIdIssueDate: '2018-01-01', studentIdIssuer: 'SSP' }),
        health: makeHealthData({ weight: '45', height: '160', bloodType: 'A+' }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ personType: 'INDIVIDUAL', studentCpf: '222.222.222-22', studentIdNumber: 'MG-002', studentIdIssueDate: '2019-06-15', studentIdIssuer: 'DETRAN' }),
        health: makeHealthData({ weight: '30', height: '130', bloodType: 'O-' }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ personType: 'INDIVIDUAL', studentCpf: '333.333.333-33', studentIdNumber: 'MG-003', studentIdIssueDate: '2021-12-25', studentIdIssuer: 'PF' }),
        health: makeHealthData({ weight: '18', height: '95', bloodType: 'B+' }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo).toHaveLength(3);
    expect(lead.childHealth).toHaveLength(3);

    // Verify each has unique data
    const cpfs = lead.enrollmentInfo.map(e => e.studentCpf);
    expect(new Set(cpfs).size).toBe(3);

    const idNumbers = lead.enrollmentInfo.map(e => e.studentIdNumber);
    expect(new Set(idNumbers).size).toBe(3);
  });

  it('should set termsAccepted on all enrollment info records', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.enrollmentInfo).toHaveLength(3);
    for (const info of lead.enrollmentInfo) {
      expect(info.termsAccepted).toBe(true);
    }
  });
});

// ============================================================================

describe('Multi-Child: Asymmetric Data', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should accept child 0 with full data, child 1 with minimal data', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11', studentIdNumber: 'MG-FULL', studentIdIssueDate: '2018-03-10', studentIdIssuer: 'SSP' }),
        health: makeHealthData({
          weight: '40', height: '150', bloodType: 'A+',
          medicalConditions: ['ASTHMA', 'ALLERGY'],
          allergies: ['PEANUTS', 'DUST', 'LATEX'],
          hasHospitalizations: true,
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }),
        health: makeHealthData(),
      },
    ]);

    const res = await request(app).post('/public/enrollment').send(payload).expect(200);
    expect(res.body.success).toBe(true);

    // Child 0 has rich data
    const h0 = lead.childHealth.find(h => h.childId === children[0].id)!;
    expect(h0.medicalConditions).toEqual(['ASTHMA', 'ALLERGY']);
    expect(h0.allergies).toHaveLength(3);

    // Child 1 has minimal data
    const h1 = lead.childHealth.find(h => h.childId === children[1].id)!;
    expect(h1.medicalConditions).toEqual(['NONE']);
    expect(h1.allergies).toEqual(['NONE']);
  });

  it('should accept 1 child with health conditions and 2 without', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      { childId: children[0].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }), health: makeHealthData({ medicalConditions: ['EPILEPSY'], hasSeizures: true }) },
      { childId: children[1].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }), health: makeHealthData() },
      { childId: children[2].id, enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }), health: makeHealthData() },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const withConditions = lead.childHealth.filter(h => h.medicalConditions.some((c: string) => c !== 'NONE'));
    const withoutConditions = lead.childHealth.filter(h => h.medicalConditions.every((c: string) => c === 'NONE'));

    expect(withConditions).toHaveLength(1);
    expect(withoutConditions).toHaveLength(2);
  });

  it('should accept children with different desiredGrades', async () => {
    const { lead } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    expect(children[0].desiredGrade).toBe('6th Grade');
    expect(children[1].desiredGrade).toBe('3rd Grade');
    expect(children[2].desiredGrade).toBe('Pre-K');

    // All different
    const grades = children.map(c => c.desiredGrade);
    expect(new Set(grades).size).toBe(3);
  });

  it('should handle children with different student types (NEW vs RETURNING)', async () => {
    const mixedStudents = [
      { fullName: 'Pedro Oliveira', dateOfBirth: '2013-03-10', gender: 'M', desiredGrade: '6th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
      { fullName: 'Ana Oliveira', dateOfBirth: '2016-07-22', gender: 'F', desiredGrade: '3rd Grade', studentType: 'RETURNING', primaryLanguage: 'Portuguese' },
    ];
    const { lead } = await setupCompletedAdmission(db, app, mixedStudents, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    expect(children[0].studentType).toBe('NEW');
    expect(children[1].studentType).toBe('RETURNING');
  });

  it('should handle mixed languages across children', async () => {
    const mixedLangStudents = [
      { fullName: 'Pedro Oliveira', dateOfBirth: '2013-03-10', gender: 'M', desiredGrade: '6th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
      { fullName: 'Ana Oliveira', dateOfBirth: '2016-07-22', gender: 'F', desiredGrade: '3rd Grade', studentType: 'NEW', primaryLanguage: 'English' },
      { fullName: 'Luca Oliveira', dateOfBirth: '2019-11-05', gender: 'M', desiredGrade: 'Pre-K', studentType: 'NEW', primaryLanguage: 'Spanish' },
    ];
    const { lead } = await setupCompletedAdmission(db, app, mixedLangStudents, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    expect(children[0].primaryLanguage).toBe('Portuguese');
    expect(children[1].primaryLanguage).toBe('English');
    expect(children[2].primaryLanguage).toBe('Spanish');
  });

  it('should handle one child with documents and one without', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload docs only for child 0
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'BIRTH_CERTIFICATE')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('cert0'), 'cert_pedro.pdf')
      .expect(201);

    // Child 1 has zero documents
    const child0Docs = lead.enrollmentDocuments.filter(d => d.childId === children[0].id);
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === children[1].id);

    expect(child0Docs).toHaveLength(2);
    expect(child1Docs).toHaveLength(0);
    expect(lead.enrollmentDocuments).toHaveLength(2);
  });
});

// ============================================================================

describe('Multi-Child: Sibling Handling', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should persist siblings separate from applicant students', async () => {
    const familyWithSiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira', dateOfBirth: '2010-01-15', grade: '9th Grade' },
      ],
    };

    const { lead } = await setupCompletedAdmission(db, app, [FAMILY_3_KIDS.students[0]], familyWithSiblings);

    const applicants = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');

    expect(applicants).toHaveLength(1);
    expect(siblings).toHaveLength(1);
    expect(siblings[0].fullName).toBe('Sofia Oliveira');
    expect(siblings[0].isApplicant).toBe(false);
  });

  it('should not include siblings in enrollment pre-fill students list', async () => {
    const familyWithSiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira', dateOfBirth: '2010-01-15', grade: '9th Grade' },
      ],
    };

    const { enrollToken } = await setupCompletedAdmission(db, app, [FAMILY_3_KIDS.students[0]], familyWithSiblings);

    const res = await request(app)
      .get(`/public/enrollment/${enrollToken}`)
      .expect(200);

    // Only applicant students should be in the students list
    expect(res.body.data.students).toHaveLength(1);
    expect(res.body.data.students[0].fullName).toBe('Pedro Oliveira');
    expect(res.body.data.students.find((s: any) => s.fullName === 'Sofia Oliveira')).toBeUndefined();
  });

  it('should handle 2 applicants + 3 siblings', async () => {
    const familyWithManySiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira', dateOfBirth: '2010-01-15', grade: '9th Grade' },
        { name: 'Gabriel Oliveira', dateOfBirth: '2008-06-20', grade: '11th Grade' },
        { name: 'Isabella Oliveira', dateOfBirth: '2005-03-05', grade: 'College' },
      ],
    };

    const twoApplicants = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead } = await setupCompletedAdmission(db, app, twoApplicants, familyWithManySiblings);

    const applicants = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');

    expect(applicants).toHaveLength(2);
    expect(siblings).toHaveLength(3);
    expect(lead.children).toHaveLength(5);
  });

  it('should handle siblings with minimal data (name only)', async () => {
    const familyMinimalSiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira' },
      ],
    };

    const { lead } = await setupCompletedAdmission(db, app, [FAMILY_3_KIDS.students[0]], familyMinimalSiblings);

    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');
    expect(siblings).toHaveLength(1);
    expect(siblings[0].fullName).toBe('Sofia Oliveira');
    expect(siblings[0].dateOfBirth).toBe('');
    expect(siblings[0].desiredGrade).toBe('');
  });

  it('should handle siblings with full data (name, cpf, dateOfBirth, grade)', async () => {
    const familyFullSiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira', cpf: '999.888.777-66', dateOfBirth: '2010-01-15', grade: '9th Grade' },
      ],
    };

    const { lead } = await setupCompletedAdmission(db, app, [FAMILY_3_KIDS.students[0]], familyFullSiblings);

    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');
    expect(siblings).toHaveLength(1);
    expect(siblings[0].fullName).toBe('Sofia Oliveira');
    expect(siblings[0].cpf).toBe('999.888.777-66');
    expect(siblings[0].dateOfBirth).toBe('2010-01-15');
    expect(siblings[0].desiredGrade).toBe('9th Grade');
  });

  it('should filter out empty sibling names', async () => {
    const familyEmptySiblings = {
      ...FAMILY_3_KIDS,
      siblings: [
        { name: 'Sofia Oliveira', dateOfBirth: '2010-01-15', grade: '9th Grade' },
        { name: '', dateOfBirth: '', grade: '' },
        { name: '  ', dateOfBirth: '', grade: '' },
      ],
    };

    const { lead } = await setupCompletedAdmission(db, app, [FAMILY_3_KIDS.students[0]], familyEmptySiblings);

    const siblings = lead.children.filter(c => c.relationship === 'SIBLING');
    // Empty and whitespace-only names should be filtered out
    expect(siblings).toHaveLength(1);
    expect(siblings[0].fullName).toBe('Sofia Oliveira');
  });
});

// ============================================================================

describe('Multi-Child: Parent Data Shared Across Children', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should apply parent updates once (not per child)', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Only 1 father record and 1 mother record, not 3 each
    const fathers = lead.parents.filter(p => p.parentType === 'FATHER');
    const mothers = lead.parents.filter(p => p.parentType === 'MOTHER');

    expect(fathers).toHaveLength(1);
    expect(mothers).toHaveLength(1);
  });

  it('should update father education for all children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })), {
      fatherUpdates: { ...VALID_FATHER_UPDATES, education: 'DOUTORADO' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const father = lead.parents.find(p => p.parentType === 'FATHER')!;
    expect(father.education).toBe('DOUTORADO');

    // This single update applies to all children -- there is one parent record
    expect(lead.parents.filter(p => p.parentType === 'FATHER')).toHaveLength(1);
  });

  it('should apply mother sameAddressAsOtherParent', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })), {
      motherUpdates: { ...VALID_MOTHER_UPDATES, sameAddressAsOtherParent: true },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const mother = lead.parents.find(p => p.parentType === 'MOTHER')!;
    expect(mother.sameAddressAsOtherParent).toBe(true);
  });

  it('should persist single set of emergency contacts for all children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })), {
      emergencyContacts: [
        { name: 'Avo Maria', phone: '(31) 99111-0001', email: '', relationship: 'GRANDMOTHER', isPrimary: true },
        { name: 'Tio Jose', phone: '(31) 99111-0002', email: '', relationship: 'UNCLE', isPrimary: false },
      ],
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Single set of emergency contacts, not 3 sets (one per child)
    expect(lead.emergencyContacts).toHaveLength(2);
    expect(lead.emergencyContacts[0].name).toBe('Avo Maria');
    expect(lead.emergencyContacts[1].name).toBe('Tio Jose');
  });

  it('should persist single financial responsible for all children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${i + 1}00.000.000-0${i + 1}` }),
      health: makeHealthData(),
    })), {
      financialResponsible: { responsibleType: 'MOTHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Single financial responsible, shared across all children
    expect(lead.financialResponsible).toBeDefined();
    expect(lead.financialResponsible!.responsibleType).toBe('MOTHER');
  });
});

// ============================================================================

describe('Multi-Child: Document Upload Order Independence', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should allow uploading child 1 docs before child 0 docs', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload child 1 FIRST
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_ana.pdf')
      .expect(201);

    // Then child 0
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(2);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[0].id)).toHaveLength(1);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[1].id)).toHaveLength(1);
  });

  it('should allow interleaving uploads (child0, child1, child0, child1)', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Interleaved uploads
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('rg1'), 'rg_ana.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'BIRTH_CERTIFICATE')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('cert0'), 'cert_pedro.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'BIRTH_CERTIFICATE')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('cert1'), 'cert_ana.pdf')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(4);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[0].id)).toHaveLength(2);
    expect(lead.enrollmentDocuments.filter(d => d.childId === children[1].id)).toHaveLength(2);
  });

  it('should correctly associate docs regardless of upload order', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload in reverse order of child index, with mixed doc types
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'VACCINATION_CARD')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('vax1'), 'vax_ana.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
      .attach('files', Buffer.from('rg0'), 'rg_pedro.pdf')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_PHOTO')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('photo1'), 'photo_ana.jpg')
      .expect(201);

    // Verify correct association
    const child0Docs = lead.enrollmentDocuments.filter(d => d.childId === children[0].id);
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === children[1].id);

    expect(child0Docs).toHaveLength(1);
    expect(child0Docs[0].documentType).toBe('STUDENT_ID');
    expect(child0Docs[0].includesOtherDocs).toEqual(['STUDENT_CPF']);

    expect(child1Docs).toHaveLength(2);
    const child1DocTypes = child1Docs.map(d => d.documentType).sort();
    expect(child1DocTypes).toEqual(['STUDENT_PHOTO', 'VACCINATION_CARD']);
  });

  it('should handle delete + re-upload for one child without affecting others', async () => {
    const twoKids = FAMILY_3_KIDS.students.slice(0, 2);
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, twoKids, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Upload for both children
    const res0 = await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_PHOTO')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('old_photo'), 'old_photo_pedro.jpg')
      .expect(201);

    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_PHOTO')
      .field('category', 'STUDENT')
      .field('childId', children[1].id)
      .attach('files', Buffer.from('photo1'), 'photo_ana.jpg')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(2);

    // Delete child 0's photo
    const docId0 = res0.body.data[0].id;
    await request(app)
      .delete(`/public/enrollment/${enrollToken}/documents/${docId0}`)
      .expect(200);

    expect(lead.enrollmentDocuments).toHaveLength(1);
    expect(lead.enrollmentDocuments[0].childId).toBe(children[1].id);

    // Re-upload new photo for child 0
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_PHOTO')
      .field('category', 'STUDENT')
      .field('childId', children[0].id)
      .attach('files', Buffer.from('new_photo'), 'new_photo_pedro.jpg')
      .expect(201);

    expect(lead.enrollmentDocuments).toHaveLength(2);

    // Verify child 1's doc is still intact
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === children[1].id);
    expect(child1Docs).toHaveLength(1);
    expect(child1Docs[0].fileName).toBe('photo_ana.jpg');

    // Verify child 0 has the new photo
    const child0Docs = lead.enrollmentDocuments.filter(d => d.childId === children[0].id);
    expect(child0Docs).toHaveLength(1);
    expect(child0Docs[0].fileName).toBe('new_photo_pedro.jpg');
  });
});

// ============================================================================

describe('Multi-Child: Zod Validation with childrenData', () => {
  it('should accept childrenData with 2 children', () => {
    const payload = {
      enrollmentToken: 'test-token-123',
      childrenData: [
        {
          childId: 'child-1',
          enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }),
          health: makeHealthData(),
        },
        {
          childId: 'child-2',
          enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }),
          health: makeHealthData(),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Tia Rosa', phone: '(31) 99999-0000', email: '', relationship: 'AUNT', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: VALID_TRANSPORT,
      financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
      termsAccepted: true as const,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept childrenData with 3 children', () => {
    const payload = {
      enrollmentToken: 'test-token-456',
      childrenData: [
        { childId: 'child-1', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }), health: makeHealthData({ bloodType: 'A+' }) },
        { childId: 'child-2', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }), health: makeHealthData({ bloodType: 'O-' }) },
        { childId: 'child-3', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '333.333.333-33' }), health: makeHealthData({ bloodType: 'B+' }) },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: VALID_TRANSPORT,
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true as const,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept childrenData where one child has health and another does not', () => {
    const payload = {
      enrollmentToken: 'test-token-789',
      childrenData: [
        { childId: 'child-1', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }), health: makeHealthData() },
        { childId: 'child-2', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }) },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: VALID_TRANSPORT,
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true as const,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept childrenData with empty array', () => {
    const payload = {
      enrollmentToken: 'test-token-empty',
      childrenData: [],
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }),
      health: makeHealthData(),
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: VALID_TRANSPORT,
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true as const,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept childrenData alongside root enrollmentInfo', () => {
    const payload = {
      enrollmentToken: 'test-token-both',
      childrenData: [
        { childId: 'child-1', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '111.111.111-11' }), health: makeHealthData() },
        { childId: 'child-2', enrollmentInfo: makeEnrollmentInfo({ studentCpf: '222.222.222-22' }), health: makeHealthData() },
      ],
      // Root enrollmentInfo also provided (frontend sends defaults for multi-child)
      enrollmentInfo: makeEnrollmentInfo({ personType: 'INDIVIDUAL', studentCpf: '999.999.999-99' }),
      health: makeHealthData(),
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: VALID_TRANSPORT,
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true as const,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);

    // Both childrenData and root enrollmentInfo should be preserved
    if (result.success) {
      expect(result.data.childrenData).toHaveLength(2);
      expect(result.data.enrollmentInfo).toBeDefined();
      expect(result.data.enrollmentInfo!.studentCpf).toBe('999.999.999-99');
    }
  });
});
