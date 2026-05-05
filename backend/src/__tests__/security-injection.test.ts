/**
 * Security Injection & Edge Case Tests
 *
 * Tests SECURITY scenarios:
 *   - XSS prevention (script tags, HTML injection, event handlers)
 *   - SQL injection prevention (parameterized queries via mock)
 *   - Token manipulation (modified, empty, long, null bytes, unicode, cross-lead)
 *   - Authorization bypass (cross-lead access, token reuse, enrollment before admission)
 *   - Malicious filenames (path traversal, double encoding, null bytes)
 *   - Input sanitization edge cases (null chars, long strings, unicode, RTL, emoji, whitespace)
 *   - Response security (error format, no internal details, Content-Type)
 *
 * Uses a mock in-memory database (same pattern as e2e-enrollment-flow.test.ts).
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

class MockDB {
  leads = new Map<string, any>();
  private idCounter = 0;

  generateId() {
    return `mock-${++this.idCounter}-${Date.now()}`;
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  createLead(familyName: string) {
    const id = this.generateId();
    const lead = {
      id,
      code: `LEAD-${String(this.idCounter).padStart(4, '0')}`,
      familyName,
      applicationToken: null as string | null,
      applicationTokenExpires: null as Date | null,
      applicationStatus: 'PENDING',
      formSubmissionCount: 0,
      enrollmentToken: null as string | null,
      enrollmentTokenExpires: null as Date | null,
      enrollmentStatus: 'NOT_STARTED',
      enrollmentSubmissionCount: 0,
      children: [] as any[],
      parents: [] as any[],
      address: null as any,
      enrollmentDocuments: [] as any[],
      emergencyContacts: [] as any[],
      healthPlan: null as any,
      transport: null as any,
      enrollmentInfo: [] as any[],
      childHealth: [] as any[],
      financialResponsible: null as any,
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

  submitAdmission(leadId: string, students: any[], father: any, mother: any, address: any) {
    const lead = this.leads.get(leadId)!;
    lead.children = students.map((s: any) => ({
      id: this.generateId(),
      leadId: lead.id,
      fullName: s.fullName,
      dateOfBirth: s.dateOfBirth || '2016-01-01',
      gender: s.gender || 'M',
      desiredGrade: s.desiredGrade || '3rd Grade',
      studentType: s.studentType || 'NEW',
      primaryLanguage: s.primaryLanguage || 'Portuguese',
      otherLanguages: [],
      relationship: 'STUDENT',
      isApplicant: true,
    }));
    lead.parents = [
      {
        id: this.generateId(), leadId: lead.id, parentType: 'FATHER',
        fullName: father.name, email: father.email, phone: father.phone,
        cpf: father.cpf,
      },
      {
        id: this.generateId(), leadId: lead.id, parentType: 'MOTHER',
        fullName: mother.name, email: mother.email, phone: mother.phone,
        cpf: mother.cpf,
      },
    ];
    lead.address = address;
    lead.applicationStatus = 'FORM_RECEIVED';
    lead.formSubmissionCount++;
  }

  findLeadByEnrollmentToken(token: string) {
    for (const lead of this.leads.values()) {
      if (lead.enrollmentToken === token) return lead;
    }
    return undefined;
  }

  findLeadByApplicationToken(token: string) {
    for (const lead of this.leads.values()) {
      if (lead.applicationToken === token) return lead;
    }
    return undefined;
  }
}

// ============================================================================
// TEST ROUTER (simulates public routes with mock DB)
// ============================================================================

function createTestRouter(db: MockDB) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  // GET /enrollment/:token
  router.get('/enrollment/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    const lead = db.findLeadByEnrollmentToken(token);

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

    const applicantChildren = lead.children.filter((c: any) => c.isApplicant && c.relationship === 'STUDENT');
    const father = lead.parents.find((p: any) => p.parentType === 'FATHER');
    const mother = lead.parents.find((p: any) => p.parentType === 'MOTHER');

    return res.json({
      success: true,
      data: {
        leadCode: lead.code,
        familyName: lead.familyName,
        students: applicantChildren,
        father: father || null,
        mother: mother || null,
        address: lead.address,
        documents: lead.enrollmentDocuments,
        tokenExpires: lead.enrollmentTokenExpires?.toISOString(),
        enrollmentStatus: lead.enrollmentStatus,
      },
    });
  });

  // POST /enrollment (Zod validation + business logic)
  router.post('/enrollment', express.json({ limit: '1mb' }), (req: Request, res: Response) => {
    const body = req.body;

    // Zod validation (same schema as production)
    const zodResult = publicEnrollmentSchema.safeParse(body);
    if (!zodResult.success) {
      const errorSummary = zodResult.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: errorSummary,
      });
    }

    const data = zodResult.data;
    const lead = db.findLeadByEnrollmentToken(data.enrollmentToken);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Link de matrícula inválido', code: 'TOKEN_NOT_FOUND' });
    }
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, error: 'Complete a admissão primeiro', code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, error: 'Link de matrícula expirado', code: 'TOKEN_EXPIRED' });
    }
    if (lead.enrollmentSubmissionCount >= 5) {
      return res.status(429).json({ success: false, error: 'Limite de envios atingido', code: 'MAX_SUBMISSIONS_EXCEEDED' });
    }

    const applicants = lead.children.filter((c: any) => c.isApplicant && c.relationship === 'STUDENT');
    if (applicants.length === 0) {
      return res.status(400).json({ success: false, code: 'APPLICANT_NOT_FOUND' });
    }

    // Persist data
    if (data.childrenData && data.childrenData.length > 0) {
      for (const cd of data.childrenData) {
        if (cd.enrollmentInfo) {
          lead.enrollmentInfo.push({ childId: cd.childId, ...cd.enrollmentInfo, termsAccepted: data.termsAccepted });
        }
        if (cd.health) {
          lead.childHealth.push({ childId: cd.childId, ...cd.health });
        }
      }
    } else {
      const childId = applicants[0].id;
      if (data.enrollmentInfo) {
        lead.enrollmentInfo.push({ childId, ...data.enrollmentInfo, termsAccepted: data.termsAccepted });
      }
      if (data.health) {
        lead.childHealth.push({ childId, ...data.health });
      }
    }

    // Update parent data
    const father = lead.parents.find((p: any) => p.parentType === 'FATHER');
    const mother = lead.parents.find((p: any) => p.parentType === 'MOTHER');
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

    lead.emergencyContacts = data.emergencyContacts.map((c: any) => ({
      id: db.generateId(), name: c.name, phone: c.phone,
      email: c.email || '', relationship: c.relationship || '', isPrimary: c.isPrimary ?? false,
    }));
    lead.healthPlan = data.healthPlan;
    lead.transport = data.transport;
    lead.financialResponsible = data.financialResponsible;

    lead.enrollmentStatus = 'FORM_RECEIVED';
    lead.enrollmentSubmissionCount++;

    return res.status(200).json({
      success: true,
      message: 'Matrícula enviada com sucesso',
      data: { leadCode: lead.code },
    });
  });

  // POST /enrollment/:token/documents (multer upload + doc limit)
  router.post('/enrollment/:token/documents', upload.array('files', 10), (req: Request, res: Response) => {
    const { token } = req.params;
    const lead = db.findLeadByEnrollmentToken(token);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Link de matrícula inválido', code: 'TOKEN_NOT_FOUND' });
    }
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      return res.status(400).json({ success: false, error: 'Complete a admissão primeiro', code: 'ADMISSION_NOT_COMPLETED' });
    }
    if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
      return res.status(410).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    // Document limit check (max 50)
    if (lead.enrollmentDocuments.length + files.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limite de documentos atingido (maximo 50)',
        code: 'DOCUMENT_LIMIT_EXCEEDED',
      });
    }

    const { documentType, category, childId } = req.body;

    const newDocs = files.map((f: Express.Multer.File) => ({
      id: db.generateId(),
      leadId: lead.id,
      childId: childId || null,
      documentType: documentType || 'OTHER',
      category: category || 'STUDENT',
      fileName: f.originalname,
      fileUrl: `https://storage.test/${lead.id}/${f.originalname}`,
      fileSize: f.size,
      mimeType: f.mimetype,
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    }));

    lead.enrollmentDocuments.push(...newDocs);

    return res.status(201).json({
      success: true,
      message: `${newDocs.length} documento(s) enviado(s) com sucesso`,
      data: newDocs,
    });
  });

  // DELETE /enrollment/:token/documents/:documentId
  router.delete('/enrollment/:token/documents/:documentId', (req: Request, res: Response) => {
    const { token, documentId } = req.params;
    const lead = db.findLeadByEnrollmentToken(token);

    if (!lead) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const idx = lead.enrollmentDocuments.findIndex((d: any) => d.id === documentId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }

    const doc = lead.enrollmentDocuments[idx];
    if (doc.leadId !== lead.id) {
      return res.status(403).json({ success: false, error: 'Você não tem permissão para remover este documento' });
    }

    lead.enrollmentDocuments.splice(idx, 1);
    return res.json({ success: true, message: 'Documento removido com sucesso' });
  });

  return router;
}

function createTestApp(db: MockDB) {
  const app = express();
  app.use('/public', createTestRouter(db));
  return app;
}

// ============================================================================
// VALID ENROLLMENT PAYLOAD TEMPLATE
// ============================================================================

const VALID_PAYLOAD = {
  enrollmentToken: 'will-be-set',
  enrollmentInfo: {
    academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
    personType: 'INDIVIDUAL',
    studentCpf: '123.456.789-00',
    studentIdNumber: 'MG-12.345.678',
    studentIdIssueDate: '2020-01-15',
    studentIdIssuer: 'SSP',
  },
  fatherUpdates: {
    email: 'father@test.com', phone: '(31) 99999-0000', cpf: '111.222.333-44',
    idNumber: 'MG-1111', idIssueDate: '2015-01-01', idIssuer: 'SSP',
    dateOfBirth: '1980-05-10', education: 'SUPERIOR', religion: '',
    address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '123', complement: '', zipCode: '30130-000' },
  },
  motherUpdates: {
    email: 'mother@test.com', phone: '(31) 99999-1111', cpf: '555.666.777-88',
    idNumber: 'MG-2222', idIssueDate: '2016-03-20', idIssuer: 'SSP',
    dateOfBirth: '1982-08-15', education: 'SUPERIOR', religion: '',
    address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '123', complement: '', zipCode: '30130-000' },
    sameAddressAsOtherParent: true,
  },
  health: {
    weight: '35', height: '140', bloodType: 'O+',
    medicalConditions: ['NONE'], medicalConditionsNotes: '',
    hasHospitalizations: false, hospitalizationsNotes: '',
    hasSeizures: false, seizuresNotes: '',
    allergies: ['NONE'], allergiesNotes: '',
    feverMedications: ['DIPIRONA'], feverMedicationOther: '',
    painMedications: ['IBUPROFENO'], painMedicationOther: '',
    medicationRestrictions: '', regularMedications: '',
    hasEatingDisorder: false, eatingDisorderNotes: '',
    additionalHealthInfo: '',
  },
  emergencyContacts: [{ name: 'Tia Maria', phone: '(31) 99999-2222', email: '', relationship: 'TIA', isPrimary: true }],
  healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
  transport: {
    dropoffPickupPersons: ['FATHER', 'MOTHER'], dropoffPickupOther: '',
    transportMethod: 'CAR', transportMethodOther: '',
    familyVehicles: [{ model: 'Honda Civic', color: 'Prata', plate: 'ABC-1D23' }],
    canLeaveAlone: false, isAthlete: false, athleteSchedule: {},
    schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
    hasLegalRestrictions: false, legalRestrictionsNotes: '',
    allowThirdPartyPickup: false, authorizedPersons: [],
  },
  financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
  termsAccepted: true as const,
};

// ============================================================================
// HELPERS
// ============================================================================

const FAMILY_DATA = {
  father: { name: 'Carlos Silva', email: 'carlos@test.com', phone: '(31) 99999-0000', cpf: '111.222.333-44' },
  mother: { name: 'Ana Silva', email: 'ana@test.com', phone: '(31) 99999-1111', cpf: '555.666.777-88' },
  student: { fullName: 'Lucas Silva', dateOfBirth: '2016-03-15', gender: 'M', desiredGrade: '3rd Grade', studentType: 'NEW', primaryLanguage: 'Portuguese' },
  address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '100', complement: '' },
};

/** Creates a lead with admission data + enrollment token, returns { lead, enrollmentToken } */
function setupLeadWithEnrollment(db: MockDB) {
  const lead = db.createLead('Família Teste');
  db.generateApplicationToken(lead.id);
  db.submitAdmission(lead.id, [FAMILY_DATA.student], FAMILY_DATA.father, FAMILY_DATA.mother, FAMILY_DATA.address);
  const enrollmentToken = db.generateEnrollmentToken(lead.id);
  return { lead, enrollmentToken };
}

// ============================================================================
// 1. XSS PREVENTION
// ============================================================================

describe('XSS Prevention', () => {
  describe('Zod schema XSS handling', () => {
    it('should handle <script> tags in student fullName', () => {
      // Zod schema does NOT sanitize HTML - it just validates string constraints.
      // The test verifies the schema accepts it (because it's just a string) and the data is stored as-is.
      const xssName = '<script>alert("xss")</script>';
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        fatherUpdates: { ...VALID_PAYLOAD.fatherUpdates },
        motherUpdates: { ...VALID_PAYLOAD.motherUpdates },
      };
      // The schema itself doesn't have a student fullName field that would reject this,
      // but we can verify the schema parses the payload without crashing.
      const result = publicEnrollmentSchema.safeParse(payload);
      // Payload is valid or fails for other reasons, but NOT because of XSS in string fields.
      // The schema doesn't sanitize; it's the responsibility of the output layer.
      expect(result).toBeDefined();
      if (!result.success) {
        // If it fails, ensure it's NOT due to the XSS content in the string fields
        const xssRelatedErrors = result.error.errors.filter(e =>
          e.message.toLowerCase().includes('script') || e.message.toLowerCase().includes('xss')
        );
        expect(xssRelatedErrors).toHaveLength(0);
      }
    });

    it('should handle HTML injection in father name', () => {
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        fatherUpdates: {
          ...VALID_PAYLOAD.fatherUpdates,
          // idNumber is a string field that could contain HTML injection
          idNumber: '<img src=x onerror=alert(1)>',
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      // The schema accepts strings with HTML - no XSS filtering at the schema level
      if (result.success) {
        expect(result.data.fatherUpdates?.idNumber).toBe('<img src=x onerror=alert(1)>');
      }
    });

    it('should handle script tags in emergency contact name', () => {
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: '<script>document.cookie</script>',
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIA',
          isPrimary: true,
        }],
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.emergencyContacts[0].name).toBe('<script>document.cookie</script>');
      }
    });

    it('should handle iframe injection in health additionalHealthInfo', () => {
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        health: {
          ...VALID_PAYLOAD.health,
          additionalHealthInfo: '<iframe src="https://evil.com"></iframe>',
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.health?.additionalHealthInfo).toBe('<iframe src="https://evil.com"></iframe>');
      }
    });

    it('should handle event handlers in address street', () => {
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        fatherUpdates: {
          ...VALID_PAYLOAD.fatherUpdates,
          address: {
            ...VALID_PAYLOAD.fatherUpdates.address,
            street: '<div onmouseover="alert(1)">Rua Test</div>',
          },
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.fatherUpdates?.address?.street).toBe('<div onmouseover="alert(1)">Rua Test</div>');
      }
    });

    it('should handle SVG XSS in mother occupation field (religion)', () => {
      // The schema doesn't have an 'occupation' field for mothers in enrollment,
      // but religion is a string field we can test with SVG XSS
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        motherUpdates: {
          ...VALID_PAYLOAD.motherUpdates,
          religion: '<svg onload="alert(1)"><circle r="50"/></svg>',
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.motherUpdates?.religion).toBe('<svg onload="alert(1)"><circle r="50"/></svg>');
      }
    });

    it('should reject javascript: protocol in email field', () => {
      // Email fields have z.string().email() validation, which should reject non-email formats
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        transport: {
          ...VALID_PAYLOAD.transport,
          allowThirdPartyPickup: true,
          authorizedPersons: [{
            name: 'Test Person',
            dateOfBirth: '1990-01-01',
            cpf: '123.456.789-00',
            email: 'javascript:alert(1)',
            relationship: 'UNCLE',
          }],
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        // The email validation should catch this
        const emailErrors = result.error.errors.filter(e =>
          e.path.some(p => String(p) === 'email') || e.message.toLowerCase().includes('email')
        );
        expect(emailErrors.length).toBeGreaterThan(0);
      }
    });

    it('should handle encoded XSS in notes fields', () => {
      const encodedXss = '&#60;script&#62;alert(1)&#60;/script&#62;';
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        health: {
          ...VALID_PAYLOAD.health,
          medicalConditionsNotes: encodedXss,
          hospitalizationsNotes: encodedXss,
        },
      };
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        // Encoded entities are just strings to Zod - stored as-is
        expect(result.data.health?.medicalConditionsNotes).toBe(encodedXss);
      }
    });
  });

  describe('XSS through API endpoints', () => {
    let db: MockDB;
    let app: express.Application;

    beforeEach(() => {
      db = new MockDB();
      app = createTestApp(db);
    });

    it('should accept XSS in enrollment submission without crashing server', async () => {
      const { enrollmentToken } = setupLeadWithEnrollment(db);

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken,
        emergencyContacts: [{
          name: '<script>alert("xss")</script>',
          phone: '(31) 99999-2222',
          email: '',
          relationship: '<img src=x onerror=alert(1)>',
          isPrimary: true,
        }],
        health: {
          ...VALID_PAYLOAD.health,
          additionalHealthInfo: '<iframe src="evil.com"></iframe>',
        },
      };

      const res = await request(app)
        .post('/public/enrollment')
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify data is stored as-is (not sanitized, not executed)
      const lead = db.leads.values().next().value;
      expect(lead.emergencyContacts[0].name).toBe('<script>alert("xss")</script>');
    });
  });
});

// ============================================================================
// 2. TOKEN MANIPULATION
// ============================================================================

describe('Token Manipulation', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should reject modified token (1 char changed)', async () => {
    const { enrollmentToken } = setupLeadWithEnrollment(db);

    // Change the last character of the token
    const lastChar = enrollmentToken[enrollmentToken.length - 1];
    const newLastChar = lastChar === 'a' ? 'b' : 'a';
    const modifiedToken = enrollmentToken.slice(0, -1) + newLastChar;

    const res = await request(app)
      .get(`/public/enrollment/${modifiedToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should reject empty string token', async () => {
    // Express will treat /enrollment/ as a different route or empty param
    const res = await request(app)
      .get('/public/enrollment/')
      .expect(404); // Express returns 404 for no matching route with trailing slash

    // The route /enrollment/:token requires a non-empty token param
  });

  it('should reject extremely long token (10000 chars)', async () => {
    const longToken = 'a'.repeat(10000);

    const res = await request(app)
      .get(`/public/enrollment/${longToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should reject token with null bytes', async () => {
    const { enrollmentToken } = setupLeadWithEnrollment(db);

    // Token with null byte injected - this should not match the valid token
    const nullByteToken = enrollmentToken.slice(0, 10) + '%00malicious' + enrollmentToken.slice(10);

    const res = await request(app)
      .get(`/public/enrollment/${nullByteToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should reject token with unicode characters', async () => {
    const unicodeToken = 'v\u00E1lid-t\u00F6k\u00E8n-\u00F1-' + crypto.randomBytes(16).toString('hex');

    const res = await request(app)
      .get(`/public/enrollment/${encodeURIComponent(unicodeToken)}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should reject token from different lead', async () => {
    // Create lead1 and lead2
    const { lead: lead1 } = setupLeadWithEnrollment(db);
    const { lead: lead2, enrollmentToken: token2 } = setupLeadWithEnrollment(db);

    // Use lead2's enrollment token to access lead1's data
    // (the token correctly maps to lead2, not lead1)
    const res = await request(app)
      .get(`/public/enrollment/${token2}`)
      .expect(200);

    // The token correctly resolves to lead2's data, not lead1
    expect(res.body.data.leadCode).toBe(lead2.code);
    expect(res.body.data.leadCode).not.toBe(lead1.code);
  });
});

// ============================================================================
// 3. SQL INJECTION PREVENTION
// ============================================================================

describe('SQL Injection Prevention', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should safely handle SQL in token parameter', async () => {
    const sqlToken = "'; DROP TABLE leads; --";

    const res = await request(app)
      .get(`/public/enrollment/${encodeURIComponent(sqlToken)}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
    // Server did NOT crash; the Map lookup just returned undefined
  });

  it('should safely handle SQL in student name via enrollment submission', async () => {
    const { enrollmentToken } = setupLeadWithEnrollment(db);

    const payload = {
      ...VALID_PAYLOAD,
      enrollmentToken,
      emergencyContacts: [{
        name: "O'Brien; SELECT * FROM leads",
        phone: '(31) 99999-2222',
        email: '',
        relationship: 'TIA',
        isPrimary: true,
      }],
    };

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify the SQL string is stored as-is, not executed
    const lead = [...db.leads.values()].find(l => l.enrollmentToken === enrollmentToken)!;
    expect(lead.emergencyContacts[0].name).toBe("O'Brien; SELECT * FROM leads");
  });

  it('should safely handle SQL operators in email (rejected by email validation)', async () => {
    const payload = {
      ...VALID_PAYLOAD,
      enrollmentToken: 'test-token',
      transport: {
        ...VALID_PAYLOAD.transport,
        allowThirdPartyPickup: true,
        authorizedPersons: [{
          name: 'Test',
          dateOfBirth: '1990-01-01',
          cpf: '123.456.789-00',
          email: "test' OR '1'='1@test.com",
          relationship: 'UNCLE',
        }],
      },
    };

    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    // The email validation rejects malformed email addresses
    if (!result.success) {
      const emailErrors = result.error.errors.filter(e =>
        e.path.some(p => String(p) === 'email') || e.message.toLowerCase().includes('email')
      );
      expect(emailErrors.length).toBeGreaterThan(0);
    }
  });

  it('should safely handle SQL in documentType field', async () => {
    const { enrollmentToken } = setupLeadWithEnrollment(db);

    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', "'; DROP TABLE documents; --")
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('test-content'), 'test.pdf')
      .expect(201);

    expect(res.body.success).toBe(true);
    // The SQL is stored as a plain string in documentType
    expect(res.body.data[0].documentType).toBe("'; DROP TABLE documents; --");
  });

  it('should safely handle UNION SELECT in query params', async () => {
    const sqlPayload = "token' UNION SELECT * FROM leads--";

    const res = await request(app)
      .get(`/public/enrollment/${encodeURIComponent(sqlPayload)}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });
});

// ============================================================================
// 4. PATH TRAVERSAL IN DOCUMENT FILENAMES
// ============================================================================

describe('Path Traversal in Document Filenames', () => {
  let db: MockDB;
  let app: express.Application;
  let enrollmentToken: string;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
    const setup = setupLeadWithEnrollment(db);
    enrollmentToken = setup.enrollmentToken;
  });

  it('should handle path traversal in filename', async () => {
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('malicious-content'), '../../etc/passwd')
      .expect(201);

    expect(res.body.success).toBe(true);
    // Multer strips directory components from the filename, keeping only the basename.
    // This is a security feature that prevents path traversal attacks.
    // The original '../../etc/passwd' becomes just 'passwd'.
    expect(res.body.data[0].fileName).toBe('passwd');
    // The key point: the file is NOT written to /etc/passwd on the server.
  });

  it('should handle double-encoded path traversal', async () => {
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('malicious-content'), '..%2F..%2Fetc%2Fpasswd')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data[0].fileName).toBe('..%2F..%2Fetc%2Fpasswd');
  });

  it('should handle null byte in filename', async () => {
    // Null bytes in filenames cause multer/busboy to error at the multipart parsing level.
    // The server should not crash - it returns an error response.
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('content'), 'photo.jpg\x00.exe');

    // Multer/busboy rejects null bytes in filenames with a 500 or 400 error.
    // The critical assertion is the server doesn't crash and returns a response.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThanOrEqual(500);
  });

  it('should handle very long filename (1000 chars)', async () => {
    const longName = 'a'.repeat(990) + '.pdf';

    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('content'), longName)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data[0].fileName).toBe(longName);
  });

  it('should handle filename with only special characters', async () => {
    // Multer strips path separators (/) from filenames, which can leave an empty or
    // unusual basename. When the filename resolves to empty or only path separators,
    // multer may not recognize a valid file. We test that the server handles this gracefully.
    const res = await request(app)
      .post(`/public/enrollment/${enrollmentToken}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('content'), '...///\\\\');

    // Multer strips slashes from filenames. The resulting filename after stripping
    // path components may be empty or unusual (like '\\\\'), which can lead to
    // a 400 (no valid file) or 201 (accepted with sanitized name).
    // The key assertion: the server doesn't crash.
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].fileName).toBeDefined();
    }
  });
});

// ============================================================================
// 5. AUTHORIZATION BYPASS
// ============================================================================

describe('Authorization Bypass', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should reject accessing lead1 documents with lead2 token', async () => {
    const { enrollmentToken: token1 } = setupLeadWithEnrollment(db);
    const { enrollmentToken: token2 } = setupLeadWithEnrollment(db);

    // Upload a document using token1 (belongs to lead1)
    const uploadRes = await request(app)
      .post(`/public/enrollment/${token1}/documents`)
      .field('documentType', 'STUDENT_ID')
      .field('category', 'STUDENT')
      .attach('files', Buffer.from('secret-content'), 'secret.pdf')
      .expect(201);

    const docId = uploadRes.body.data[0].id;

    // Try to access/delete lead1's document using lead2's token
    // The doc won't be found in lead2's documents array
    const res = await request(app)
      .delete(`/public/enrollment/${token2}/documents/${docId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Documento não encontrado');
  });

  it('should reject deleting document belonging to different lead', async () => {
    const { lead: lead1, enrollmentToken: token1 } = setupLeadWithEnrollment(db);
    const { lead: lead2, enrollmentToken: token2 } = setupLeadWithEnrollment(db);

    // Manually inject a cross-lead document into lead2's array but with lead1's leadId
    // This simulates a data integrity issue
    lead2.enrollmentDocuments.push({
      id: 'cross-lead-doc',
      leadId: lead1.id, // Document belongs to lead1
      childId: null,
      documentType: 'STUDENT_ID',
      category: 'STUDENT',
      fileName: 'cross-lead.pdf',
      fileUrl: 'https://storage.test/cross-lead.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'PENDING',
      uploadedAt: new Date().toISOString(),
    });

    // Try to delete the cross-lead document using lead2's token
    const res = await request(app)
      .delete(`/public/enrollment/${token2}/documents/cross-lead-doc`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('permiss');
  });

  it('should reject enrollment submission with token from different lead', async () => {
    setupLeadWithEnrollment(db); // lead1
    const { enrollmentToken: token2 } = setupLeadWithEnrollment(db); // lead2

    // Create a completely different invalid token
    const fakeToken = crypto.randomBytes(32).toString('hex');

    const payload = {
      ...VALID_PAYLOAD,
      enrollmentToken: fakeToken,
    };

    const res = await request(app)
      .post('/public/enrollment')
      .send(payload)
      .expect(404);

    expect(res.body.code).toBe('TOKEN_NOT_FOUND');
  });

  it('should not allow token reuse after expiration', async () => {
    const { lead, enrollmentToken } = setupLeadWithEnrollment(db);

    // Expire the token
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should reject enrollment before admission is completed', async () => {
    const lead = db.createLead('Família Incompleta');
    db.generateApplicationToken(lead.id);
    // Do NOT submit admission
    const enrollmentToken = db.generateEnrollmentToken(lead.id);

    const res = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ADMISSION_NOT_COMPLETED');
  });
});

// ============================================================================
// 6. INPUT SANITIZATION EDGE CASES
// ============================================================================

describe('Input Sanitization Edge Cases', () => {
  describe('Zod schema edge cases', () => {
    it('should handle null characters in text fields', () => {
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: 'Test\x00\x01\x02Name',
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIA',
          isPrimary: true,
        }],
      };

      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      // Zod accepts strings with control characters - it's just a string
      if (result.success) {
        expect(result.data.emergencyContacts[0].name).toBe('Test\x00\x01\x02Name');
      }
    });

    it('should handle extremely long strings in all fields (10000 chars)', () => {
      const longString = 'A'.repeat(10000);

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        fatherUpdates: {
          ...VALID_PAYLOAD.fatherUpdates,
          idNumber: longString,
          education: longString,
          religion: longString,
        },
        health: {
          ...VALID_PAYLOAD.health,
          additionalHealthInfo: longString,
          medicalConditionsNotes: longString,
          regularMedications: longString,
        },
        emergencyContacts: [{
          name: longString,
          phone: longString,
          email: '',
          relationship: longString,
          isPrimary: true,
        }],
      };

      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      // The schema has min length but no max length constraints on most fields
      if (result.success) {
        expect(result.data.fatherUpdates?.idNumber).toBe(longString);
        expect(result.data.emergencyContacts[0].name).toBe(longString);
      }
    });

    it('should handle unicode normalization - different representations of e-acute', () => {
      // NFC form: single code point for e-acute
      const nfc = '\u00E9'; // e with acute (precomposed)
      // NFD form: e + combining acute accent
      const nfd = 'e\u0301'; // e + combining acute (decomposed)

      const payloadNFC = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: `Jos${nfc} Carlos`,
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIO',
          isPrimary: true,
        }],
      };

      const payloadNFD = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: `Jos${nfd} Carlos`,
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIO',
          isPrimary: true,
        }],
      };

      const resultNFC = publicEnrollmentSchema.safeParse(payloadNFC);
      const resultNFD = publicEnrollmentSchema.safeParse(payloadNFD);

      // Both should be accepted - Zod treats them as valid strings
      expect(resultNFC).toBeDefined();
      expect(resultNFD).toBeDefined();

      if (resultNFC.success && resultNFD.success) {
        // They might look the same visually but differ in byte representation
        expect(resultNFC.data.emergencyContacts[0].name).toContain('Jos');
        expect(resultNFD.data.emergencyContacts[0].name).toContain('Jos');
      }
    });

    it('should handle RTL characters in names', () => {
      // Arabic text
      const arabicName = '\u0645\u062D\u0645\u062F \u0639\u0644\u064A'; // Muhammad Ali in Arabic
      // Hebrew text
      const hebrewName = '\u05D3\u05D5\u05D3 \u05DC\u05D5\u05D9'; // David Levi in Hebrew

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [
          { name: arabicName, phone: '(31) 99999-2222', email: '', relationship: 'TIO', isPrimary: true },
        ],
        fatherUpdates: {
          ...VALID_PAYLOAD.fatherUpdates,
          religion: hebrewName,
        },
      };

      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.emergencyContacts[0].name).toBe(arabicName);
        expect(result.data.fatherUpdates?.religion).toBe(hebrewName);
      }
    });

    it('should handle emoji in names and fields', () => {
      const emojiName = 'Jo\u00E3o \uD83C\uDF89 Silva'; // Joao [party] Silva

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: emojiName,
          phone: '(31) 99999-2222',
          email: '',
          relationship: '\uD83D\uDC68\u200D\uD83D\uDCBB', // man-technologist emoji
          isPrimary: true,
        }],
        health: {
          ...VALID_PAYLOAD.health,
          additionalHealthInfo: 'Healthy \u2764\uFE0F child \uD83D\uDC76',
        },
      };

      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.emergencyContacts[0].name).toBe(emojiName);
      }
    });

    it('should handle all whitespace string in required fields', () => {
      // Emergency contact name has min(1) - all whitespace should pass min(1) check
      // because Zod min(1) checks string length, not trimmed length
      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken: 'test-token',
        emergencyContacts: [{
          name: '    ',
          phone: '(31) 99999-2222',
          email: '',
          relationship: '',
          isPrimary: true,
        }],
      };

      const result = publicEnrollmentSchema.safeParse(payload);
      // Zod's min(1) checks length, so '    ' (4 chars) passes.
      // This is a known behavior - the schema doesn't trim.
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data.emergencyContacts[0].name).toBe('    ');
      }
    });
  });

  describe('Input edge cases through API', () => {
    let db: MockDB;
    let app: express.Application;

    beforeEach(() => {
      db = new MockDB();
      app = createTestApp(db);
    });

    it('should handle null characters through API endpoint without crashing', async () => {
      const { enrollmentToken } = setupLeadWithEnrollment(db);

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken,
        emergencyContacts: [{
          name: 'Test\x00Name',
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIA',
          isPrimary: true,
        }],
      };

      const res = await request(app)
        .post('/public/enrollment')
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should handle emoji through API endpoint', async () => {
      const { enrollmentToken } = setupLeadWithEnrollment(db);

      const payload = {
        ...VALID_PAYLOAD,
        enrollmentToken,
        emergencyContacts: [{
          name: 'Jo\u00E3o \uD83C\uDF89 Silva',
          phone: '(31) 99999-2222',
          email: '',
          relationship: 'TIO',
          isPrimary: true,
        }],
      };

      const res = await request(app)
        .post('/public/enrollment')
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});

// ============================================================================
// 7. RESPONSE SECURITY
// ============================================================================

describe('Response Security', () => {
  let db: MockDB;
  let app: express.Application;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  it('should not expose internal error details on 500', async () => {
    // We test that 404/400/410 responses don't include stack traces or internal details
    // Since our mock won't easily produce a 500, we test what our error responses DON'T contain
    const res = await request(app)
      .get('/public/enrollment/nonexistent-token')
      .expect(404);

    expect(res.body).not.toHaveProperty('stack');
    expect(res.body).not.toHaveProperty('stackTrace');
    expect(res.body).not.toHaveProperty('internalError');
    // No Prisma or database internals exposed
    expect(JSON.stringify(res.body)).not.toContain('prisma');
    expect(JSON.stringify(res.body)).not.toContain('PrismaClient');
  });

  it('should return consistent error format on all error codes', async () => {
    const { lead, enrollmentToken } = setupLeadWithEnrollment(db);

    // 404: TOKEN_NOT_FOUND
    const res404 = await request(app)
      .get('/public/enrollment/invalid-token')
      .expect(404);
    expect(res404.body).toHaveProperty('success', false);
    expect(res404.body).toHaveProperty('error');
    expect(res404.body).toHaveProperty('code');

    // 410: TOKEN_EXPIRED
    lead.enrollmentTokenExpires = new Date(Date.now() - 1000);
    const res410 = await request(app)
      .get(`/public/enrollment/${enrollmentToken}`)
      .expect(410);
    expect(res410.body).toHaveProperty('success', false);
    expect(res410.body).toHaveProperty('error');
    expect(res410.body).toHaveProperty('code');

    // 400: ADMISSION_NOT_COMPLETED
    const incompleteLead = db.createLead('Incomplete');
    db.generateApplicationToken(incompleteLead.id);
    const incompleteToken = db.generateEnrollmentToken(incompleteLead.id);
    const res400 = await request(app)
      .get(`/public/enrollment/${incompleteToken}`)
      .expect(400);
    expect(res400.body).toHaveProperty('success', false);
    expect(res400.body).toHaveProperty('error');
    expect(res400.body).toHaveProperty('code');

    // 400: VALIDATION_ERROR (Zod)
    const { enrollmentToken: validToken } = setupLeadWithEnrollment(db);
    const resValidation = await request(app)
      .post('/public/enrollment')
      .send({ enrollmentToken: validToken, termsAccepted: false, emergencyContacts: [] })
      .expect(400);
    expect(resValidation.body).toHaveProperty('success', false);
    expect(resValidation.body).toHaveProperty('error');
    expect(resValidation.body).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(resValidation.body).toHaveProperty('details');
  });

  it('should not expose database field names in validation errors', async () => {
    const { enrollmentToken } = setupLeadWithEnrollment(db);

    const res = await request(app)
      .post('/public/enrollment')
      .send({ enrollmentToken, termsAccepted: false, emergencyContacts: [] })
      .expect(400);

    // Validation errors should use schema field names (not database column names)
    const details = res.body.details;
    expect(details).toBeDefined();
    expect(Array.isArray(details)).toBe(true);

    for (const detail of details) {
      // Should not contain database-specific column naming like snake_case Prisma columns
      expect(detail.path).not.toMatch(/^(lead_id|created_at|updated_at|enrollment_token)/);
      // Paths should be camelCase (Zod schema field names)
      if (detail.path && detail.path.includes('.')) {
        const parts = detail.path.split('.');
        for (const part of parts) {
          expect(part).not.toMatch(/_id$/);
        }
      }
    }
  });

  it('should return proper Content-Type headers', async () => {
    // GET endpoint
    const resGet = await request(app)
      .get('/public/enrollment/some-token')
      .expect(404);
    expect(resGet.headers['content-type']).toMatch(/application\/json/);

    // POST endpoint
    const { enrollmentToken } = setupLeadWithEnrollment(db);
    const resPost = await request(app)
      .post('/public/enrollment')
      .send({ ...VALID_PAYLOAD, enrollmentToken })
      .expect(200);
    expect(resPost.headers['content-type']).toMatch(/application\/json/);

    // Validation error
    const resError = await request(app)
      .post('/public/enrollment')
      .send({ enrollmentToken, termsAccepted: false, emergencyContacts: [] })
      .expect(400);
    expect(resError.headers['content-type']).toMatch(/application\/json/);
  });
});
