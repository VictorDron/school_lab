/**
 * Multi-Child Per-Child Transport Tests
 *
 * Rigorous tests for the per-child transport feature including:
 *   - Per-child transport data isolation (3 children, different transport)
 *   - Transport + authorized persons isolation per child
 *   - Mixed transport modes (car, school bus, walk, can-leave-alone)
 *   - Transport with and without authorized persons per child
 *   - Backward compatibility: single-child root transport still works
 *   - Zod validation: childrenData[].transport schema
 *   - Zod validation: conditional fields (school bus, canLeaveAlone, etc.)
 *   - Cross-child authorized person CPF uniqueness
 *   - Partial transport: some children with, some without
 *   - Re-submission: overwrite per-child transport data
 *   - Edge cases: empty arrays, null optionals, boundary values
 *
 * Uses the same mock in-memory database pattern as multi-child-complex.test.ts.
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
  childTransport: MockChildTransport[];
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

interface MockChildTransport {
  childId: string;
  dropoffPickupPersons: string[];
  dropoffPickupOther?: string;
  transportMethod: string;
  transportMethodOther?: string;
  familyVehicles: any[];
  canLeaveAlone: boolean;
  isAthlete: boolean;
  athleteSchedule?: any;
  schoolBusCompany?: string;
  schoolBusContactName?: string;
  schoolBusContactPhone?: string;
  schoolBusContactEmail?: string;
  hasLegalRestrictions: boolean;
  legalRestrictionsNotes?: string;
  allowThirdPartyPickup: boolean;
  authorizedPersons: any[];
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
      childTransport: [],
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
        student: lead.children.find(c => c.isApplicant) || null,
        father: lead.parents.find(p => p.parentType === 'FATHER') || null,
        mother: lead.parents.find(p => p.parentType === 'MOTHER') || null,
        address: lead.address,
      },
    });
  });

  // POST /admissions
  router.post('/admissions', express.json(), (req: Request, res: Response) => {
    const body = req.body;
    const lead = db.findLeadByApplicationToken(body.applicationToken);
    if (!lead) return res.status(404).json({ success: false });
    if (lead.formSubmissionCount >= 5) return res.status(429).json({ success: false, code: 'MAX_SUBMISSIONS_EXCEEDED' });

    // Create children
    const students = body.students || [body.student].filter(Boolean);
    lead.children = students.map((s: any) => ({
      id: db.generateId(),
      leadId: lead.id,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      desiredGrade: s.desiredGrade || '',
      studentType: s.studentType || 'NEW',
      primaryLanguage: s.primaryLanguage || 'Portuguese',
      otherLanguages: s.otherLanguages || [],
      relationship: 'STUDENT',
      isApplicant: true,
      cpf: s.cpf,
      specialNeeds: s.specialNeeds,
    }));

    // Create parents
    lead.parents = [];
    if (body.father) {
      lead.parents.push({ id: db.generateId(), leadId: lead.id, parentType: 'FATHER', fullName: body.father.name, email: body.father.email, phone: body.father.phone, cpf: body.father.cpf });
    }
    if (body.mother) {
      lead.parents.push({ id: db.generateId(), leadId: lead.id, parentType: 'MOTHER', fullName: body.mother.name, email: body.mother.email, phone: body.mother.phone, cpf: body.mother.cpf });
    }

    lead.address = body.address || null;
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount++;

    return res.status(201).json({ success: true, data: { leadCode: lead.code } });
  });

  // GET /enrollment/:token
  router.get('/enrollment/:token', (req: Request, res: Response) => {
    const lead = db.findLeadByEnrollmentToken(req.params.token);
    if (!lead) return res.status(400).json({ success: false, code: 'TOKEN_NOT_FOUND' });
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, code: 'TOKEN_EXPIRED' });
    }

    const applicants = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
    const students = applicants.map(child => {
      const ct = lead.childTransport.find(t => t.childId === child.id);
      return {
        id: child.id,
        fullName: child.fullName,
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        desiredGrade: child.desiredGrade,
        childTransport: ct || null,
      };
    });

    return res.json({
      success: true,
      data: {
        leadCode: lead.code,
        familyName: lead.familyName,
        students,
        student: applicants[0] || null,
        father: lead.parents.find(p => p.parentType === 'FATHER') || null,
        mother: lead.parents.find(p => p.parentType === 'MOTHER') || null,
        address: lead.address,
        transport: lead.transport,
      },
    });
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
      });
    }
    if (mother && data.motherUpdates) {
      Object.assign(mother, {
        email: data.motherUpdates.email || mother.email,
        phone: data.motherUpdates.phone || mother.phone,
        cpf: data.motherUpdates.cpf || mother.cpf,
        sameAddressAsOtherParent: data.motherUpdates.sameAddressAsOtherParent,
      });
    }

    // Per-child data (multi-child)
    if (data.childrenData && data.childrenData.length > 0) {
      for (const cd of data.childrenData) {
        if (cd.enrollmentInfo) {
          lead.enrollmentInfo.push({ childId: cd.childId, ...cd.enrollmentInfo, termsAccepted: data.termsAccepted });
        }
        if (cd.health) {
          lead.childHealth.push({ childId: cd.childId, ...cd.health } as MockChildHealth);
        }
        if (cd.transport) {
          // Upsert: remove existing then add
          lead.childTransport = lead.childTransport.filter(t => t.childId !== cd.childId);
          lead.childTransport.push({
            childId: cd.childId,
            dropoffPickupPersons: cd.transport.dropoffPickupPersons || [],
            dropoffPickupOther: cd.transport.dropoffPickupOther,
            transportMethod: cd.transport.transportMethod || '',
            transportMethodOther: cd.transport.transportMethodOther,
            familyVehicles: cd.transport.familyVehicles || [],
            canLeaveAlone: cd.transport.canLeaveAlone || false,
            isAthlete: cd.transport.isAthlete || false,
            athleteSchedule: cd.transport.athleteSchedule,
            schoolBusCompany: cd.transport.schoolBusCompany,
            schoolBusContactName: cd.transport.schoolBusContactName,
            schoolBusContactPhone: cd.transport.schoolBusContactPhone,
            schoolBusContactEmail: cd.transport.schoolBusContactEmail,
            hasLegalRestrictions: cd.transport.hasLegalRestrictions || false,
            legalRestrictionsNotes: cd.transport.legalRestrictionsNotes,
            allowThirdPartyPickup: cd.transport.allowThirdPartyPickup || false,
            authorizedPersons: cd.transport.authorizedPersons || [],
          });
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
      // Single-child transport: also store in childTransport for consistency
      if (data.transport) {
        lead.childTransport = lead.childTransport.filter(t => t.childId !== childId);
        lead.childTransport.push({
          childId,
          dropoffPickupPersons: data.transport.dropoffPickupPersons || [],
          dropoffPickupOther: data.transport.dropoffPickupOther,
          transportMethod: data.transport.transportMethod || '',
          transportMethodOther: data.transport.transportMethodOther,
          familyVehicles: data.transport.familyVehicles || [],
          canLeaveAlone: data.transport.canLeaveAlone || false,
          isAthlete: data.transport.isAthlete || false,
          athleteSchedule: data.transport.athleteSchedule,
          schoolBusCompany: data.transport.schoolBusCompany,
          schoolBusContactName: data.transport.schoolBusContactName,
          schoolBusContactPhone: data.transport.schoolBusContactPhone,
          schoolBusContactEmail: data.transport.schoolBusContactEmail,
          hasLegalRestrictions: data.transport.hasLegalRestrictions || false,
          legalRestrictionsNotes: data.transport.legalRestrictionsNotes,
          allowThirdPartyPickup: data.transport.allowThirdPartyPickup || false,
          authorizedPersons: data.transport.authorizedPersons || [],
        });
      }
    }

    // Emergency contacts
    lead.emergencyContacts = data.emergencyContacts.map((c: any) => ({
      id: db.generateId(), name: c.name, phone: c.phone,
      email: c.email || '', relationship: c.relationship || '', isPrimary: c.isPrimary ?? false,
    }));

    // Health plan
    lead.healthPlan = data.healthPlan as MockHealthPlan;

    // Root transport (backward compat)
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
  name: 'Família Santos',
  father: { name: 'Roberto Santos', email: 'roberto@test.com', phone: '(31) 99111-0000' },
  mother: { name: 'Claudia Santos', email: 'claudia@test.com', phone: '(31) 99222-0000' },
  students: [
    { fullName: 'Lucas Santos', dateOfBirth: '2012-03-10', gender: 'M', desiredGrade: '7th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
    { fullName: 'Isabela Santos', dateOfBirth: '2015-07-22', gender: 'F', desiredGrade: '4th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
    { fullName: 'Miguel Santos', dateOfBirth: '2019-11-05', gender: 'M', desiredGrade: 'Pre-K', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  ],
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
};

const FAMILY_2_KIDS = {
  name: 'Família Lima',
  father: { name: 'Marcos Lima', email: 'marcos@test.com', phone: '(31) 97111-0000' },
  mother: { name: 'Fernanda Lima', email: 'fernanda@test.com', phone: '(31) 97222-0000' },
  students: [
    { fullName: 'Laura Lima', dateOfBirth: '2014-01-15', gender: 'F', desiredGrade: '5th Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
    { fullName: 'Davi Lima', dateOfBirth: '2017-09-20', gender: 'M', desiredGrade: '2nd Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  ],
  address: { country: 'Brasil', state: 'SP', city: 'São Paulo', neighborhood: 'Pinheiros', street: 'Rua Faria Lima', number: '500', complement: 'Apto 12', zipCode: '05426-000' },
};

const FAMILY_1_KID = {
  name: 'Família Costa',
  father: { name: 'Henrique Costa', email: 'henrique@test.com', phone: '(21) 98111-0000' },
  mother: { name: 'Renata Costa', email: 'renata@test.com', phone: '(21) 98222-0000' },
  students: [
    { fullName: 'Sofia Costa', dateOfBirth: '2016-05-10', gender: 'F', desiredGrade: '3rd Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  ],
  address: { country: 'Brasil', state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Copacabana', street: 'Av Atlântica', number: '200', complement: '', zipCode: '22021-001' },
};

const VALID_FATHER_UPDATES = {
  email: 'roberto@test.com', phone: '(31) 99111-0000', cpf: '111.222.333-44',
  idNumber: 'MG-AAA', idIssueDate: '2014-01-01', idIssuer: 'SSP',
  dateOfBirth: '1980-01-01', education: 'SUPERIOR', religion: '',
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
};

const VALID_MOTHER_UPDATES = {
  email: 'claudia@test.com', phone: '(31) 99222-0000', cpf: '555.666.777-88',
  idNumber: 'MG-BBB', idIssueDate: '2015-01-01', idIssuer: 'SSP',
  dateOfBirth: '1983-05-15', education: 'SUPERIOR', religion: '',
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '', zipCode: '30130-000' },
  sameAddressAsOtherParent: true,
};

function makeTransportData(overrides: Partial<MockChildTransport> = {}): any {
  return {
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
    ...overrides,
  };
}

function makeHealthData(overrides: Record<string, any> = {}): any {
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
    transport: makeTransportData(),
    financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
    termsAccepted: true as const,
    ...extra,
  };
}

function buildSingleChildPayload(enrollToken: string, extra: Record<string, any> = {}) {
  return {
    enrollmentToken: enrollToken,
    enrollmentInfo: makeEnrollmentInfo(),
    fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'henrique@test.com', phone: '(21) 98111-0000', cpf: '111.222.333-44' },
    motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'renata@test.com', phone: '(21) 98222-0000', cpf: '555.666.777-88', sameAddressAsOtherParent: true },
    health: makeHealthData(),
    emergencyContacts: [{ name: 'Tia Ana', phone: '(21) 99999-0000', email: '', relationship: 'AUNT', isPrimary: true }],
    healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
    transport: makeTransportData(),
    financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
    termsAccepted: true as const,
    ...extra,
  };
}

// ============================================================================
// TESTS: Per-Child Transport Data Isolation
// ============================================================================

describe('Multi-Child: Per-Child Transport Data Isolation', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should store separate transport data for each of 3 children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Toyota Corolla', color: 'Branco', plate: 'AAA-1A11' }] }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'SCHOOL_BUS', familyVehicles: [], schoolBusCompany: 'TransKids', schoolBusContactName: 'João', schoolBusContactPhone: '(31) 98888-0000' }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData(),
        transport: makeTransportData({ canLeaveAlone: true, dropoffPickupPersons: [], transportMethod: '' }),
      },
    ]);

    const res = await request(app).post('/public/enrollment').send(payload).expect(200);
    expect(res.body.success).toBe(true);

    // Verify 3 separate transport records
    expect(lead.childTransport).toHaveLength(3);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;
    const t2 = lead.childTransport.find(t => t.childId === children[2].id)!;

    // Child 0: CAR
    expect(t0.transportMethod).toBe('CAR');
    expect(t0.familyVehicles).toHaveLength(1);
    expect(t0.familyVehicles[0].model).toBe('Toyota Corolla');
    expect(t0.canLeaveAlone).toBe(false);

    // Child 1: SCHOOL_BUS
    expect(t1.transportMethod).toBe('SCHOOL_BUS');
    expect(t1.schoolBusCompany).toBe('TransKids');
    expect(t1.schoolBusContactName).toBe('João');
    expect(t1.familyVehicles).toHaveLength(0);
    expect(t1.canLeaveAlone).toBe(false);

    // Child 2: can leave alone
    expect(t2.canLeaveAlone).toBe(true);
    expect(t2.transportMethod).toBe('');
  });

  it('should NOT cross-contaminate transport between children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'CAR',
          familyVehicles: [{ model: 'BMW X3', color: 'Preto', plate: 'BMW-1B23' }],
          hasLegalRestrictions: true,
          legalRestrictionsNotes: 'Pai não pode buscar',
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'WALK',
          familyVehicles: [],
          hasLegalRestrictions: false,
          legalRestrictionsNotes: '',
          dropoffPickupPersons: ['GRANDMOTHER'],
        }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData(),
        transport: makeTransportData({
          canLeaveAlone: true,
          dropoffPickupPersons: [],
          transportMethod: '',
          familyVehicles: [],
        }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;
    const t2 = lead.childTransport.find(t => t.childId === children[2].id)!;

    // Cross-contamination checks
    expect(t0.hasLegalRestrictions).toBe(true);
    expect(t1.hasLegalRestrictions).toBe(false);
    expect(t2.hasLegalRestrictions).toBe(false);

    expect(t0.legalRestrictionsNotes).toBe('Pai não pode buscar');
    expect(t1.legalRestrictionsNotes).toBe('');
    expect(t2.legalRestrictionsNotes).toBeFalsy();

    expect(t0.familyVehicles).toHaveLength(1);
    expect(t1.familyVehicles).toHaveLength(0);
    expect(t2.familyVehicles).toHaveLength(0);

    expect(t0.canLeaveAlone).toBe(false);
    expect(t1.canLeaveAlone).toBe(false);
    expect(t2.canLeaveAlone).toBe(true);

    expect(t1.dropoffPickupPersons).toContain('GRANDMOTHER');
    expect(t0.dropoffPickupPersons).not.toContain('GRANDMOTHER');
  });

  it('should store unique childId for each transport record', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${(i + 1) * 100}.000.000-0${i + 1}` }),
      health: makeHealthData(),
      transport: makeTransportData({ transportMethod: i === 0 ? 'CAR' : 'WALK' }),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const transportChildIds = lead.childTransport.map(t => t.childId);
    expect(new Set(transportChildIds).size).toBe(transportChildIds.length);
    expect(transportChildIds).toHaveLength(3);
  });
});

// ============================================================================
// TESTS: Per-Child Authorized Persons
// ============================================================================

describe('Multi-Child: Per-Child Authorized Persons Isolation', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should store different authorized persons for each child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
          authorizedPersons: [
            { name: 'Avó Maria', dateOfBirth: '1950-01-01', cpf: '999.888.777-01', email: 'maria@test.com', bond: 'GRANDMOTHER' },
            { name: 'Tio Paulo', dateOfBirth: '1975-06-15', cpf: '888.777.666-02', email: 'paulo@test.com', bond: 'UNCLE' },
          ],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
          authorizedPersons: [
            { name: 'Vizinha Ana', dateOfBirth: '1985-03-20', cpf: '777.666.555-03', email: 'ana@test.com', bond: 'OTHER' },
          ],
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    // Child 0 has 2 authorized persons
    expect(t0.authorizedPersons).toHaveLength(2);
    expect(t0.authorizedPersons[0].name).toBe('Avó Maria');
    expect(t0.authorizedPersons[1].name).toBe('Tio Paulo');

    // Child 1 has 1 authorized person
    expect(t1.authorizedPersons).toHaveLength(1);
    expect(t1.authorizedPersons[0].name).toBe('Vizinha Ana');

    // Cross-contamination check
    expect(t0.authorizedPersons.map((p: any) => p.name)).not.toContain('Vizinha Ana');
    expect(t1.authorizedPersons.map((p: any) => p.name)).not.toContain('Avó Maria');
    expect(t1.authorizedPersons.map((p: any) => p.name)).not.toContain('Tio Paulo');
  });

  it('should support one child with authorized persons and another without', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
          authorizedPersons: [
            { name: 'Babá Rosa', dateOfBirth: '1990-01-01', cpf: '444.333.222-01', email: 'rosa@test.com', bond: 'OTHER' },
          ],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          authorizedPersons: [],
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.dropoffPickupPersons).toContain('THIRD_PARTY');
    expect(t0.authorizedPersons).toHaveLength(1);
    expect(t1.dropoffPickupPersons).not.toContain('THIRD_PARTY');
    expect(t1.authorizedPersons).toHaveLength(0);
  });

  it('should preserve authorized person vehicle data per child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
          authorizedPersons: [
            {
              name: 'Motorista João', dateOfBirth: '1985-01-01', cpf: '333.222.111-01', email: 'joao@test.com', bond: 'DRIVER',
              vehicle: { model: 'VW Gol', color: 'Azul', plate: 'GOL-1G23' },
            },
          ],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
          authorizedPersons: [
            {
              name: 'Motorista José', dateOfBirth: '1990-01-01', cpf: '222.111.000-02', email: 'jose@test.com', bond: 'DRIVER',
              vehicle: { model: 'Fiat Uno', color: 'Vermelho', plate: 'UNO-2U34' },
            },
          ],
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.authorizedPersons[0].vehicle.model).toBe('VW Gol');
    expect(t0.authorizedPersons[0].vehicle.plate).toBe('GOL-1G23');
    expect(t1.authorizedPersons[0].vehicle.model).toBe('Fiat Uno');
    expect(t1.authorizedPersons[0].vehicle.plate).toBe('UNO-2U34');
  });
});

// ============================================================================
// TESTS: Mixed Transport Modes
// ============================================================================

describe('Multi-Child: Mixed Transport Modes', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should handle CAR + SCHOOL_BUS + WALK for 3 children', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'CAR',
          dropoffPickupPersons: ['FATHER'],
          familyVehicles: [{ model: 'Jeep Renegade', color: 'Verde', plate: 'JEE-1J11' }],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'SCHOOL_BUS',
          dropoffPickupPersons: ['SCHOOL_BUS'],
          familyVehicles: [],
          schoolBusCompany: 'Escolar Seguro',
          schoolBusContactName: 'Carlos Motorista',
          schoolBusContactPhone: '(31) 3333-4444',
          schoolBusContactEmail: 'carlos@escolar.com',
        }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'WALK',
          dropoffPickupPersons: ['MOTHER', 'GRANDMOTHER'],
          familyVehicles: [],
        }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;
    const t2 = lead.childTransport.find(t => t.childId === children[2].id)!;

    expect(t0.transportMethod).toBe('CAR');
    expect(t0.dropoffPickupPersons).toEqual(['FATHER']);
    expect(t0.familyVehicles[0].model).toBe('Jeep Renegade');

    expect(t1.transportMethod).toBe('SCHOOL_BUS');
    expect(t1.schoolBusCompany).toBe('Escolar Seguro');
    expect(t1.schoolBusContactName).toBe('Carlos Motorista');

    expect(t2.transportMethod).toBe('WALK');
    expect(t2.dropoffPickupPersons).toContain('MOTHER');
    expect(t2.dropoffPickupPersons).toContain('GRANDMOTHER');
  });

  it('should handle one canLeaveAlone child and two that cannot', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ canLeaveAlone: true, dropoffPickupPersons: [], transportMethod: '' }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ canLeaveAlone: false, transportMethod: 'CAR', familyVehicles: [{ model: 'VW Polo', color: 'Cinza', plate: 'VWP-1V11' }] }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData(),
        transport: makeTransportData({ canLeaveAlone: false, transportMethod: 'WALK', dropoffPickupPersons: ['FATHER'] }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.childTransport.find(t => t.childId === children[0].id)!.canLeaveAlone).toBe(true);
    expect(lead.childTransport.find(t => t.childId === children[1].id)!.canLeaveAlone).toBe(false);
    expect(lead.childTransport.find(t => t.childId === children[2].id)!.canLeaveAlone).toBe(false);
  });

  it('should handle athlete schedule per child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          isAthlete: true,
          athleteSchedule: { mon: { lateEntry: '09:00', earlyExit: '15:00' }, wed: { earlyExit: '14:00' } },
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ isAthlete: false }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.isAthlete).toBe(true);
    expect(t0.athleteSchedule.mon.lateEntry).toBe('09:00');
    expect(t0.athleteSchedule.wed.earlyExit).toBe('14:00');
    expect(t1.isAthlete).toBe(false);
  });

  it('should handle OTHER transport method per child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'OTHER', transportMethodOther: 'Bicicleta' }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Fiat Argo', color: 'Preto', plate: 'ARG-2A34' }] }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.transportMethod).toBe('OTHER');
    expect(t0.transportMethodOther).toBe('Bicicleta');
    expect(t1.transportMethod).toBe('CAR');
    expect(t1.transportMethodOther).toBeFalsy();
  });
});

// ============================================================================
// TESTS: Backward Compatibility — Single Child
// ============================================================================

describe('Single-Child: Transport Backward Compatibility', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should store root transport for single-child (no childrenData)', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_1_KID.students, FAMILY_1_KID);

    const payload = buildSingleChildPayload(enrollToken, {
      transport: makeTransportData({
        transportMethod: 'SCHOOL_BUS',
        dropoffPickupPersons: ['SCHOOL_BUS'],
        familyVehicles: [],
        schoolBusCompany: 'TransEscolar BH',
        schoolBusContactName: 'Seu Pedro',
        schoolBusContactPhone: '(31) 2222-3333',
      }),
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Root transport should be stored
    expect(lead.transport).toBeTruthy();
    expect(lead.transport!.transportMethod).toBe('SCHOOL_BUS');

    // Child transport should also be stored
    expect(lead.childTransport).toHaveLength(1);
    expect(lead.childTransport[0].transportMethod).toBe('SCHOOL_BUS');
    expect(lead.childTransport[0].schoolBusCompany).toBe('TransEscolar BH');
  });

  it('should work with canLeaveAlone for single child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_1_KID.students, FAMILY_1_KID);

    const payload = buildSingleChildPayload(enrollToken, {
      transport: makeTransportData({
        canLeaveAlone: true,
        dropoffPickupPersons: [],
        transportMethod: '',
        familyVehicles: [],
      }),
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.transport!.canLeaveAlone).toBe(true);
    expect(lead.childTransport).toHaveLength(1);
    expect(lead.childTransport[0].canLeaveAlone).toBe(true);
  });

  it('should store authorized persons for single child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_1_KID.students, FAMILY_1_KID);

    const payload = buildSingleChildPayload(enrollToken, {
      transport: makeTransportData({
        dropoffPickupPersons: ['FATHER', 'MOTHER', 'THIRD_PARTY'],
        authorizedPersons: [
          { name: 'Tia Lúcia', dateOfBirth: '1970-01-01', cpf: '111.000.999-01', email: 'lucia@test.com', bond: 'AUNT' },
        ],
      }),
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    expect(lead.childTransport[0].dropoffPickupPersons).toContain('THIRD_PARTY');
    expect(lead.childTransport[0].authorizedPersons).toHaveLength(1);
    expect(lead.childTransport[0].authorizedPersons[0].name).toBe('Tia Lúcia');
  });
});

// ============================================================================
// TESTS: Re-submission (Overwrite)
// ============================================================================

describe('Multi-Child: Transport Re-submission Overwrites', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should overwrite per-child transport on re-submission', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // First submission: both children with CAR
    const payload1 = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Honda Fit', color: 'Azul', plate: 'FIT-1F11' }] }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Kia Cerato', color: 'Branco', plate: 'KIA-2K22' }] }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload1).expect(200);
    expect(lead.childTransport).toHaveLength(2);
    expect(lead.childTransport.find(t => t.childId === children[0].id)!.familyVehicles[0].model).toBe('Honda Fit');

    // Second submission: child 0 changes to SCHOOL_BUS, child 1 stays CAR but different vehicle
    const payload2 = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'SCHOOL_BUS',
          dropoffPickupPersons: ['SCHOOL_BUS'],
          familyVehicles: [],
          schoolBusCompany: 'Van Escolar',
          schoolBusContactName: 'Dona Maria',
          schoolBusContactPhone: '(31) 4444-5555',
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Hyundai HB20', color: 'Vermelho', plate: 'HB2-3H33' }] }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload2).expect(200);

    // Should still have exactly 2 records (overwritten, not duplicated)
    expect(lead.childTransport).toHaveLength(2);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    // Verify overwrite happened
    expect(t0.transportMethod).toBe('SCHOOL_BUS');
    expect(t0.schoolBusCompany).toBe('Van Escolar');
    expect(t0.familyVehicles).toHaveLength(0); // Car vehicles cleared

    expect(t1.transportMethod).toBe('CAR');
    expect(t1.familyVehicles[0].model).toBe('Hyundai HB20'); // Updated
    expect(t1.familyVehicles[0].model).not.toBe('Kia Cerato'); // Old value gone
  });
});

// ============================================================================
// TESTS: Partial Transport (some children with, some without)
// ============================================================================

describe('Multi-Child: Partial Transport Data', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should handle some children with transport and some without', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'VW Tiguan', color: 'Cinza', plate: 'TIG-1T11' }] }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        // No transport for child 1
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData(),
        transport: makeTransportData({ canLeaveAlone: true, dropoffPickupPersons: [], transportMethod: '' }),
      },
    ]);

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Only 2 children should have transport records
    expect(lead.childTransport).toHaveLength(2);
    expect(lead.childTransport.find(t => t.childId === children[0].id)).toBeTruthy();
    expect(lead.childTransport.find(t => t.childId === children[1].id)).toBeUndefined();
    expect(lead.childTransport.find(t => t.childId === children[2].id)).toBeTruthy();
  });

  it('should handle all children with transport (no omission)', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, children.map((c, i) => ({
      childId: c.id,
      enrollmentInfo: makeEnrollmentInfo({ studentCpf: `${(i + 1) * 100}.000.000-0${i + 1}` }),
      health: makeHealthData(),
      transport: makeTransportData({ transportMethod: 'WALK', dropoffPickupPersons: ['MOTHER'] }),
    })));

    await request(app).post('/public/enrollment').send(payload).expect(200);
    expect(lead.childTransport).toHaveLength(3);
  });
});

// ============================================================================
// TESTS: Zod Schema Validation for per-child transport
// ============================================================================

describe('Zod Schema: childrenData[].transport validation', () => {
  it('should accept valid per-child transport in childrenData', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
          health: makeHealthData(),
          transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'VW Golf', color: 'Preto', plate: 'GLF-1G11' }] }),
        },
        {
          childId: 'child-2',
          health: makeHealthData(),
          transport: makeTransportData({ canLeaveAlone: true, dropoffPickupPersons: [], transportMethod: '' }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept childrenData with transport having school bus fields', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            transportMethod: 'SCHOOL_BUS',
            dropoffPickupPersons: ['SCHOOL_BUS'],
            familyVehicles: [],
            schoolBusCompany: 'TransEscolar',
            schoolBusContactName: 'Sr. Pedro',
            schoolBusContactPhone: '(31) 3333-4444',
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject per-child transport with invalid authorized person (missing CPF)', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            allowThirdPartyPickup: true,
            authorizedPersons: [
              { name: 'Sem CPF', dateOfBirth: '1980-01-01', cpf: '', email: 'semcpf@test.com', bond: 'OTHER' },
            ],
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('authorizedPersons') && e.path.join('.').includes('cpf'))).toBe(true);
    }
  });

  it('should reject per-child transport with invalid authorized person email', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            allowThirdPartyPickup: true,
            authorizedPersons: [
              { name: 'Email Ruim', dateOfBirth: '1980-01-01', cpf: '123.456.789-00', email: 'not-an-email', bond: 'OTHER' },
            ],
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('email'))).toBe(true);
    }
  });

  it('should accept per-child transport with SCHOOL_BUS even when school bus fields empty (legacy/optional)', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            transportMethod: 'SCHOOL_BUS',
            dropoffPickupPersons: ['SCHOOL_BUS'],
            schoolBusCompany: '',
            schoolBusContactName: '',
            schoolBusContactPhone: '',
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should validate conditional dropoff/transport fields when canLeaveAlone=false in per-child', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            canLeaveAlone: false,
            dropoffPickupPersons: [], // Empty - should fail
            transportMethod: '', // Empty - should fail
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths.some(p => p.includes('dropoffPickupPersons'))).toBe(true);
      expect(paths.some(p => p.includes('transportMethod'))).toBe(true);
    }
  });

  it('should skip dropoff/transport validation when canLeaveAlone=true in per-child', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            canLeaveAlone: true,
            dropoffPickupPersons: [],
            transportMethod: '',
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should validate THIRD_PARTY in dropoffPickupPersons requires at least one authorized person in per-child', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            dropoffPickupPersons: ['THIRD_PARTY'],
            authorizedPersons: [], // Empty but THIRD_PARTY in dropoffPickupPersons
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('authorizedPersons'))).toBe(true);
    }
  });

  it('should accept per-child transport with OTHER dropoff person + explanation', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            dropoffPickupPersons: ['OTHER'],
            dropoffPickupOther: 'Vizinha dona Joana',
            transportMethod: 'WALK',
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept per-child transport with OTHER dropoff person without explanation (no OTHER validation in current schema)', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            dropoffPickupPersons: ['OTHER'],
            dropoffPickupOther: '', // No validation for this in current schema
            transportMethod: 'WALK',
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject OTHER transport method without explanation in per-child', () => {
    const payload = {
      enrollmentToken: 'test-token',
      childrenData: [
        {
          childId: 'child-1',
          transport: makeTransportData({
            transportMethod: 'OTHER',
            transportMethodOther: '', // Missing
          }),
        },
      ],
      fatherUpdates: VALID_FATHER_UPDATES,
      motherUpdates: VALID_MOTHER_UPDATES,
      emergencyContacts: [{ name: 'Contato', phone: '(31) 99999-0000', email: '', relationship: 'OTHER', isPrimary: true }],
      healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
      transport: makeTransportData(),
      financialResponsible: { responsibleType: 'FATHER' as const },
      termsAccepted: true,
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('transportMethodOther'))).toBe(true);
    }
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('Multi-Child Transport: Edge Cases', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should handle multiple family vehicles per child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'CAR',
          familyVehicles: [
            { model: 'BMW 320', color: 'Preto', plate: 'BMW-1B11' },
            { model: 'Mercedes A200', color: 'Branco', plate: 'MER-2M22' },
            { model: 'Audi A3', color: 'Cinza', plate: 'AUD-3A33' },
          ],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'CAR',
          familyVehicles: [
            { model: 'VW T-Cross', color: 'Prata', plate: 'TCR-4T44' },
          ],
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.familyVehicles).toHaveLength(3);
    expect(t1.familyVehicles).toHaveLength(1);
  });

  it('should handle legal restrictions per child', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          hasLegalRestrictions: true,
          legalRestrictionsNotes: 'Medida protetiva contra o avô paterno - processo 0001/2024',
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          hasLegalRestrictions: false,
          legalRestrictionsNotes: '',
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.hasLegalRestrictions).toBe(true);
    expect(t0.legalRestrictionsNotes).toContain('Medida protetiva');
    expect(t1.hasLegalRestrictions).toBe(false);
    expect(t1.legalRestrictionsNotes).toBe('');
  });

  it('should handle multiple dropoff persons per child independently', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['FATHER', 'MOTHER', 'GRANDMOTHER', 'GRANDFATHER'],
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          dropoffPickupPersons: ['MOTHER'],
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.dropoffPickupPersons).toHaveLength(4);
    expect(t0.dropoffPickupPersons).toContain('GRANDFATHER');
    expect(t1.dropoffPickupPersons).toHaveLength(1);
    expect(t1.dropoffPickupPersons).not.toContain('FATHER');
  });

  it('should handle all children as athletes with different schedules', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({
          isAthlete: true,
          athleteSchedule: {
            mon: { lateEntry: '10:00' },
            tue: { earlyExit: '14:30' },
            fri: { lateEntry: '09:30', earlyExit: '15:00' },
          },
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          isAthlete: true,
          athleteSchedule: {
            wed: { earlyExit: '13:00' },
            thu: { lateEntry: '08:30' },
          },
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;

    expect(t0.athleteSchedule.mon.lateEntry).toBe('10:00');
    expect(t0.athleteSchedule.fri.earlyExit).toBe('15:00');
    expect(t1.athleteSchedule.wed.earlyExit).toBe('13:00');

    // Cross-contamination: schedules should NOT bleed
    expect(t0.athleteSchedule.wed).toBeUndefined();
    expect(t1.athleteSchedule.mon).toBeUndefined();
    expect(t1.athleteSchedule.fri).toBeUndefined();
  });
});

// ============================================================================
// TESTS: GET /enrollment returns childTransport per-child
// ============================================================================

describe('GET /enrollment: Returns per-child transport data', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should return childTransport per student in GET response after submission', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Submit with per-child transport
    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData({ transportMethod: 'CAR', familyVehicles: [{ model: 'Civic', color: 'Prata', plate: 'CIV-1C11' }] }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        transport: makeTransportData({
          transportMethod: 'SCHOOL_BUS',
          dropoffPickupPersons: ['SCHOOL_BUS'],
          schoolBusCompany: 'TransBus',
          schoolBusContactName: 'João',
          schoolBusContactPhone: '(31) 5555-6666',
        }),
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    // Now GET enrollment data
    // Reset status to allow re-access (in real app, this would be the enrollment GET endpoint)
    lead.applicationStatus = 'FORM_RECEIVED';
    const getRes = await request(app).get(`/public/enrollment/${enrollToken}`).expect(200);

    expect(getRes.body.success).toBe(true);
    const students = getRes.body.data.students;
    expect(students).toHaveLength(2);

    // Verify each student has their own childTransport
    const s0 = students.find((s: any) => s.id === children[0].id);
    const s1 = students.find((s: any) => s.id === children[1].id);

    expect(s0.childTransport).toBeTruthy();
    expect(s0.childTransport.transportMethod).toBe('CAR');
    expect(s0.childTransport.familyVehicles[0].model).toBe('Civic');

    expect(s1.childTransport).toBeTruthy();
    expect(s1.childTransport.transportMethod).toBe('SCHOOL_BUS');
    expect(s1.childTransport.schoolBusCompany).toBe('TransBus');
  });

  it('should return null childTransport for students without transport data', async () => {
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_2_KIDS.students, FAMILY_2_KIDS);
    const children = lead.children.filter(c => c.isApplicant);

    // Submit with transport for only one child
    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData(),
        transport: makeTransportData(),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData(),
        // No transport
      },
    ], {
      fatherUpdates: { ...VALID_FATHER_UPDATES, email: 'marcos@test.com', phone: '(31) 97111-0000' },
      motherUpdates: { ...VALID_MOTHER_UPDATES, email: 'fernanda@test.com', phone: '(31) 97222-0000' },
    });

    await request(app).post('/public/enrollment').send(payload).expect(200);

    lead.applicationStatus = 'FORM_RECEIVED';
    const getRes = await request(app).get(`/public/enrollment/${enrollToken}`).expect(200);

    const students = getRes.body.data.students;
    const s0 = students.find((s: any) => s.id === children[0].id);
    const s1 = students.find((s: any) => s.id === children[1].id);

    expect(s0.childTransport).toBeTruthy();
    expect(s1.childTransport).toBeNull();
  });
});

// ============================================================================
// TESTS: Full E2E Multi-Child with Transport
// ============================================================================

describe('E2E: Complete Multi-Child Flow with Per-Child Transport', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createE2EApp(db);
  });

  it('should complete full enrollment for 3 children with different transport modes', async () => {
    // Phase 1: Admission
    const { lead, enrollToken } = await setupCompletedAdmission(db, app, FAMILY_3_KIDS.students, FAMILY_3_KIDS);
    const children = lead.children.filter(c => c.isApplicant);
    expect(children).toHaveLength(3);

    // Phase 2: Enrollment with per-child transport
    const payload = buildMultiChildPayload(enrollToken, [
      {
        childId: children[0].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '100.000.000-01' }),
        health: makeHealthData({ weight: '45', height: '155', bloodType: 'A+' }),
        transport: makeTransportData({
          transportMethod: 'CAR',
          dropoffPickupPersons: ['FATHER'],
          familyVehicles: [
            { model: 'Toyota Hilux', color: 'Branco', plate: 'HIL-1H11' },
            { model: 'Ford Ranger', color: 'Preto', plate: 'RNG-2R22' },
          ],
          isAthlete: true,
          athleteSchedule: { mon: { earlyExit: '14:00' }, wed: { earlyExit: '14:00' } },
        }),
      },
      {
        childId: children[1].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '200.000.000-02' }),
        health: makeHealthData({ weight: '32', height: '130', bloodType: 'B-' }),
        transport: makeTransportData({
          transportMethod: 'SCHOOL_BUS',
          dropoffPickupPersons: ['SCHOOL_BUS', 'MOTHER', 'THIRD_PARTY'],
          familyVehicles: [],
          schoolBusCompany: 'TransEscolar Premium',
          schoolBusContactName: 'Dona Lúcia',
          schoolBusContactPhone: '(31) 7777-8888',
          schoolBusContactEmail: 'lucia@transescolar.com',
          authorizedPersons: [
            { name: 'Avó Tereza', dateOfBirth: '1955-06-01', cpf: '888.999.000-01', email: 'tereza@test.com', bond: 'GRANDMOTHER' },
          ],
        }),
      },
      {
        childId: children[2].id,
        enrollmentInfo: makeEnrollmentInfo({ studentCpf: '300.000.000-03' }),
        health: makeHealthData({ weight: '20', height: '105', bloodType: 'O+' }),
        transport: makeTransportData({
          canLeaveAlone: false,
          transportMethod: 'WALK',
          dropoffPickupPersons: ['MOTHER', 'FATHER'],
          familyVehicles: [],
          hasLegalRestrictions: true,
          legalRestrictionsNotes: 'Tio José proibido de contato por decisão judicial',
        }),
      },
    ]);

    const res = await request(app).post('/public/enrollment').send(payload).expect(200);
    expect(res.body.success).toBe(true);

    // ---- VERIFY ALL DATA ----

    // Lead status
    expect(lead.enrollmentStatus).toBe('FORM_RECEIVED');
    expect(lead.enrollmentSubmissionCount).toBe(1);

    // Health per child
    expect(lead.childHealth).toHaveLength(3);

    // Enrollment info per child
    expect(lead.enrollmentInfo).toHaveLength(3);

    // Transport per child
    expect(lead.childTransport).toHaveLength(3);

    // Child 0: CAR + athlete
    const t0 = lead.childTransport.find(t => t.childId === children[0].id)!;
    expect(t0.transportMethod).toBe('CAR');
    expect(t0.familyVehicles).toHaveLength(2);
    expect(t0.isAthlete).toBe(true);
    expect(t0.athleteSchedule.mon.earlyExit).toBe('14:00');
    expect(t0.canLeaveAlone).toBe(false);
    expect(t0.hasLegalRestrictions).toBe(false);
    expect(t0.dropoffPickupPersons).not.toContain('THIRD_PARTY');

    // Child 1: SCHOOL_BUS + authorized person
    const t1 = lead.childTransport.find(t => t.childId === children[1].id)!;
    expect(t1.transportMethod).toBe('SCHOOL_BUS');
    expect(t1.schoolBusCompany).toBe('TransEscolar Premium');
    expect(t1.schoolBusContactEmail).toBe('lucia@transescolar.com');
    expect(t1.dropoffPickupPersons).toContain('THIRD_PARTY');
    expect(t1.authorizedPersons).toHaveLength(1);
    expect(t1.authorizedPersons[0].name).toBe('Avó Tereza');
    expect(t1.isAthlete).toBe(false);
    expect(t1.hasLegalRestrictions).toBe(false);

    // Child 2: WALK + legal restrictions
    const t2 = lead.childTransport.find(t => t.childId === children[2].id)!;
    expect(t2.transportMethod).toBe('WALK');
    expect(t2.hasLegalRestrictions).toBe(true);
    expect(t2.legalRestrictionsNotes).toContain('Tio José proibido');
    expect(t2.canLeaveAlone).toBe(false);
    expect(t2.isAthlete).toBe(false);
    expect(t2.allowThirdPartyPickup).toBe(false);

    // Cross-contamination final check
    expect(t0.schoolBusCompany).toBe('');
    expect(t0.authorizedPersons).toHaveLength(0);
    expect(t1.familyVehicles).toHaveLength(0);
    expect(t2.authorizedPersons).toHaveLength(0);
    expect(t2.schoolBusCompany).toBe('');
  });
});
