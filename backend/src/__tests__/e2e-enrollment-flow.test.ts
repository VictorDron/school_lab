/**
 * E2E Enrollment Flow Tests
 *
 * Simulates the COMPLETE user journey:
 *   1. Lead is created (CRM)
 *   2. Application token is generated & sent to family
 *   3. Family opens form, uploads documents, submits admission form
 *   4. School generates enrollment token
 *   5. Family opens enrollment form, fills all steps, uploads enrollment docs, submits
 *   6. Verification: all data persisted correctly
 *
 * Uses a mock in-memory database that simulates Prisma behavior.
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

  // Simulate lead creation (admin action)
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

  // Simulate generating application token (admin action)
  generateApplicationToken(leadId: string): string {
    const lead = this.leads.get(leadId)!;
    const token = this.generateToken();
    lead.applicationToken = token;
    lead.applicationTokenExpires = new Date(Date.now() + 168 * 60 * 60 * 1000);
    lead.applicationStatus = 'LINK_SENT';
    return token;
  }

  // Simulate generating enrollment token (admin action)
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
// CREATE FULL E2E TEST ROUTER (simulates all public routes)
// ============================================================================

function createE2ERouter(db: MockDB) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // ==================== ADMISSION ENDPOINTS ====================

  // GET /application/:token - Get pre-fill data
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

  // POST /admissions - Submit admission form
  router.post('/admissions', express.json(), (req: Request, res: Response) => {
    const { applicationToken, students, student, father, mother, address, livesWith, siblings, source } = req.body;

    // Validate token
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

    // Validate required fields
    const studentList = students || (student ? [student] : []);
    if (studentList.length === 0) {
      return res.status(400).json({ success: false, error: 'Pelo menos um estudante obrigatório' });
    }
    if (!father?.name || !mother?.name) {
      return res.status(400).json({ success: false, error: 'Dados dos pais obrigatórios' });
    }

    // Create children records
    lead.children = studentList.map((s: any, i: number) => ({
      id: db.generateId(),
      leadId: lead.id,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      desiredGrade: s.desiredGrade,
      currentGrade: s.currentGrade || '',
      studentType: s.studentType,
      primaryLanguage: s.primaryLanguage,
      otherLanguages: [],
      relationship: 'STUDENT',
      isApplicant: true,
      cpf: s.cpf,
    }));

    // Add siblings
    if (siblings?.length > 0) {
      for (const sib of siblings) {
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
        });
      }
    }

    // Create parent records
    lead.parents = [
      {
        id: db.generateId(), leadId: lead.id, parentType: 'FATHER',
        fullName: father.name, email: father.email, phone: father.phone,
        cpf: father.cpf, ...( {} as any),
      },
      {
        id: db.generateId(), leadId: lead.id, parentType: 'MOTHER',
        fullName: mother.name, email: mother.email, phone: mother.phone,
        cpf: mother.cpf, ...( {} as any),
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

  // POST /application/:token/documents - Upload admission docs
  router.post('/application/:token/documents', upload.array('files', 10), (req: Request, res: Response) => {
    const lead = db.findLeadByApplicationToken(req.params.token);
    if (!lead) return res.status(404).json({ success: false, code: 'TOKEN_NOT_FOUND' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, error: 'Nenhum arquivo' });

    return res.status(201).json({ success: true, data: files.map(f => ({ fileName: f.originalname })) });
  });

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
    if (!lead) return res.status(404).json({ success: false, code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, code: 'ADMISSION_NOT_COMPLETED' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, error: 'Nenhum arquivo' });

    const { documentType, category, childId, includesOtherDocs } = req.body;

    // Check doc limit
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

    // Zod validation (same schema as production)
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

    // --- PERSIST DATA (simulates service) ---

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

  // ==================== FORM DRAFT ENDPOINTS ====================

  const drafts = new Map<string, any>();

  router.put('/form-draft/:token', express.json(), (req: Request, res: Response) => {
    const key = `${req.params.token}_${req.body.formType}`;
    drafts.set(key, { data: req.body.data, step: req.body.step, updatedAt: new Date().toISOString() });
    return res.json({ success: true });
  });

  router.get('/form-draft/:token', (req: Request, res: Response) => {
    const key = `${req.params.token}_${req.query.type}`;
    const draft = drafts.get(key);
    if (!draft) return res.status(404).json({ success: false });
    return res.json({ success: true, data: draft });
  });

  return router;
}

function createE2EApp(db: MockDB) {
  const app = express();
  app.use('/public', createE2ERouter(db));
  return app;
}

// ============================================================================
// TEST DATA - REALISTIC BRAZILIAN FAMILY
// ============================================================================

const FAMILY = {
  name: 'Família Silva',
  father: {
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    phone: '(31) 99888-7766',
    cpf: '123.456.789-00',
    occupation: 'Engenheiro',
  },
  mother: {
    name: 'Ana Paula Mendes Silva',
    email: 'ana.silva@email.com',
    phone: '(31) 99777-6655',
    cpf: '987.654.321-00',
    occupation: 'Médica',
  },
  student: {
    fullName: 'Lucas Mendes Silva',
    dateOfBirth: '2016-03-15',
    gender: 'M',
    nationality: 'Brasileiro',
    desiredGrade: '3rd Grade',
    currentGrade: '2nd Grade',
    studentType: 'NEW',
    primaryLanguage: 'Portuguese',
    otherLanguages: 'English',
  },
  address: {
    country: 'Brasil',
    state: 'MG',
    city: 'Belo Horizonte',
    neighborhood: 'Savassi',
    street: 'Rua Pernambuco',
    number: '1234',
    complement: 'Apto 501',
    zipCode: '30130-150',
  },
};

const ENROLLMENT_FATHER_UPDATES = {
  email: 'carlos.silva@email.com',
  phone: '(31) 99888-7766',
  cpf: '123.456.789-00',
  idNumber: 'MG-12.345.678',
  idIssueDate: '2015-06-20',
  idIssuer: 'SSP',
  dateOfBirth: '1982-11-05',
  education: 'SUPERIOR_COMPLETO',
  religion: 'CATOLICA',
  address: {
    zipCode: '30130-150', country: 'Brasil', state: 'MG',
    city: 'Belo Horizonte', neighborhood: 'Savassi',
    street: 'Rua Pernambuco', number: '1234', complement: 'Apto 501',
  },
};

const ENROLLMENT_MOTHER_UPDATES = {
  email: 'ana.silva@email.com',
  phone: '(31) 99777-6655',
  cpf: '987.654.321-00',
  idNumber: 'MG-98.765.432',
  idIssueDate: '2016-01-10',
  idIssuer: 'SSP',
  dateOfBirth: '1985-07-22',
  education: 'POS_GRADUACAO',
  religion: 'CATOLICA',
  address: {
    zipCode: '30130-150', country: 'Brasil', state: 'MG',
    city: 'Belo Horizonte', neighborhood: 'Savassi',
    street: 'Rua Pernambuco', number: '1234', complement: 'Apto 501',
  },
  sameAddressAsOtherParent: true,
};

const HEALTH_DATA = {
  weight: '28', height: '135', bloodType: 'O+',
  medicalConditions: ['NONE'], medicalConditionsNotes: '',
  hasHospitalizations: false, hospitalizationsNotes: '',
  hasSeizures: false, seizuresNotes: '',
  allergies: ['NONE'], allergiesNotes: '',
  feverMedications: ['DIPIRONA'], feverMedicationOther: '',
  painMedications: ['IBUPROFENO'], painMedicationOther: '',
  medicationRestrictions: '', regularMedications: '',
  hasEatingDisorder: false, eatingDisorderNotes: '',
  additionalHealthInfo: '',
};

const TRANSPORT_DATA = {
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

// ============================================================================
// E2E TESTS
// ============================================================================

describe('E2E: Complete Enrollment Flow — Single Child', () => {
  let db: MockDB;
  let app: express.Application;
  let leadId: string;
  let applicationToken: string;
  let enrollmentToken: string;
  let leadCode: string;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  // ==================== PHASE 1: LEAD CREATION ====================

  describe('Phase 1: Lead Creation (Admin)', () => {
    it('should create a new lead in the CRM', () => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;

      expect(lead.id).toBeTruthy();
      expect(lead.code).toMatch(/^LEAD-/);
      expect(lead.applicationStatus).toBe('PENDING');
      expect(lead.enrollmentStatus).toBe('NOT_STARTED');
      expect(lead.children).toHaveLength(0);
      expect(lead.parents).toHaveLength(0);
    });
  });

  // ==================== PHASE 2: APPLICATION TOKEN ====================

  describe('Phase 2: Application Token Generation (Admin)', () => {
    it('should generate application token and update lead status', () => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      applicationToken = db.generateApplicationToken(leadId);

      expect(applicationToken).toHaveLength(64); // 32 bytes hex
      expect(lead.applicationToken).toBe(applicationToken);
      expect(lead.applicationStatus).toBe('LINK_SENT');
      expect(lead.applicationTokenExpires).toBeInstanceOf(Date);
      expect(lead.applicationTokenExpires!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ==================== PHASE 3: ADMISSION FORM ====================

  describe('Phase 3: Admission Form (Family)', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);
    });

    it('Step 3a: should fetch pre-fill data with valid token', async () => {
      const res = await request(app)
        .get(`/public/application/${applicationToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe(leadCode);
      expect(res.body.data.familyName).toBe(FAMILY.name);
    });

    it('Step 3b: should reject pre-fill with invalid token', async () => {
      await request(app)
        .get('/public/application/invalid-token-xyz')
        .expect(404);
    });

    it('Step 3c: should submit admission form successfully', async () => {
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [],
          source: 'WEBSITE',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe(leadCode);

      // Verify data was persisted
      const lead = db.leads.get(leadId)!;
      expect(lead.applicationStatus).toBe('FORM_RECEIVED');
      expect(lead.formSubmissionCount).toBe(1);
      expect(lead.children).toHaveLength(1);
      expect(lead.children[0].fullName).toBe(FAMILY.student.fullName);
      expect(lead.children[0].relationship).toBe('STUDENT');
      expect(lead.children[0].isApplicant).toBe(true);
      expect(lead.parents).toHaveLength(2);
      expect(lead.parents.find(p => p.parentType === 'FATHER')!.fullName).toBe(FAMILY.father.name);
      expect(lead.parents.find(p => p.parentType === 'MOTHER')!.fullName).toBe(FAMILY.mother.name);
      expect(lead.address).toEqual(FAMILY.address);
    });

    it('Step 3d: should allow re-submission (update) with same token', async () => {
      // First submission
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [],
          source: 'WEBSITE',
        })
        .expect(201);

      // Second submission (update)
      const updatedStudent = { ...FAMILY.student, desiredGrade: '4th Grade' };
      const res = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [updatedStudent],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [],
          source: 'WEBSITE',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const lead = db.leads.get(leadId)!;
      expect(lead.formSubmissionCount).toBe(2);
      expect(lead.children[0].desiredGrade).toBe('4th Grade');
    });
  });

  // ==================== PHASE 4: ENROLLMENT TOKEN ====================

  describe('Phase 4: Enrollment Token Generation (Admin)', () => {
    beforeEach(() => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      applicationToken = db.generateApplicationToken(leadId);
    });

    it('should generate enrollment token after admission is completed', async () => {
      // Submit admission first
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [],
          source: 'WEBSITE',
        });

      // Generate enrollment token
      enrollmentToken = db.generateEnrollmentToken(leadId);

      const lead = db.leads.get(leadId)!;
      expect(enrollmentToken).toHaveLength(64);
      expect(lead.enrollmentStatus).toBe('LINK_SENT');
      expect(lead.enrollmentTokenExpires!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ==================== PHASE 5: ENROLLMENT FORM ====================

  describe('Phase 5: Enrollment Form (Family)', () => {
    beforeEach(async () => {
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      applicationToken = db.generateApplicationToken(leadId);

      // Submit admission
      await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [],
          source: 'WEBSITE',
        });

      // Generate enrollment token
      enrollmentToken = db.generateEnrollmentToken(leadId);
    });

    it('Step 5a: should fetch enrollment pre-fill data', async () => {
      const res = await request(app)
        .get(`/public/enrollment/${enrollmentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe(leadCode);
      expect(res.body.data.students).toHaveLength(1);
      expect(res.body.data.students[0].fullName).toBe(FAMILY.student.fullName);
      expect(res.body.data.father).toBeTruthy();
      expect(res.body.data.mother).toBeTruthy();
    });

    it('Step 5b: should reject enrollment pre-fill without completed admission', async () => {
      // Create a new lead WITHOUT admission
      const newLead = db.createLead('Família Teste');
      db.generateApplicationToken(newLead.id); // has token but no form submitted
      const newEnrollToken = db.generateEnrollmentToken(newLead.id);

      await request(app)
        .get(`/public/enrollment/${newEnrollToken}`)
        .expect(400);
    });

    it('Step 5c: should upload enrollment documents (single child)', async () => {
      const lead = db.leads.get(leadId)!;
      const childId = lead.children[0].id;

      // Upload student ID (includes CPF)
      const res = await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'STUDENT_ID')
        .field('category', 'STUDENT')
        .field('childId', childId)
        .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
        .attach('files', Buffer.from('fake-pdf-content'), 'rg_lucas.pdf')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].documentType).toBe('STUDENT_ID');
      expect(res.body.data[0].includesOtherDocs).toEqual(['STUDENT_CPF']);

      // Verify persisted
      expect(lead.enrollmentDocuments).toHaveLength(1);
      expect(lead.enrollmentDocuments[0].childId).toBe(childId);
    });

    it('Step 5d: should upload multiple enrollment documents', async () => {
      const lead = db.leads.get(leadId)!;
      const childId = lead.children[0].id;

      const docsToUpload = [
        { type: 'STUDENT_ID', category: 'STUDENT', childId, includes: ['STUDENT_CPF'] },
        { type: 'BIRTH_CERTIFICATE', category: 'STUDENT', childId },
        { type: 'VACCINATION_CARD', category: 'STUDENT', childId },
        { type: 'HEALTH_PLAN_CARD', category: 'STUDENT', childId },
        { type: 'STUDENT_PHOTO', category: 'STUDENT', childId },
        { type: 'MOTHER_ID', category: 'MOTHER', includes: ['MOTHER_CPF'] },
        { type: 'MOTHER_PROOF_OF_RESIDENCE', category: 'MOTHER' },
        { type: 'FATHER_ID', category: 'FATHER', includes: ['FATHER_CPF'] },
        { type: 'FATHER_PROOF_OF_RESIDENCE', category: 'FATHER' },
        { type: 'SCHOOL_DECLARATION', category: 'SCHOOL' },
        { type: 'FINANCIAL_CLEARANCE', category: 'SCHOOL' },
      ];

      for (const doc of docsToUpload) {
        const req = request(app)
          .post(`/public/enrollment/${enrollmentToken}/documents`)
          .field('documentType', doc.type)
          .field('category', doc.category);

        if (doc.childId) req.field('childId', doc.childId);
        if (doc.includes) req.field('includesOtherDocs', JSON.stringify(doc.includes));

        await req.attach('files', Buffer.from('fake-content'), `${doc.type.toLowerCase()}.pdf`).expect(201);
      }

      // Verify all docs persisted (11 uploaded, but some include others)
      expect(lead.enrollmentDocuments).toHaveLength(11);

      // Verify includesOtherDocs logic (the counting fix)
      const studentDocs = lead.enrollmentDocuments.filter(d => d.category === 'STUDENT');
      const motherDocs = lead.enrollmentDocuments.filter(d => d.category === 'MOTHER');
      const fatherDocs = lead.enrollmentDocuments.filter(d => d.category === 'FATHER');
      const schoolDocs = lead.enrollmentDocuments.filter(d => d.category === 'SCHOOL');

      expect(studentDocs).toHaveLength(5);
      expect(motherDocs).toHaveLength(2); // MOTHER_ID (includes MOTHER_CPF) + PROOF
      expect(fatherDocs).toHaveLength(2); // FATHER_ID (includes FATHER_CPF) + PROOF
      expect(schoolDocs).toHaveLength(2);

      // STUDENT_CPF is "included" in STUDENT_ID, verify the isDocCovered logic
      const studentIdDoc = studentDocs.find(d => d.documentType === 'STUDENT_ID');
      expect(studentIdDoc!.includesOtherDocs).toContain('STUDENT_CPF');

      // There should be NO separate STUDENT_CPF upload
      expect(studentDocs.find(d => d.documentType === 'STUDENT_CPF')).toBeUndefined();
    });

    it('Step 5e: should delete an enrollment document', async () => {
      const lead = db.leads.get(leadId)!;
      const childId = lead.children[0].id;

      // Upload
      const uploadRes = await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'STUDENT_PHOTO')
        .field('category', 'STUDENT')
        .field('childId', childId)
        .attach('files', Buffer.from('photo'), 'photo.jpg')
        .expect(201);

      const docId = uploadRes.body.data[0].id;
      expect(lead.enrollmentDocuments).toHaveLength(1);

      // Delete
      await request(app)
        .delete(`/public/enrollment/${enrollmentToken}/documents/${docId}`)
        .expect(200);

      expect(lead.enrollmentDocuments).toHaveLength(0);
    });

    it('Step 5f: should submit complete enrollment form', async () => {
      const lead = db.leads.get(leadId)!;
      const childId = lead.children[0].id;

      const enrollmentPayload = {
        enrollmentToken,
        enrollmentInfo: {
          academicCalendar: '2026',
          campus: 'Campus Principal',
          course: '',
          module: '',
          classGroup: '',
          personType: 'INDIVIDUAL',
          studentCpf: '123.456.789-00',
          studentIdNumber: 'MG-12.345.678',
          studentIdIssueDate: '2020-01-15',
          studentIdIssuer: 'SSP',
        },
        student: { desiredGrade: '3rd Grade' },
        fatherUpdates: ENROLLMENT_FATHER_UPDATES,
        motherUpdates: ENROLLMENT_MOTHER_UPDATES,
        health: HEALTH_DATA,
        emergencyContacts: [
          { name: 'Avó Mariana', phone: '(31) 99666-5544', email: 'mariana@email.com', relationship: 'GRANDMOTHER', isPrimary: true },
          { name: 'Tio Roberto', phone: '(31) 99555-4433', email: '', relationship: 'UNCLE', isPrimary: false },
        ],
        healthPlan: {
          operator: 'Unimed BH',
          beneficiaryCode: '123456789',
          planType: 'Enfermaria',
          preferredHospital: 'Hospital Mater Dei',
        },
        transport: TRANSPORT_DATA,
        financialResponsible: {
          responsibleType: 'FATHER',
          fullName: '', cpf: '', email: '', phone: '',
          address: {},
        },
        termsAccepted: true,
      };

      const res = await request(app)
        .post('/public/enrollment')
        .send(enrollmentPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.leadCode).toBe(leadCode);

      // ====== VERIFY ALL PERSISTED DATA ======

      // Lead status
      expect(lead.enrollmentStatus).toBe('FORM_RECEIVED');
      expect(lead.enrollmentSubmissionCount).toBe(1);
      expect(lead.enrollmentSubmittedAt).toBeInstanceOf(Date);

      // Parent data updated
      const fatherData = lead.parents.find(p => p.parentType === 'FATHER')!;
      expect(fatherData.idNumber).toBe('MG-12.345.678');
      expect(fatherData.education).toBe('SUPERIOR_COMPLETO');
      expect(fatherData.city).toBe('Belo Horizonte');

      const motherData = lead.parents.find(p => p.parentType === 'MOTHER')!;
      expect(motherData.idNumber).toBe('MG-98.765.432');
      expect(motherData.sameAddressAsOtherParent).toBe(true);

      // Emergency contacts
      expect(lead.emergencyContacts).toHaveLength(2);
      expect(lead.emergencyContacts[0].name).toBe('Avó Mariana');
      expect(lead.emergencyContacts[0].isPrimary).toBe(true);
      expect(lead.emergencyContacts[1].name).toBe('Tio Roberto');

      // Health plan
      expect(lead.healthPlan!.operator).toBe('Unimed BH');
      expect(lead.healthPlan!.preferredHospital).toBe('Hospital Mater Dei');

      // Transport
      expect(lead.transport!.transportMethod).toBe('CAR');
      expect(lead.transport!.dropoffPickupPersons).toEqual(['FATHER', 'MOTHER']);
      expect(lead.transport!.familyVehicles).toHaveLength(1);
      expect(lead.transport!.canLeaveAlone).toBe(false);

      // Financial responsible
      expect(lead.financialResponsible!.responsibleType).toBe('FATHER');

      // Enrollment info
      expect(lead.enrollmentInfo).toHaveLength(1);
      expect(lead.enrollmentInfo[0].personType).toBe('INDIVIDUAL');
      expect(lead.enrollmentInfo[0].studentCpf).toBe('123.456.789-00');
      expect(lead.enrollmentInfo[0].termsAccepted).toBe(true);

      // Child health
      expect(lead.childHealth).toHaveLength(1);
      expect(lead.childHealth[0].weight).toBe('28');
      expect(lead.childHealth[0].bloodType).toBe('O+');
      expect(lead.childHealth[0].medicalConditions).toEqual(['NONE']);
      expect(lead.childHealth[0].feverMedications).toEqual(['DIPIRONA']);
    });

    it('Step 5g: should reject submission with missing required fields', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({
          enrollmentToken,
          // Missing all other fields
          termsAccepted: true,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('Step 5h: should reject submission with termsAccepted=false', async () => {
      const res = await request(app)
        .post('/public/enrollment')
        .send({
          enrollmentToken,
          enrollmentInfo: {
            personType: 'INDIVIDUAL', studentCpf: '123', studentIdNumber: 'MG-1',
            studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
          },
          fatherUpdates: ENROLLMENT_FATHER_UPDATES,
          motherUpdates: ENROLLMENT_MOTHER_UPDATES,
          health: HEALTH_DATA,
          emergencyContacts: [{ name: 'Test', phone: '123456789', isPrimary: true }],
          healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
          transport: TRANSPORT_DATA,
          financialResponsible: { responsibleType: 'FATHER' },
          termsAccepted: false,
        })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==================== PHASE 6: FULL E2E FLOW ====================

  describe('Phase 6: Complete E2E — Lead Creation to Enrollment Submission', () => {
    it('should complete the ENTIRE flow successfully', async () => {
      // === STEP 1: Create lead ===
      const lead = db.createLead(FAMILY.name);
      leadId = lead.id;
      leadCode = lead.code;
      expect(lead.applicationStatus).toBe('PENDING');

      // === STEP 2: Generate application token ===
      applicationToken = db.generateApplicationToken(leadId);
      expect(lead.applicationStatus).toBe('LINK_SENT');

      // === STEP 3: Family opens form → sees pre-fill ===
      const prefillRes = await request(app)
        .get(`/public/application/${applicationToken}`)
        .expect(200);
      expect(prefillRes.body.data.familyName).toBe(FAMILY.name);

      // === STEP 4: Family submits admission form ===
      const admissionRes = await request(app)
        .post('/public/admissions')
        .send({
          applicationToken,
          students: [FAMILY.student],
          livesWith: 'BOTH_PARENTS',
          father: FAMILY.father,
          mother: FAMILY.mother,
          address: FAMILY.address,
          siblings: [{ name: 'Maria Silva', dateOfBirth: '2019-08-10', grade: 'Pre-K' }],
          source: 'WEBSITE',
        })
        .expect(201);
      expect(admissionRes.body.data.leadCode).toBe(leadCode);

      // Verify admission state
      expect(lead.applicationStatus).toBe('FORM_RECEIVED');
      expect(lead.children).toHaveLength(2); // 1 student + 1 sibling
      expect(lead.children.filter(c => c.relationship === 'STUDENT')).toHaveLength(1);
      expect(lead.children.filter(c => c.relationship === 'SIBLING')).toHaveLength(1);

      // === STEP 5: Admin generates enrollment token ===
      enrollmentToken = db.generateEnrollmentToken(leadId);
      expect(lead.enrollmentStatus).toBe('LINK_SENT');

      // === STEP 6: Family opens enrollment form → sees pre-filled data ===
      const enrollPrefillRes = await request(app)
        .get(`/public/enrollment/${enrollmentToken}`)
        .expect(200);

      const enrollData = enrollPrefillRes.body.data;
      expect(enrollData.leadCode).toBe(leadCode);
      expect(enrollData.students).toHaveLength(1); // Only applicant, not sibling
      expect(enrollData.students[0].fullName).toBe(FAMILY.student.fullName);
      expect(enrollData.father.fullName).toBe(FAMILY.father.name);
      expect(enrollData.mother.fullName).toBe(FAMILY.mother.name);

      // === STEP 7: Family uploads enrollment documents ===
      const childId = lead.children.find(c => c.isApplicant)!.id;

      // Upload student docs (RG includes CPF)
      await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'STUDENT_ID')
        .field('category', 'STUDENT')
        .field('childId', childId)
        .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
        .attach('files', Buffer.from('rg'), 'rg.pdf')
        .expect(201);

      await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'BIRTH_CERTIFICATE')
        .field('category', 'STUDENT')
        .field('childId', childId)
        .attach('files', Buffer.from('cert'), 'certidao.pdf')
        .expect(201);

      // Upload parent docs
      await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'MOTHER_ID')
        .field('category', 'MOTHER')
        .field('includesOtherDocs', JSON.stringify(['MOTHER_CPF']))
        .attach('files', Buffer.from('rg_mae'), 'rg_mae.pdf')
        .expect(201);

      await request(app)
        .post(`/public/enrollment/${enrollmentToken}/documents`)
        .field('documentType', 'FATHER_ID')
        .field('category', 'FATHER')
        .field('includesOtherDocs', JSON.stringify(['FATHER_CPF']))
        .attach('files', Buffer.from('rg_pai'), 'rg_pai.pdf')
        .expect(201);

      expect(lead.enrollmentDocuments).toHaveLength(4);

      // Verify includesOtherDocs persisted correctly
      const studentIdDoc = lead.enrollmentDocuments.find(d => d.documentType === 'STUDENT_ID');
      expect(studentIdDoc!.includesOtherDocs).toEqual(['STUDENT_CPF']);

      // === STEP 8: Family submits enrollment form ===
      const enrollSubmitRes = await request(app)
        .post('/public/enrollment')
        .send({
          enrollmentToken,
          enrollmentInfo: {
            academicCalendar: '2026', campus: 'Principal', course: '', module: '', classGroup: '',
            personType: 'INDIVIDUAL',
            studentCpf: '123.456.789-00',
            studentIdNumber: 'MG-12.345.678',
            studentIdIssueDate: '2020-01-15',
            studentIdIssuer: 'SSP',
          },
          student: { desiredGrade: '3rd Grade' },
          fatherUpdates: ENROLLMENT_FATHER_UPDATES,
          motherUpdates: ENROLLMENT_MOTHER_UPDATES,
          health: HEALTH_DATA,
          emergencyContacts: [
            { name: 'Avó Mariana', phone: '(31) 99666-5544', email: 'mariana@email.com', relationship: 'GRANDMOTHER', isPrimary: true },
          ],
          healthPlan: { operator: 'Unimed', beneficiaryCode: '12345', planType: 'Enfermaria', preferredHospital: 'Mater Dei' },
          transport: TRANSPORT_DATA,
          financialResponsible: { responsibleType: 'FATHER', fullName: '', cpf: '', email: '', phone: '', address: {} },
          termsAccepted: true,
        })
        .expect(200);

      expect(enrollSubmitRes.body.success).toBe(true);
      expect(enrollSubmitRes.body.data.leadCode).toBe(leadCode);

      // === STEP 9: FINAL VERIFICATION ===
      expect(lead.applicationStatus).toBe('FORM_RECEIVED');
      expect(lead.enrollmentStatus).toBe('FORM_RECEIVED');
      expect(lead.formSubmissionCount).toBe(1);
      expect(lead.enrollmentSubmissionCount).toBe(1);

      // Children intact
      expect(lead.children).toHaveLength(2);
      expect(lead.children[0].fullName).toBe(FAMILY.student.fullName);

      // Parents updated with enrollment data
      const finalFather = lead.parents.find(p => p.parentType === 'FATHER')!;
      expect(finalFather.idNumber).toBe('MG-12.345.678');
      expect(finalFather.education).toBe('SUPERIOR_COMPLETO');
      expect(finalFather.city).toBe('Belo Horizonte');

      const finalMother = lead.parents.find(p => p.parentType === 'MOTHER')!;
      expect(finalMother.idNumber).toBe('MG-98.765.432');
      expect(finalMother.sameAddressAsOtherParent).toBe(true);

      // Health data
      expect(lead.childHealth).toHaveLength(1);
      expect(lead.childHealth[0].bloodType).toBe('O+');

      // Emergency contacts
      expect(lead.emergencyContacts).toHaveLength(1);
      expect(lead.emergencyContacts[0].name).toBe('Avó Mariana');

      // Documents
      expect(lead.enrollmentDocuments).toHaveLength(4);

      // Transport
      expect(lead.transport!.transportMethod).toBe('CAR');

      // Enrollment info
      expect(lead.enrollmentInfo).toHaveLength(1);
      expect(lead.enrollmentInfo[0].termsAccepted).toBe(true);
    });
  });
});

// ============================================================================
// E2E: MULTI-CHILD FLOW
// ============================================================================

describe('E2E: Complete Enrollment Flow — Multi-Child', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should handle multi-child enrollment from start to finish', async () => {
    // === Create lead + application token ===
    const lead = db.createLead('Família Oliveira');
    const appToken = db.generateApplicationToken(lead.id);

    // === Submit admission with 2 students ===
    const twoStudents = [
      {
        fullName: 'Pedro Oliveira',
        dateOfBirth: '2015-05-10',
        gender: 'M',
        desiredGrade: '4th Grade',
        studentType: 'NEW',
        primaryLanguage: 'Portuguese',
      },
      {
        fullName: 'Julia Oliveira',
        dateOfBirth: '2017-09-22',
        gender: 'F',
        desiredGrade: '2nd Grade',
        studentType: 'NEW',
        primaryLanguage: 'Portuguese',
      },
    ];

    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: twoStudents,
        livesWith: 'BOTH_PARENTS',
        father: { name: 'João Oliveira', email: 'joao@test.com', phone: '(31) 99111-2222' },
        mother: { name: 'Maria Oliveira', email: 'maria@test.com', phone: '(31) 99333-4444' },
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      })
      .expect(201);

    expect(lead.children).toHaveLength(2);
    expect(lead.children[0].fullName).toBe('Pedro Oliveira');
    expect(lead.children[1].fullName).toBe('Julia Oliveira');

    // === Generate enrollment token ===
    const enrollToken = db.generateEnrollmentToken(lead.id);

    // === Fetch enrollment pre-fill ===
    const prefillRes = await request(app)
      .get(`/public/enrollment/${enrollToken}`)
      .expect(200);

    expect(prefillRes.body.data.students).toHaveLength(2);

    // === Upload per-child documents ===
    const child1Id = lead.children[0].id;
    const child2Id = lead.children[1].id;

    // Child 1 docs
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', child1Id)
      .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
      .attach('files', Buffer.from('rg1'), 'rg_pedro.pdf')
      .expect(201);

    // Child 2 docs
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .field('childId', child2Id)
      .field('includesOtherDocs', JSON.stringify(['STUDENT_CPF']))
      .attach('files', Buffer.from('rg2'), 'rg_julia.pdf')
      .expect(201);

    // Verify per-child isolation
    const child1Docs = lead.enrollmentDocuments.filter(d => d.childId === child1Id);
    const child2Docs = lead.enrollmentDocuments.filter(d => d.childId === child2Id);
    expect(child1Docs).toHaveLength(1);
    expect(child2Docs).toHaveLength(1);
    expect(child1Docs[0].fileName).toBe('rg_pedro.pdf');
    expect(child2Docs[0].fileName).toBe('rg_julia.pdf');

    // === Submit enrollment with childrenData (multi-child) ===
    const enrollRes = await request(app)
      .post('/public/enrollment')
      .send({
        enrollmentToken: enrollToken,
        childrenData: [
          {
            childId: child1Id,
            enrollmentInfo: {
              personType: 'INDIVIDUAL', studentCpf: '111.222.333-44',
              studentIdNumber: 'MG-111', studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
            },
            health: {
              weight: '32', height: '140', bloodType: 'A+',
              medicalConditions: ['NONE'], allergies: ['NONE'],
              feverMedications: ['DIPIRONA'], painMedications: ['IBUPROFENO'],
              hasHospitalizations: false, hasSeizures: false, hasEatingDisorder: false,
            },
          },
          {
            childId: child2Id,
            enrollmentInfo: {
              personType: 'INDIVIDUAL', studentCpf: '555.666.777-88',
              studentIdNumber: 'MG-222', studentIdIssueDate: '2021-03-15', studentIdIssuer: 'SSP',
            },
            health: {
              weight: '25', height: '120', bloodType: 'O-',
              medicalConditions: ['ASTHMA'], allergies: ['PEANUTS'],
              feverMedications: ['PARACETAMOL'], painMedications: ['IBUPROFENO'],
              hasHospitalizations: false, hasSeizures: false, hasEatingDisorder: false,
            },
          },
        ],
        fatherUpdates: {
          email: 'joao@test.com', phone: '(31) 99111-2222', cpf: '111.111.111-11',
          idNumber: 'MG-AAA', idIssueDate: '2014-01-01', idIssuer: 'SSP',
          dateOfBirth: '1980-01-01', education: 'SUPERIOR', religion: '',
          address: FAMILY.address,
        },
        motherUpdates: {
          email: 'maria@test.com', phone: '(31) 99333-4444', cpf: '222.222.222-22',
          idNumber: 'MG-BBB', idIssueDate: '2015-01-01', idIssuer: 'SSP',
          dateOfBirth: '1983-05-15', education: 'SUPERIOR', religion: '',
          address: FAMILY.address,
          sameAddressAsOtherParent: true,
        },
        emergencyContacts: [{ name: 'Tia Rosa', phone: '(31) 99999-0000', email: '', relationship: 'AUNT', isPrimary: true }],
        healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
        transport: { ...TRANSPORT_DATA, canLeaveAlone: true, dropoffPickupPersons: [], familyVehicles: [] },
        financialResponsible: { responsibleType: 'MOTHER', fullName: '', cpf: '', email: '', phone: '', address: {} },
        termsAccepted: true,
      })
      .expect(200);

    expect(enrollRes.body.success).toBe(true);

    // === FINAL VERIFICATION ===
    expect(lead.enrollmentStatus).toBe('FORM_RECEIVED');
    expect(lead.enrollmentSubmissionCount).toBe(1);

    // Per-child enrollment info
    expect(lead.enrollmentInfo).toHaveLength(2);
    expect(lead.enrollmentInfo.find(e => e.childId === child1Id)!.studentCpf).toBe('111.222.333-44');
    expect(lead.enrollmentInfo.find(e => e.childId === child2Id)!.studentCpf).toBe('555.666.777-88');

    // Per-child health
    expect(lead.childHealth).toHaveLength(2);
    const child1Health = lead.childHealth.find(h => h.childId === child1Id)!;
    const child2Health = lead.childHealth.find(h => h.childId === child2Id)!;
    expect(child1Health.bloodType).toBe('A+');
    expect(child1Health.medicalConditions).toEqual(['NONE']);
    expect(child2Health.bloodType).toBe('O-');
    expect(child2Health.medicalConditions).toEqual(['ASTHMA']);
    expect(child2Health.allergies).toEqual(['PEANUTS']);

    // Transport with canLeaveAlone=true
    expect(lead.transport!.canLeaveAlone).toBe(true);

    // Financial responsible is MOTHER
    expect(lead.financialResponsible!.responsibleType).toBe('MOTHER');
  });
});

// ============================================================================
// E2E: ERROR SCENARIOS
// ============================================================================

describe('E2E: Error Scenarios', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should reject enrollment before admission is completed', async () => {
    const lead = db.createLead('Família Incompleta');
    db.generateApplicationToken(lead.id);
    // Don't submit admission form!
    const enrollToken = db.generateEnrollmentToken(lead.id);

    // Try to access enrollment pre-fill
    await request(app)
      .get(`/public/enrollment/${enrollToken}`)
      .expect(400);
  });

  it('should reject enrollment submission with expired token', async () => {
    const lead = db.createLead('Família Expirada');
    const appToken = db.generateApplicationToken(lead.id);

    // Submit admission
    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: [FAMILY.student],
        livesWith: 'BOTH_PARENTS',
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      });

    // Generate enrollment token and expire it
    const enrollToken = db.generateEnrollmentToken(lead.id);
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000); // expired

    // Try enrollment pre-fill
    await request(app)
      .get(`/public/enrollment/${enrollToken}`)
      .expect(410);
  });

  it('should enforce max submission limit', async () => {
    const lead = db.createLead('Família Limite');
    const appToken = db.generateApplicationToken(lead.id);

    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: [FAMILY.student],
        livesWith: 'BOTH_PARENTS',
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      });

    const enrollToken = db.generateEnrollmentToken(lead.id);

    // Simulate 5 previous submissions
    lead.enrollmentSubmissionCount = 5;

    // 6th submission should fail
    const res = await request(app)
      .post('/public/enrollment')
      .send({
        enrollmentToken: enrollToken,
        enrollmentInfo: {
          personType: 'INDIVIDUAL', studentCpf: '123', studentIdNumber: 'MG-1',
          studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
        },
        fatherUpdates: ENROLLMENT_FATHER_UPDATES,
        motherUpdates: ENROLLMENT_MOTHER_UPDATES,
        health: HEALTH_DATA,
        emergencyContacts: [{ name: 'Test', phone: '123456789', isPrimary: true }],
        healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
        transport: TRANSPORT_DATA,
        financialResponsible: { responsibleType: 'FATHER' },
        termsAccepted: true,
      })
      .expect(429);

    expect(res.body.code).toBe('MAX_SUBMISSIONS_EXCEEDED');
  });

  it('should enforce document limit (50 max)', async () => {
    const lead = db.createLead('Família Docs');
    const appToken = db.generateApplicationToken(lead.id);

    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: [FAMILY.student],
        livesWith: 'BOTH_PARENTS',
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      });

    const enrollToken = db.generateEnrollmentToken(lead.id);

    // Pre-fill 49 docs
    for (let i = 0; i < 49; i++) {
      lead.enrollmentDocuments.push({
        id: db.generateId(),
        leadId: lead.id,
        childId: null,
        documentType: 'OTHER',
        category: 'STUDENT',
        fileName: `doc_${i}.pdf`,
        fileUrl: `https://test/${i}`,
        fileSize: 1000,
        mimeType: 'application/pdf',
        includesOtherDocs: [],
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
      });
    }

    // 50th should succeed
    await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('ok'), 'doc_50.pdf')
      .expect(201);

    // 51st should fail (limit is 50)
    const res = await request(app)
      .post(`/public/enrollment/${enrollToken}/documents`)
      .field('documentType', 'OTHER')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('fail'), 'doc_51.pdf')
      .expect(400);

    expect(res.body.code).toBe('DOCUMENT_LIMIT_EXCEEDED');
  });

  it('should return validation details on Zod failure', async () => {
    const lead = db.createLead('Família Validação');
    const appToken = db.generateApplicationToken(lead.id);

    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: [FAMILY.student],
        livesWith: 'BOTH_PARENTS',
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      });

    const enrollToken = db.generateEnrollmentToken(lead.id);

    // Submit with invalid data
    const res = await request(app)
      .post('/public/enrollment')
      .send({
        enrollmentToken: enrollToken,
        termsAccepted: false, // This alone will fail
        emergencyContacts: [], // Also fails min(1)
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toBeDefined();
    expect(Array.isArray(res.body.details)).toBe(true);
    // Should show specific field errors
    expect(res.body.details.some((d: any) => d.path === 'termsAccepted')).toBe(true);
    expect(res.body.details.some((d: any) => d.path === 'emergencyContacts')).toBe(true);
  });
});

// ============================================================================
// E2E: FORM DRAFT (Auto-save)
// ============================================================================

describe('E2E: Form Draft (Auto-save)', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should save and restore enrollment form draft', async () => {
    const lead = db.createLead('Família Draft');
    const appToken = db.generateApplicationToken(lead.id);

    // Submit admission
    await request(app)
      .post('/public/admissions')
      .send({
        applicationToken: appToken,
        students: [FAMILY.student],
        livesWith: 'BOTH_PARENTS',
        father: FAMILY.father,
        mother: FAMILY.mother,
        address: FAMILY.address,
        siblings: [],
        source: 'WEBSITE',
      });

    const enrollToken = db.generateEnrollmentToken(lead.id);

    // Save draft at step 2
    await request(app)
      .put(`/public/form-draft/${enrollToken}`)
      .send({
        formType: 'ENROLLMENT',
        data: { health: HEALTH_DATA, enrollmentInfo: { personType: 'INDIVIDUAL' } },
        step: 2,
      })
      .expect(200);

    // Restore draft
    const draftRes = await request(app)
      .get(`/public/form-draft/${enrollToken}?type=ENROLLMENT`)
      .expect(200);

    expect(draftRes.body.data.step).toBe(2);
    expect(draftRes.body.data.data.health.bloodType).toBe('O+');

    // Update draft to step 4
    await request(app)
      .put(`/public/form-draft/${enrollToken}`)
      .send({
        formType: 'ENROLLMENT',
        data: { ...draftRes.body.data.data, transport: TRANSPORT_DATA },
        step: 4,
      })
      .expect(200);

    // Verify updated
    const updatedDraft = await request(app)
      .get(`/public/form-draft/${enrollToken}?type=ENROLLMENT`)
      .expect(200);

    expect(updatedDraft.body.data.step).toBe(4);
    expect(updatedDraft.body.data.data.transport.transportMethod).toBe('CAR');
  });
});
