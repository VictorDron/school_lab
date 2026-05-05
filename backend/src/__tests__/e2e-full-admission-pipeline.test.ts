/**
 * E2E Full Admission Pipeline Tests
 *
 * Comprehensive tests for the FULL admission pipeline via HTTP requests:
 *   1.  Gate approval config
 *   2.  Lead creation with initial state
 *   3.  Pipeline status endpoint
 *   4.  Lead approvals (initially empty)
 *   5.  Gate transition / approval submission
 *   6.  Contract CRUD (create, list, approvals)
 *   7.  Financial analysis (create, update, approve)
 *   8.  Escalations (create, list, resolve)
 *   9.  Contract legal/financial approval
 *   10. Contract cancellation
 *   11. Validation tests (400 errors)
 *   12. Authorization tests (401/403 errors)
 *
 * Uses a mock in-memory database that simulates Prisma behavior,
 * self-contained Express app, and supertest for HTTP assertions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// TYPES (mirrors Prisma enums)
// ============================================================================

type AdmissionGateStatus =
  | 'NOT_STARTED' | 'FORM_RECEIVED' | 'FORM_APPROVED'
  | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED' | 'INTERVIEW_COMPLETED'
  | 'VISIT_APPROVED' | 'DOCS_REQUESTED' | 'DOCS_RECEIVED'
  | 'VIVENCIA_SCHEDULED' | 'VIVENCIA_COMPLETED'
  | 'EVALUATION_PENDING' | 'EVALUATION_COMPLETED'
  | 'APPROVED' | 'ENROLLMENT_PENDING' | 'ENROLLMENT_COMPLETED'
  | 'CONTRACT_PENDING' | 'CONTRACT_SIGNED' | 'FINANCIAL_APPROVED'
  | 'ENROLLED' | 'REJECTED';

type AdmissionDepartment =
  | 'ADMISSIONS' | 'PSYCHOLOGY' | 'HEALTH' | 'SECRETARIAT'
  | 'COORDINATION' | 'FINANCE' | 'LEGAL' | 'DIRECTOR';

type GateApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | 'ESCALATED';

type ContractSignerRole = 'PARENT' | 'GUARDIAN' | 'SCHOOL_REPRESENTATIVE' | 'WITNESS';

type ContractStatus = 'DRAFT' | 'PENDING_LEGAL' | 'PENDING_FINANCIAL' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'CANCELLED';

type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type FinancialAnalysisStatus = 'PENDING' | 'IN_ANALYSIS' | 'APPROVED' | 'REJECTED';

type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'DIRECTOR' | 'LEGAL' | 'FINANCE';

// ============================================================================
// MOCK IN-MEMORY DATABASE
// ============================================================================

interface MockGateStepConfig {
  id: string;
  gateStep: AdmissionGateStatus;
  department: AdmissionDepartment;
  isRequired: boolean;
  approvalOrder: number;
  allowedRoles: UserRole[];
  description: string | null;
}

interface MockGateApproval {
  id: string;
  leadId: string;
  gateStep: AdmissionGateStatus;
  department: AdmissionDepartment;
  decision: GateApprovalDecision;
  decidedById: string | null;
  notes: string | null;
  isRequired: boolean;
  decidedAt: Date | null;
  createdAt: Date;
}

interface MockContractSigner {
  id: string;
  contractId: string;
  role: ContractSignerRole;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
}

interface MockContractPayment {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: string;
}

interface MockContract {
  id: string;
  leadId: string;
  code: string;
  status: ContractStatus;
  totalAnnualValue: number;
  installments: number;
  discountPercent: number | null;
  enrollmentFee: number | null;
  templateVersion: string | null;
  signers: MockContractSigner[];
  payments: MockContractPayment[];
  legalApprovalStatus: GateApprovalDecision | null;
  legalApprovedById: string | null;
  legalApprovedAt: Date | null;
  legalNotes: string | null;
  financialApprovalStatus: GateApprovalDecision | null;
  financialApprovedById: string | null;
  financialApprovedAt: Date | null;
  financialNotes: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
}

interface MockFinancialAnalysis {
  id: string;
  leadId: string;
  cpfAnalyzed: string | null;
  cpfStatus: string | null;
  analysisNotes: string | null;
  negotiationNotes: string | null;
  status: FinancialAnalysisStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface MockEscalation {
  id: string;
  leadId: string;
  childId: string | null;
  raisedById: string;
  department: AdmissionDepartment;
  gateStep: AdmissionGateStatus;
  description: string;
  severity: EscalationSeverity;
  isResolved: boolean;
  resolvedById: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
}

interface MockLead {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  admissionGateStatus: AdmissionGateStatus;
  applicationStatus: string;
  createdAt: Date;
}

interface MockUser {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: UserRole;
  status: string;
}

// ============================================================================
// IN-MEMORY DB STORE
// ============================================================================

class MockDB {
  leads = new Map<string, MockLead>();
  gateConfigs: MockGateStepConfig[] = [];
  gateApprovals = new Map<string, MockGateApproval>();
  contracts = new Map<string, MockContract>();
  financialAnalyses = new Map<string, MockFinancialAnalysis>();
  escalations = new Map<string, MockEscalation>();
  users = new Map<string, MockUser>();
  private idCounter = 0;

  generateId() {
    return `mock-${++this.idCounter}-${crypto.randomBytes(4).toString('hex')}`;
  }

  constructor() {
    // Seed default gate step configs
    this.gateConfigs = [
      { id: this.generateId(), gateStep: 'FORM_RECEIVED', department: 'ADMISSIONS', isRequired: true, approvalOrder: 1, allowedRoles: ['ADMIN', 'MANAGER'], description: 'Admissions review' },
      { id: this.generateId(), gateStep: 'FORM_RECEIVED', department: 'SECRETARIAT', isRequired: true, approvalOrder: 2, allowedRoles: ['ADMIN', 'MANAGER'], description: 'Secretariat review' },
      { id: this.generateId(), gateStep: 'VISIT_COMPLETED', department: 'ADMISSIONS', isRequired: true, approvalOrder: 1, allowedRoles: ['ADMIN', 'MANAGER'], description: 'Post-visit review' },
      { id: this.generateId(), gateStep: 'VISIT_COMPLETED', department: 'PSYCHOLOGY', isRequired: true, approvalOrder: 2, allowedRoles: ['ADMIN', 'MANAGER'], description: 'Psychology clearance' },
      { id: this.generateId(), gateStep: 'EVALUATION_COMPLETED', department: 'COORDINATION', isRequired: true, approvalOrder: 1, allowedRoles: ['ADMIN', 'MANAGER', 'DIRECTOR'], description: 'Coordination approval' },
      { id: this.generateId(), gateStep: 'APPROVED', department: 'DIRECTOR', isRequired: true, approvalOrder: 1, allowedRoles: ['ADMIN', 'DIRECTOR'], description: 'Director final approval' },
    ];

    // Seed default users
    const adminUser: MockUser = {
      id: 'user-admin-001',
      email: 'admin@school-lab.com',
      displayName: 'Admin User',
      fullName: 'Admin User Full',
      role: 'ADMIN',
      status: 'ACTIVE',
    };
    this.users.set(adminUser.id, adminUser);

    const staffUser: MockUser = {
      id: 'user-staff-001',
      email: 'staff@school-lab.com',
      displayName: 'Staff User',
      fullName: 'Staff User Full',
      role: 'STAFF',
      status: 'ACTIVE',
    };
    this.users.set(staffUser.id, staffUser);

    const directorUser: MockUser = {
      id: 'user-director-001',
      email: 'director@school-lab.com',
      displayName: 'Director User',
      fullName: 'Director User Full',
      role: 'DIRECTOR',
      status: 'ACTIVE',
    };
    this.users.set(directorUser.id, directorUser);

    const financeUser: MockUser = {
      id: 'user-finance-001',
      email: 'finance@school-lab.com',
      displayName: 'Finance User',
      fullName: 'Finance User Full',
      role: 'FINANCE',
      status: 'ACTIVE',
    };
    this.users.set(financeUser.id, financeUser);

    const legalUser: MockUser = {
      id: 'user-legal-001',
      email: 'legal@school-lab.com',
      displayName: 'Legal User',
      fullName: 'Legal User Full',
      role: 'LEGAL',
      status: 'ACTIVE',
    };
    this.users.set(legalUser.id, legalUser);
  }

  createLead(familyName: string, contactName: string, contactEmail: string): MockLead {
    const id = this.generateId();
    const code = `RIS-${String(this.idCounter).padStart(4, '0')}`;
    const lead: MockLead = {
      id,
      code,
      familyName,
      primaryContactName: contactName,
      primaryContactEmail: contactEmail,
      admissionGateStatus: 'NOT_STARTED',
      applicationStatus: 'PENDING',
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  findLeadById(id: string): MockLead | undefined {
    return this.leads.get(id);
  }
}

// ============================================================================
// PHASE DEFINITIONS (mirrors gate-approval.service.ts)
// ============================================================================

interface PhaseDefinition {
  name: string;
  steps: AdmissionGateStatus[];
}

const PHASES: PhaseDefinition[] = [
  { name: 'Contato', steps: ['NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED'] },
  { name: 'Pre Matricula', steps: ['VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED'] },
  { name: 'Vivencia', steps: ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED'] },
  { name: 'Matricula', steps: ['APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'] },
  { name: 'Contrato', steps: ['CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED'] },
];

const VALID_GATE_STEPS: AdmissionGateStatus[] = PHASES.flatMap(p => p.steps);

// ============================================================================
// AUTH MIDDLEWARE (mock JWT validation)
// ============================================================================

const MOCK_TOKENS: Record<string, { userId: string; role: UserRole }> = {
  'token-admin': { userId: 'user-admin-001', role: 'ADMIN' },
  'token-staff': { userId: 'user-staff-001', role: 'STAFF' },
  'token-director': { userId: 'user-director-001', role: 'DIRECTOR' },
  'token-finance': { userId: 'user-finance-001', role: 'FINANCE' },
  'token-legal': { userId: 'user-legal-001', role: 'LEGAL' },
};

function createMockAuthMiddleware(db: MockDB) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token de acesso nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const tokenData = MOCK_TOKENS[token];
    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Token invalido' });
    }

    const user = db.users.get(tokenData.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuario nao encontrado' });
    }

    (req as any).user = user;
    next();
  };
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Nao autenticado' });
    }
    if (user.role === 'ADMIN') return next(); // admin always passes
    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Acesso negado - permissao insuficiente' });
    }
    next();
  };
}

// ============================================================================
// ROUTER FACTORY
// ============================================================================

function createPipelineRouter(db: MockDB) {
  const router = Router();
  const auth = createMockAuthMiddleware(db);

  // ---- LEADS ----
  const leadsRouter = Router();
  leadsRouter.use(auth);

  leadsRouter.post('/', (req: Request, res: Response) => {
    const { familyName, primaryContactName, primaryContactEmail, numberOfChildren, source } = req.body;
    if (!familyName || familyName.length < 2) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['familyName'], message: 'Required' }] });
    }
    if (!primaryContactName || primaryContactName.length < 2) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['primaryContactName'], message: 'Required' }] });
    }
    if (!primaryContactEmail || !primaryContactEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['primaryContactEmail'], message: 'Invalid email' }] });
    }

    const lead = db.createLead(familyName, primaryContactName, primaryContactEmail);
    res.status(201).json({ success: true, data: lead });
  });

  leadsRouter.get('/:id', (req: Request, res: Response) => {
    const lead = db.findLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }
    res.json({ success: true, data: lead });
  });

  // ---- GATE APPROVALS ----
  const gateRouter = Router();
  gateRouter.use(auth);

  // GET /config
  gateRouter.get('/config', (_req: Request, res: Response) => {
    res.json({ success: true, data: db.gateConfigs });
  });

  // GET /:leadId/pipeline
  gateRouter.get('/:leadId/pipeline', (req: Request, res: Response) => {
    const lead = db.findLeadById(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const currentStepIndex = VALID_GATE_STEPS.indexOf(lead.admissionGateStatus);
    const approvalsByStep: Record<string, MockGateApproval[]> = {};
    for (const a of db.gateApprovals.values()) {
      if (a.leadId === lead.id) {
        if (!approvalsByStep[a.gateStep]) approvalsByStep[a.gateStep] = [];
        approvalsByStep[a.gateStep].push(a);
      }
    }

    const phases = PHASES.map(phase => {
      const stepsCompleted = phase.steps.filter(step => {
        const stepIndex = VALID_GATE_STEPS.indexOf(step);
        return stepIndex < currentStepIndex;
      }).length;
      const isCurrent = phase.steps.includes(lead.admissionGateStatus);
      const percentage = phase.steps.length > 0
        ? Math.round((stepsCompleted / phase.steps.length) * 100)
        : 0;

      return {
        name: phase.name,
        steps: phase.steps,
        stepsCompleted,
        totalSteps: phase.steps.length,
        percentage,
        isCurrent,
        approvals: phase.steps.reduce((acc, step) => {
          if (approvalsByStep[step]) acc[step] = approvalsByStep[step];
          return acc;
        }, {} as Record<string, MockGateApproval[]>),
      };
    });

    res.json({
      success: true,
      data: {
        leadId: lead.id,
        familyName: lead.familyName,
        currentStatus: lead.admissionGateStatus,
        phases,
      },
    });
  });

  // GET /:leadId (all approvals)
  gateRouter.get('/:leadId', (req: Request, res: Response) => {
    const lead = db.findLeadById(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const matrix: Record<string, MockGateApproval[]> = {};
    for (const a of db.gateApprovals.values()) {
      if (a.leadId === lead.id) {
        if (!matrix[a.gateStep]) matrix[a.gateStep] = [];
        matrix[a.gateStep].push(a);
      }
    }

    res.json({ success: true, data: matrix });
  });

  // GET /:leadId/:gateStep
  gateRouter.get('/:leadId/:gateStep', (req: Request, res: Response) => {
    const { leadId, gateStep } = req.params;
    if (!VALID_GATE_STEPS.includes(gateStep as AdmissionGateStatus) && gateStep !== 'REJECTED') {
      return res.status(400).json({ success: false, error: 'Etapa invalida' });
    }

    const lead = db.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const approvals: MockGateApproval[] = [];
    for (const a of db.gateApprovals.values()) {
      if (a.leadId === leadId && a.gateStep === gateStep) {
        approvals.push(a);
      }
    }

    res.json({ success: true, data: approvals });
  });

  // POST /:leadId/:gateStep (submit departmental approval)
  gateRouter.post('/:leadId/:gateStep', (req: Request, res: Response) => {
    const { leadId, gateStep } = req.params;
    const { department, decision, notes } = req.body;

    // Validate gateStep
    if (!VALID_GATE_STEPS.includes(gateStep as AdmissionGateStatus) && gateStep !== 'REJECTED') {
      return res.status(400).json({ success: false, error: 'Etapa invalida', details: [{ path: ['gateStep'], message: 'Invalid gate step' }] });
    }

    // Validate department
    const validDepts: AdmissionDepartment[] = ['ADMISSIONS', 'PSYCHOLOGY', 'HEALTH', 'SECRETARIAT', 'COORDINATION', 'FINANCE', 'LEGAL', 'DIRECTOR'];
    if (!department || !validDepts.includes(department)) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['department'], message: 'Invalid department' }] });
    }

    // Validate decision
    const validDecisions: GateApprovalDecision[] = ['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL', 'ESCALATED'];
    if (!decision || !validDecisions.includes(decision)) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['decision'], message: 'Invalid decision' }] });
    }

    const lead = db.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    // Find or create approval record
    let existing: MockGateApproval | undefined;
    for (const a of db.gateApprovals.values()) {
      if (a.leadId === leadId && a.gateStep === gateStep && a.department === department) {
        existing = a;
        break;
      }
    }

    const user = (req as any).user;

    if (existing) {
      existing.decision = decision;
      existing.decidedById = user.id;
      existing.notes = notes ?? null;
      existing.decidedAt = new Date();
      res.json({ success: true, data: existing });
    } else {
      const approval: MockGateApproval = {
        id: db.generateId(),
        leadId,
        gateStep: gateStep as AdmissionGateStatus,
        department: department as AdmissionDepartment,
        decision,
        decidedById: user.id,
        notes: notes ?? null,
        isRequired: true,
        decidedAt: new Date(),
        createdAt: new Date(),
      };
      db.gateApprovals.set(approval.id, approval);
      res.json({ success: true, data: approval });
    }
  });

  // ---- CONTRACTS ----
  const contractsRouter = Router();
  contractsRouter.use(auth);

  // GET /lead/:leadId
  contractsRouter.get('/lead/:leadId', (req: Request, res: Response) => {
    const contracts: MockContract[] = [];
    for (const c of db.contracts.values()) {
      if (c.leadId === req.params.leadId) contracts.push(c);
    }
    res.json({ success: true, data: contracts });
  });

  // POST / (create contract)
  contractsRouter.post('/', (req: Request, res: Response) => {
    const { leadId, totalAnnualValue, installments, discountPercent, enrollmentFee, templateVersion, signers } = req.body;

    // Validation
    if (!leadId || typeof leadId !== 'string') {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['leadId'], message: 'Required' }] });
    }
    if (typeof totalAnnualValue !== 'number') {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['totalAnnualValue'], message: 'Expected number' }] });
    }
    if (!Number.isInteger(installments) || installments < 1 || installments > 12) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['installments'], message: 'Must be integer 1-12' }] });
    }
    if (!Array.isArray(signers) || signers.length === 0) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['signers'], message: 'At least one signer required' }] });
    }

    // Validate signers
    for (const s of signers) {
      if (!s.role || !s.name || !s.email) {
        return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['signers'], message: 'Each signer must have role, name, email' }] });
      }
    }

    const lead = db.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const now = new Date();
    const contractCode = `CTR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const discountPct = discountPercent ?? 0;
    const discountedValue = totalAnnualValue * (1 - discountPct / 100);
    const installmentAmount = installments > 0 ? Math.round((discountedValue / installments) * 100) / 100 : 0;

    const contractSigners: MockContractSigner[] = signers.map((s: any) => ({
      id: db.generateId(),
      contractId: '', // will be set below
      role: s.role,
      name: s.name,
      email: s.email,
      cpf: s.cpf ?? null,
      phone: s.phone ?? null,
    }));

    const payments: MockContractPayment[] = [];
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      payments.push({
        id: db.generateId(),
        contractId: '',
        installmentNumber: i + 1,
        dueDate,
        amount: installmentAmount,
        status: 'PENDING',
      });
    }

    const contract: MockContract = {
      id: db.generateId(),
      leadId,
      code: contractCode,
      status: 'DRAFT',
      totalAnnualValue,
      installments,
      discountPercent: discountPercent ?? null,
      enrollmentFee: enrollmentFee ?? null,
      templateVersion: templateVersion ?? null,
      signers: contractSigners,
      payments,
      legalApprovalStatus: null,
      legalApprovedById: null,
      legalApprovedAt: null,
      legalNotes: null,
      financialApprovalStatus: null,
      financialApprovedById: null,
      financialApprovedAt: null,
      financialNotes: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: now,
    };

    // Set contractId on signers and payments
    for (const s of contractSigners) s.contractId = contract.id;
    for (const p of payments) p.contractId = contract.id;

    db.contracts.set(contract.id, contract);
    res.status(201).json({ success: true, data: contract });
  });

  // PATCH /:id/legal (legal approval)
  contractsRouter.patch('/:id/legal', requireRole('LEGAL', 'ADMIN'), (req: Request, res: Response) => {
    const contract = db.contracts.get(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato nao encontrado' });
    }

    const { decision, notes } = req.body;
    const validDecisions: GateApprovalDecision[] = ['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL', 'ESCALATED'];
    if (!decision || !validDecisions.includes(decision)) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['decision'], message: 'Invalid decision' }] });
    }

    const user = (req as any).user;
    contract.legalApprovalStatus = decision;
    contract.legalApprovedById = user.id;
    contract.legalApprovedAt = new Date();
    contract.legalNotes = notes ?? null;

    res.json({ success: true, data: contract });
  });

  // PATCH /:id/financial (financial approval)
  contractsRouter.patch('/:id/financial', requireRole('FINANCE', 'ADMIN'), (req: Request, res: Response) => {
    const contract = db.contracts.get(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato nao encontrado' });
    }

    const { decision, notes } = req.body;
    const validDecisions: GateApprovalDecision[] = ['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL', 'ESCALATED'];
    if (!decision || !validDecisions.includes(decision)) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['decision'], message: 'Invalid decision' }] });
    }

    const user = (req as any).user;
    contract.financialApprovalStatus = decision;
    contract.financialApprovedById = user.id;
    contract.financialApprovedAt = new Date();
    contract.financialNotes = notes ?? null;

    res.json({ success: true, data: contract });
  });

  // POST /:id/cancel
  contractsRouter.post('/:id/cancel', (req: Request, res: Response) => {
    const contract = db.contracts.get(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato nao encontrado' });
    }

    contract.status = 'CANCELLED';
    contract.cancelledAt = new Date();
    contract.cancellationReason = req.body.reason ?? null;

    res.json({ success: true, data: contract });
  });

  // ---- FINANCIAL ----
  const financialRouter = Router();
  financialRouter.use(auth);

  // POST /analysis
  financialRouter.post('/analysis', (req: Request, res: Response) => {
    const { leadId, cpfAnalyzed, analysisNotes } = req.body;

    if (!leadId || typeof leadId !== 'string') {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['leadId'], message: 'Required' }] });
    }

    const lead = db.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const now = new Date();
    const analysis: MockFinancialAnalysis = {
      id: db.generateId(),
      leadId,
      cpfAnalyzed: cpfAnalyzed ?? null,
      cpfStatus: null,
      analysisNotes: analysisNotes ?? null,
      negotiationNotes: null,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    db.financialAnalyses.set(analysis.id, analysis);
    res.status(201).json({ success: true, data: analysis });
  });

  // PATCH /analysis/:id
  financialRouter.patch('/analysis/:id', (req: Request, res: Response) => {
    const analysis = db.financialAnalyses.get(req.params.id);
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analise financeira nao encontrada' });
    }

    const { cpfAnalyzed, cpfStatus, analysisNotes, negotiationNotes } = req.body;
    if (cpfAnalyzed !== undefined) analysis.cpfAnalyzed = cpfAnalyzed;
    if (cpfStatus !== undefined) analysis.cpfStatus = cpfStatus;
    if (analysisNotes !== undefined) analysis.analysisNotes = analysisNotes;
    if (negotiationNotes !== undefined) analysis.negotiationNotes = negotiationNotes;
    analysis.updatedAt = new Date();

    res.json({ success: true, data: analysis });
  });

  // PATCH /analysis/:id/approve
  financialRouter.patch('/analysis/:id/approve', requireRole('FINANCE', 'ADMIN'), (req: Request, res: Response) => {
    const analysis = db.financialAnalyses.get(req.params.id);
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analise financeira nao encontrada' });
    }

    const { status } = req.body;
    const validStatuses: FinancialAnalysisStatus[] = ['PENDING', 'IN_ANALYSIS', 'APPROVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['status'], message: 'Invalid status' }] });
    }

    analysis.status = status;
    analysis.updatedAt = new Date();

    res.json({ success: true, data: analysis });
  });

  // ---- ESCALATIONS ----
  const escalationsRouter = Router();
  escalationsRouter.use(auth);

  // GET / (active escalations)
  escalationsRouter.get('/', (_req: Request, res: Response) => {
    const active: MockEscalation[] = [];
    for (const e of db.escalations.values()) {
      if (!e.isResolved) active.push(e);
    }
    res.json({ success: true, data: active });
  });

  // GET /lead/:leadId
  escalationsRouter.get('/lead/:leadId', (req: Request, res: Response) => {
    const leadEscalations: MockEscalation[] = [];
    for (const e of db.escalations.values()) {
      if (e.leadId === req.params.leadId) leadEscalations.push(e);
    }
    res.json({ success: true, data: leadEscalations });
  });

  // POST / (create escalation)
  escalationsRouter.post('/', (req: Request, res: Response) => {
    const { leadId, childId, department, gateStep, description, severity } = req.body;

    // Validation
    if (!leadId || typeof leadId !== 'string') {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['leadId'], message: 'Required' }] });
    }
    if (!department) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['department'], message: 'Required' }] });
    }
    if (!gateStep) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['gateStep'], message: 'Required' }] });
    }
    if (!description || description.length < 5) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['description'], message: 'Min 5 characters' }] });
    }

    const lead = db.findLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead nao encontrado' });
    }

    const user = (req as any).user;
    const escalation: MockEscalation = {
      id: db.generateId(),
      leadId,
      childId: childId ?? null,
      raisedById: user.id,
      department,
      gateStep,
      description,
      severity: severity ?? 'MEDIUM',
      isResolved: false,
      resolvedById: null,
      resolvedAt: null,
      resolutionNotes: null,
      createdAt: new Date(),
    };

    db.escalations.set(escalation.id, escalation);
    res.status(201).json({ success: true, data: escalation });
  });

  // PATCH /:id/resolve (requires DIRECTOR or ADMIN)
  escalationsRouter.patch('/:id/resolve', requireRole('DIRECTOR', 'ADMIN'), (req: Request, res: Response) => {
    const escalation = db.escalations.get(req.params.id);
    if (!escalation) {
      return res.status(404).json({ success: false, error: 'Escalacao nao encontrada' });
    }

    const { notes } = req.body;
    if (!notes || notes.length < 3) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: [{ path: ['notes'], message: 'Min 3 characters' }] });
    }

    const user = (req as any).user;
    escalation.isResolved = true;
    escalation.resolvedById = user.id;
    escalation.resolvedAt = new Date();
    escalation.resolutionNotes = notes;

    res.json({ success: true, data: escalation });
  });

  // Mount all routers
  router.use('/leads', leadsRouter);
  router.use('/gate-approvals', gateRouter);
  router.use('/contracts', contractsRouter);
  router.use('/financial', financialRouter);
  router.use('/escalations', escalationsRouter);

  return router;
}

// ============================================================================
// CREATE APP
// ============================================================================

function createTestApp(db: MockDB) {
  const app = express();
  app.use(express.json());
  app.use('/api', createPipelineRouter(db));
  return app;
}

// ============================================================================
// TESTS
// ============================================================================

const ADMIN_TOKEN = 'Bearer token-admin';
const STAFF_TOKEN = 'Bearer token-staff';
const DIRECTOR_TOKEN = 'Bearer token-director';
const FINANCE_TOKEN = 'Bearer token-finance';
const LEGAL_TOKEN = 'Bearer token-legal';

describe('E2E Full Admission Pipeline', () => {
  let db: MockDB;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    db = new MockDB();
    app = createTestApp(db);
  });

  // ========================================================================
  // TEST 1: Gate approval config exists
  // ========================================================================
  describe('Test 1: Gate approval config', () => {
    it('GET /api/gate-approvals/config returns GateStepConfig records', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/config')
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify config structure
      const firstConfig = res.body.data[0];
      expect(firstConfig).toHaveProperty('id');
      expect(firstConfig).toHaveProperty('gateStep');
      expect(firstConfig).toHaveProperty('department');
      expect(firstConfig).toHaveProperty('isRequired');
      expect(firstConfig).toHaveProperty('approvalOrder');
      expect(firstConfig).toHaveProperty('allowedRoles');
    });

    it('config includes configs for multiple gate steps', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/config')
        .set('Authorization', ADMIN_TOKEN);

      const gateSteps = new Set(res.body.data.map((c: any) => c.gateStep));
      expect(gateSteps.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // TEST 2: Create lead and verify initial state
  // ========================================================================
  describe('Test 2: Create lead and verify initial state', () => {
    it('POST /api/leads creates a lead with NOT_STARTED status', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Silva',
          primaryContactName: 'Joao Silva',
          primaryContactEmail: 'joao@silva.com',
          numberOfChildren: 2,
          source: 'OTHER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.familyName).toBe('Familia Silva');
      expect(res.body.data.admissionGateStatus).toBe('NOT_STARTED');
      expect(res.body.data.applicationStatus).toBe('PENDING');
      expect(res.body.data.code).toMatch(/^RIS-/);
    });

    it('GET /api/leads/:id returns the created lead', async () => {
      // Create first
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Santos',
          primaryContactName: 'Maria Santos',
          primaryContactEmail: 'maria@santos.com',
        });

      const leadId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/leads/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(leadId);
      expect(getRes.body.data.admissionGateStatus).toBe('NOT_STARTED');
    });
  });

  // ========================================================================
  // TEST 3: Pipeline status endpoint
  // ========================================================================
  describe('Test 3: Pipeline status endpoint', () => {
    it('GET /api/gate-approvals/:leadId/pipeline returns status with 5 phases', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Pipeline',
          primaryContactName: 'Carlos Pipeline',
          primaryContactEmail: 'carlos@pipeline.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/gate-approvals/${leadId}/pipeline`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leadId', leadId);
      expect(res.body.data).toHaveProperty('familyName', 'Familia Pipeline');
      expect(res.body.data).toHaveProperty('currentStatus', 'NOT_STARTED');
      expect(res.body.data.phases).toHaveLength(5);

      // Verify phase names
      const phaseNames = res.body.data.phases.map((p: any) => p.name);
      expect(phaseNames).toContain('Contato');
      expect(phaseNames).toContain('Vivencia');
      expect(phaseNames).toContain('Contrato');
    });

    it('pipeline returns correct isCurrent for Contato phase on NOT_STARTED', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Teste',
          primaryContactName: 'Ana Teste',
          primaryContactEmail: 'ana@teste.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/gate-approvals/${leadId}/pipeline`)
        .set('Authorization', ADMIN_TOKEN);

      const contatoPhase = res.body.data.phases.find((p: any) => p.name === 'Contato');
      expect(contatoPhase.isCurrent).toBe(true);
      expect(contatoPhase.percentage).toBe(0);
    });

    it('pipeline returns 404 for non-existent lead', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/non-existent-id/pipeline')
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ========================================================================
  // TEST 4: Get lead approvals (empty initially)
  // ========================================================================
  describe('Test 4: Get lead approvals (empty initially)', () => {
    it('GET /api/gate-approvals/:leadId returns empty object initially', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Vazia',
          primaryContactName: 'Jose Vazio',
          primaryContactEmail: 'jose@vazio.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/gate-approvals/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body.data)).toHaveLength(0);
    });
  });

  // ========================================================================
  // TEST 5: Gate transition flow (submit approval)
  // ========================================================================
  describe('Test 5: Gate transition flow', () => {
    it('POST /api/gate-approvals/:leadId/:gateStep submits a departmental approval', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Gate',
          primaryContactName: 'Pedro Gate',
          primaryContactEmail: 'pedro@gate.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'ADMISSIONS',
          decision: 'APPROVED',
          notes: 'All documents in order',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leadId', leadId);
      expect(res.body.data).toHaveProperty('gateStep', 'FORM_RECEIVED');
      expect(res.body.data).toHaveProperty('department', 'ADMISSIONS');
      expect(res.body.data).toHaveProperty('decision', 'APPROVED');
      expect(res.body.data).toHaveProperty('notes', 'All documents in order');
      expect(res.body.data.decidedById).toBe('user-admin-001');
    });

    it('multiple departments can approve the same gate step', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Multi',
          primaryContactName: 'Ana Multi',
          primaryContactEmail: 'ana@multi.com',
        });

      const leadId = createRes.body.data.id;

      // Admissions approves
      await request(app)
        .post(`/api/gate-approvals/${leadId}/VISIT_COMPLETED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ department: 'ADMISSIONS', decision: 'APPROVED', notes: 'OK' });

      // Psychology approves
      await request(app)
        .post(`/api/gate-approvals/${leadId}/VISIT_COMPLETED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ department: 'PSYCHOLOGY', decision: 'APPROVED', notes: 'Clear' });

      // Check approvals
      const res = await request(app)
        .get(`/api/gate-approvals/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.body.data['VISIT_COMPLETED']).toHaveLength(2);
    });

    it('can reject at a gate step', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Rejeicao',
          primaryContactName: 'Lucia Rejeicao',
          primaryContactEmail: 'lucia@rejeicao.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'ADMISSIONS',
          decision: 'REJECTED',
          notes: 'Missing documents',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.decision).toBe('REJECTED');
    });

    it('can escalate an approval', async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Escalar',
          primaryContactName: 'Rafael Escalar',
          primaryContactEmail: 'rafael@escalar.com',
        });

      const leadId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/EVALUATION_COMPLETED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'COORDINATION',
          decision: 'ESCALATED',
          notes: 'Needs director review',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.decision).toBe('ESCALATED');
    });
  });

  // ========================================================================
  // TEST 6: Contract endpoints
  // ========================================================================
  describe('Test 6: Contract endpoints', () => {
    let leadId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Contrato',
          primaryContactName: 'Roberto Contrato',
          primaryContactEmail: 'roberto@contrato.com',
        });
      leadId = createRes.body.data.id;
    });

    it('GET /api/contracts/lead/:leadId returns empty array initially', async () => {
      const res = await request(app)
        .get(`/api/contracts/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('POST /api/contracts creates a contract with status DRAFT and CTR- code', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [
            { role: 'PARENT', name: 'Roberto Contrato', email: 'roberto@contrato.com' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.code).toMatch(/^CTR-/);
      expect(res.body.data.totalAnnualValue).toBe(50000);
      expect(res.body.data.installments).toBe(12);
      expect(res.body.data.leadId).toBe(leadId);
      expect(res.body.data.signers).toHaveLength(1);
      expect(res.body.data.signers[0].role).toBe('PARENT');
      expect(res.body.data.payments).toHaveLength(12);
    });

    it('GET /api/contracts/lead/:leadId returns 1 contract after creation', async () => {
      // Create a contract
      await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      const res = await request(app)
        .get(`/api/contracts/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].leadId).toBe(leadId);
    });

    it('creates contract with discount and correct installment amounts', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 60000,
          installments: 12,
          discountPercent: 10,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(201);
      // 60000 * 0.9 = 54000 / 12 = 4500
      expect(res.body.data.payments[0].amount).toBe(4500);
    });

    it('creates contract with multiple signers', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 40000,
          installments: 10,
          signers: [
            { role: 'PARENT', name: 'Parent One', email: 'parent1@test.com' },
            { role: 'GUARDIAN', name: 'Guardian One', email: 'guardian@test.com' },
            { role: 'SCHOOL_REPRESENTATIVE', name: 'School Rep', email: 'school@school-lab.com' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.signers).toHaveLength(3);
      expect(res.body.data.signers.map((s: any) => s.role)).toContain('PARENT');
      expect(res.body.data.signers.map((s: any) => s.role)).toContain('GUARDIAN');
      expect(res.body.data.signers.map((s: any) => s.role)).toContain('SCHOOL_REPRESENTATIVE');
    });
  });

  // ========================================================================
  // TEST 7: Financial analysis endpoints
  // ========================================================================
  describe('Test 7: Financial analysis endpoints', () => {
    let leadId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Financeiro',
          primaryContactName: 'Lucas Financeiro',
          primaryContactEmail: 'lucas@financeiro.com',
        });
      leadId = createRes.body.data.id;
    });

    it('POST /api/financial/analysis creates analysis for lead', async () => {
      const res = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.leadId).toBe(leadId);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.cpfAnalyzed).toBeNull();
    });

    it('PATCH /api/financial/analysis/:id updates with cpfAnalyzed', async () => {
      const createRes = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId });

      const analysisId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/financial/analysis/${analysisId}`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          cpfAnalyzed: '123.456.789-00',
          cpfStatus: 'CLEAN',
          analysisNotes: 'CPF verified, no issues',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.cpfAnalyzed).toBe('123.456.789-00');
      expect(updateRes.body.data.cpfStatus).toBe('CLEAN');
      expect(updateRes.body.data.analysisNotes).toBe('CPF verified, no issues');
    });

    it('PATCH /api/financial/analysis/:id/approve approves the analysis', async () => {
      const createRes = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId });

      const analysisId = createRes.body.data.id;

      // Admin can approve (ADMIN always passes role check)
      const approveRes = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'APPROVED' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
    });

    it('FINANCE role can approve analysis', async () => {
      const createRes = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId });

      const analysisId = createRes.body.data.id;

      const approveRes = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ status: 'APPROVED' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
    });

    it('can set analysis to IN_ANALYSIS then APPROVED', async () => {
      const createRes = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId, cpfAnalyzed: '111.222.333-44' });

      const analysisId = createRes.body.data.id;

      // Move to IN_ANALYSIS
      const inAnalysis = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'IN_ANALYSIS' });

      expect(inAnalysis.body.data.status).toBe('IN_ANALYSIS');

      // Move to APPROVED
      const approved = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'APPROVED' });

      expect(approved.body.data.status).toBe('APPROVED');
    });

    it('returns 404 for non-existent analysis', async () => {
      const res = await request(app)
        .patch('/api/financial/analysis/non-existent/approve')
        .set('Authorization', ADMIN_TOKEN)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(404);
    });
  });

  // ========================================================================
  // TEST 8: Escalation endpoints
  // ========================================================================
  describe('Test 8: Escalation endpoints', () => {
    let leadId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Escalacao',
          primaryContactName: 'Fernando Escalacao',
          primaryContactEmail: 'fernando@escalacao.com',
        });
      leadId = createRes.body.data.id;
    });

    it('POST /api/escalations creates escalation for lead', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'PSYCHOLOGY',
          gateStep: 'VISIT_COMPLETED',
          description: 'Child showed concerning behavior during visit',
          severity: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.leadId).toBe(leadId);
      expect(res.body.data.department).toBe('PSYCHOLOGY');
      expect(res.body.data.gateStep).toBe('VISIT_COMPLETED');
      expect(res.body.data.description).toContain('concerning behavior');
      expect(res.body.data.severity).toBe('HIGH');
      expect(res.body.data.isResolved).toBe(false);
    });

    it('GET /api/escalations includes the new escalation', async () => {
      await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'HEALTH',
          gateStep: 'VIVENCIA_COMPLETED',
          description: 'Medical record needs review by health department',
        });

      const res = await request(app)
        .get('/api/escalations')
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((e: any) => e.leadId === leadId)).toBe(true);
    });

    it('GET /api/escalations/lead/:leadId returns the escalation', async () => {
      await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'COORDINATION',
          gateStep: 'EVALUATION_PENDING',
          description: 'Evaluation delay requires coordination review',
        });

      const res = await request(app)
        .get(`/api/escalations/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].leadId).toBe(leadId);
      expect(res.body.data[0].department).toBe('COORDINATION');
    });

    it('PATCH /api/escalations/:id/resolve resolves with ADMIN role', async () => {
      const createRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'Document authenticity in question',
          severity: 'CRITICAL',
        });

      const escalationId = createRes.body.data.id;

      const resolveRes = await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ notes: 'Documents verified with issuing authority. All clear.' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.isResolved).toBe(true);
      expect(resolveRes.body.data.resolutionNotes).toContain('verified');
      expect(resolveRes.body.data.resolvedById).toBe('user-admin-001');
    });

    it('PATCH /api/escalations/:id/resolve resolves with DIRECTOR role', async () => {
      const createRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'DIRECTOR',
          gateStep: 'APPROVED',
          description: 'Final approval needs director sign-off',
        });

      const escalationId = createRes.body.data.id;

      const resolveRes = await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', DIRECTOR_TOKEN)
        .send({ notes: 'Approved after director review' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.isResolved).toBe(true);
      expect(resolveRes.body.data.resolvedById).toBe('user-director-001');
    });

    it('resolved escalation does not appear in active list', async () => {
      const createRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'Temporary issue that will be resolved',
        });

      const escalationId = createRes.body.data.id;

      // Resolve it
      await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ notes: 'Resolved now' });

      // Check active list
      const res = await request(app)
        .get('/api/escalations')
        .set('Authorization', ADMIN_TOKEN);

      const found = res.body.data.find((e: any) => e.id === escalationId);
      expect(found).toBeUndefined();
    });

    it('default severity is MEDIUM', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'SECRETARIAT',
          gateStep: 'DOCS_REQUESTED',
          description: 'Documents pending from family',
        });

      expect(res.body.data.severity).toBe('MEDIUM');
    });
  });

  // ========================================================================
  // TEST 9: Contract legal/financial approval
  // ========================================================================
  describe('Test 9: Contract legal/financial approval', () => {
    let leadId: string;
    let contractId: string;

    beforeEach(async () => {
      const createLeadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Aprovacao',
          primaryContactName: 'Sandra Aprovacao',
          primaryContactEmail: 'sandra@aprovacao.com',
        });
      leadId = createLeadRes.body.data.id;

      const createContractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 48000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Sandra', email: 'sandra@aprovacao.com' }],
        });
      contractId = createContractRes.body.data.id;
    });

    it('PATCH /api/contracts/:id/legal submits legal approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Contract terms are compliant' });

      expect(res.status).toBe(200);
      expect(res.body.data.legalApprovalStatus).toBe('APPROVED');
      expect(res.body.data.legalNotes).toBe('Contract terms are compliant');
      expect(res.body.data.legalApprovedById).toBe('user-admin-001');
      expect(res.body.data.legalApprovedAt).not.toBeNull();
    });

    it('PATCH /api/contracts/:id/financial submits financial approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${contractId}/financial`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Financial terms verified' });

      expect(res.status).toBe(200);
      expect(res.body.data.financialApprovalStatus).toBe('APPROVED');
      expect(res.body.data.financialNotes).toBe('Financial terms verified');
      expect(res.body.data.financialApprovedById).toBe('user-admin-001');
    });

    it('LEGAL role can submit legal approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', LEGAL_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Approved by legal department' });

      expect(res.status).toBe(200);
      expect(res.body.data.legalApprovalStatus).toBe('APPROVED');
      expect(res.body.data.legalApprovedById).toBe('user-legal-001');
    });

    it('FINANCE role can submit financial approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${contractId}/financial`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Approved by finance department' });

      expect(res.status).toBe(200);
      expect(res.body.data.financialApprovalStatus).toBe('APPROVED');
      expect(res.body.data.financialApprovedById).toBe('user-finance-001');
    });

    it('legal and financial can both be approved on same contract', async () => {
      await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', LEGAL_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Legal OK' });

      await request(app)
        .patch(`/api/contracts/${contractId}/financial`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Finance OK' });

      // Verify both are recorded
      const contractsRes = await request(app)
        .get(`/api/contracts/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      const contract = contractsRes.body.data[0];
      expect(contract.legalApprovalStatus).toBe('APPROVED');
      expect(contract.financialApprovalStatus).toBe('APPROVED');
    });

    it('can reject at legal approval', async () => {
      const res = await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', LEGAL_TOKEN)
        .send({ decision: 'REJECTED', notes: 'Non-compliant clause in section 4' });

      expect(res.status).toBe(200);
      expect(res.body.data.legalApprovalStatus).toBe('REJECTED');
      expect(res.body.data.legalNotes).toContain('Non-compliant');
    });

    it('returns 404 for non-existent contract', async () => {
      const res = await request(app)
        .patch('/api/contracts/non-existent/legal')
        .set('Authorization', ADMIN_TOKEN)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(404);
    });
  });

  // ========================================================================
  // TEST 10: Contract cancellation
  // ========================================================================
  describe('Test 10: Contract cancellation', () => {
    it('POST /api/contracts/:id/cancel cancels with reason', async () => {
      const createLeadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Cancelamento',
          primaryContactName: 'Jorge Cancelamento',
          primaryContactEmail: 'jorge@cancel.com',
        });
      const leadId = createLeadRes.body.data.id;

      const createContractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 30000,
          installments: 10,
          signers: [{ role: 'PARENT', name: 'Jorge', email: 'jorge@cancel.com' }],
        });
      const contractId = createContractRes.body.data.id;

      const cancelRes = await request(app)
        .post(`/api/contracts/${contractId}/cancel`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ reason: 'Family decided to enroll elsewhere' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.cancellationReason).toBe('Family decided to enroll elsewhere');
      expect(cancelRes.body.data.cancelledAt).not.toBeNull();
    });

    it('cancel without reason still works', async () => {
      const createLeadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia NoReason',
          primaryContactName: 'Maria NoReason',
          primaryContactEmail: 'maria@noreason.com',
        });
      const leadId = createLeadRes.body.data.id;

      const createContractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 25000,
          installments: 6,
          signers: [{ role: 'PARENT', name: 'Maria', email: 'maria@noreason.com' }],
        });
      const contractId = createContractRes.body.data.id;

      const cancelRes = await request(app)
        .post(`/api/contracts/${contractId}/cancel`)
        .set('Authorization', ADMIN_TOKEN)
        .send({});

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.cancellationReason).toBeNull();
    });

    it('cancel returns 404 for non-existent contract', async () => {
      const res = await request(app)
        .post('/api/contracts/non-existent-id/cancel')
        .set('Authorization', ADMIN_TOKEN)
        .send({ reason: 'test' });

      expect(res.status).toBe(404);
    });
  });

  // ========================================================================
  // TEST 11: Validation tests (400 errors)
  // ========================================================================
  describe('Test 11: Validation tests', () => {
    let leadId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Validacao',
          primaryContactName: 'Carlos Validacao',
          primaryContactEmail: 'carlos@validacao.com',
        });
      leadId = createRes.body.data.id;
    });

    it('POST /api/contracts with missing leadId returns 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          totalAnnualValue: 50000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/contracts with invalid installments returns 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 0, // Invalid: min is 1
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/contracts with empty signers returns 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [],
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/contracts with non-numeric totalAnnualValue returns 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 'not-a-number',
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/escalations with missing description returns 400', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          // description is missing
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/escalations with short description returns 400', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'ab', // Too short (min 5)
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/escalations with missing department returns 400', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          gateStep: 'FORM_RECEIVED',
          description: 'Missing department field',
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/gate-approvals/:leadId/INVALID_STEP returns 400', async () => {
      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/INVALID_STEP`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'ADMISSIONS',
          decision: 'APPROVED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/gate-approvals with invalid department returns 400', async () => {
      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'INVALID_DEPT',
          decision: 'APPROVED',
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/gate-approvals with invalid decision returns 400', async () => {
      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({
          department: 'ADMISSIONS',
          decision: 'INVALID_DECISION',
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/financial/analysis without leadId returns 400', async () => {
      const res = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/leads with missing familyName returns 400', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          primaryContactName: 'Test',
          primaryContactEmail: 'test@test.com',
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/leads with invalid email returns 400', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Test Family',
          primaryContactName: 'Test',
          primaryContactEmail: 'not-an-email',
        });

      expect(res.status).toBe(400);
    });

    it('PATCH /api/escalations/:id/resolve with short notes returns 400', async () => {
      const createEsc = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'Needs resolution',
        });

      const res = await request(app)
        .patch(`/api/escalations/${createEsc.body.data.id}/resolve`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ notes: 'ab' }); // Too short (min 3)

      expect(res.status).toBe(400);
    });

    it('POST /api/contracts with installments > 12 returns 400', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 24, // Max is 12
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(400);
    });
  });

  // ========================================================================
  // TEST 12: Authorization tests
  // ========================================================================
  describe('Test 12: Authorization tests', () => {
    let leadId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Auth',
          primaryContactName: 'Paulo Auth',
          primaryContactEmail: 'paulo@auth.com',
        });
      leadId = createRes.body.data.id;
    });

    it('gate-approvals require authentication - 401 without token', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/config');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('gate-approvals pipeline requires auth - 401 without token', async () => {
      const res = await request(app)
        .get(`/api/gate-approvals/${leadId}/pipeline`);

      expect(res.status).toBe(401);
    });

    it('gate-approvals submit requires auth - 401 without token', async () => {
      const res = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .send({ department: 'ADMISSIONS', decision: 'APPROVED' });

      expect(res.status).toBe(401);
    });

    it('contracts endpoint requires authentication - 401 without token', async () => {
      const res = await request(app)
        .get(`/api/contracts/lead/${leadId}`);

      expect(res.status).toBe(401);
    });

    it('create contract requires authentication - 401 without token', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      expect(res.status).toBe(401);
    });

    it('financial analysis requires authentication - 401 without token', async () => {
      const res = await request(app)
        .post('/api/financial/analysis')
        .send({ leadId });

      expect(res.status).toBe(401);
    });

    it('escalations require authentication - 401 without token', async () => {
      const res = await request(app)
        .get('/api/escalations');

      expect(res.status).toBe(401);
    });

    it('create escalation requires authentication - 401 without token', async () => {
      const res = await request(app)
        .post('/api/escalations')
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'Unauthorized test',
        });

      expect(res.status).toBe(401);
    });

    it('resolve escalation requires DIRECTOR/ADMIN role - 403 for STAFF', async () => {
      // Create escalation with admin
      const createRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'ADMISSIONS',
          gateStep: 'FORM_RECEIVED',
          description: 'Test escalation for auth',
        });

      const escalationId = createRes.body.data.id;

      // Try to resolve with STAFF token
      const res = await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', STAFF_TOKEN)
        .send({ notes: 'Trying to resolve as staff' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('resolve escalation requires DIRECTOR/ADMIN role - 403 for FINANCE', async () => {
      const createRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'FINANCE',
          gateStep: 'CONTRACT_PENDING',
          description: 'Finance escalation test',
        });

      const escalationId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ notes: 'Trying to resolve as finance' });

      expect(res.status).toBe(403);
    });

    it('legal approval requires LEGAL/ADMIN role - 403 for STAFF', async () => {
      const createContractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      const contractId = createContractRes.body.data.id;

      const res = await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', STAFF_TOKEN)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('financial approval requires FINANCE/ADMIN role - 403 for STAFF', async () => {
      const createContractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 50000,
          installments: 12,
          signers: [{ role: 'PARENT', name: 'Test', email: 'test@test.com' }],
        });

      const contractId = createContractRes.body.data.id;

      const res = await request(app)
        .patch(`/api/contracts/${contractId}/financial`)
        .set('Authorization', STAFF_TOKEN)
        .send({ decision: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('financial analysis approve requires FINANCE/ADMIN - 403 for STAFF', async () => {
      const createAnalysis = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId });

      const analysisId = createAnalysis.body.data.id;

      const res = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', STAFF_TOKEN)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });

    it('invalid token returns 401', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/config')
        .set('Authorization', 'Bearer invalid-token-123');

      expect(res.status).toBe(401);
    });

    it('malformed authorization header returns 401', async () => {
      const res = await request(app)
        .get('/api/gate-approvals/config')
        .set('Authorization', 'NotBearer token-admin');

      expect(res.status).toBe(401);
    });
  });

  // ========================================================================
  // BONUS: Full pipeline integration walkthrough
  // ========================================================================
  describe('Full pipeline integration walkthrough', () => {
    it('completes a full lead-to-contract cycle', async () => {
      // 1. Create lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          familyName: 'Familia Completa',
          primaryContactName: 'Marcos Completo',
          primaryContactEmail: 'marcos@completo.com',
        });

      expect(leadRes.status).toBe(201);
      const leadId = leadRes.body.data.id;
      expect(leadRes.body.data.admissionGateStatus).toBe('NOT_STARTED');

      // 2. Check pipeline shows 5 phases, all at 0%
      const pipelineRes = await request(app)
        .get(`/api/gate-approvals/${leadId}/pipeline`)
        .set('Authorization', ADMIN_TOKEN);

      expect(pipelineRes.body.data.phases).toHaveLength(5);
      expect(pipelineRes.body.data.currentStatus).toBe('NOT_STARTED');

      // 3. Submit gate approvals for FORM_RECEIVED
      const approval1 = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ department: 'ADMISSIONS', decision: 'APPROVED', notes: 'Form looks good' });

      expect(approval1.status).toBe(200);
      expect(approval1.body.data.decision).toBe('APPROVED');

      const approval2 = await request(app)
        .post(`/api/gate-approvals/${leadId}/FORM_RECEIVED`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ department: 'SECRETARIAT', decision: 'APPROVED', notes: 'All docs present' });

      expect(approval2.status).toBe(200);

      // 4. Verify approvals are stored
      const approvalsRes = await request(app)
        .get(`/api/gate-approvals/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(Object.keys(approvalsRes.body.data)).toContain('FORM_RECEIVED');
      expect(approvalsRes.body.data['FORM_RECEIVED']).toHaveLength(2);

      // 5. Create a contract
      const contractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          totalAnnualValue: 55000,
          installments: 12,
          signers: [
            { role: 'PARENT', name: 'Marcos Completo', email: 'marcos@completo.com' },
            { role: 'SCHOOL_REPRESENTATIVE', name: 'Director', email: 'director@school-lab.com' },
          ],
        });

      expect(contractRes.status).toBe(201);
      const contractId = contractRes.body.data.id;
      expect(contractRes.body.data.code).toMatch(/^CTR-/);
      expect(contractRes.body.data.status).toBe('DRAFT');

      // 6. Legal approval on contract
      const legalRes = await request(app)
        .patch(`/api/contracts/${contractId}/legal`)
        .set('Authorization', LEGAL_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Contract compliant' });

      expect(legalRes.status).toBe(200);
      expect(legalRes.body.data.legalApprovalStatus).toBe('APPROVED');

      // 7. Financial approval on contract
      const financialRes = await request(app)
        .patch(`/api/contracts/${contractId}/financial`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ decision: 'APPROVED', notes: 'Payment terms acceptable' });

      expect(financialRes.status).toBe(200);
      expect(financialRes.body.data.financialApprovalStatus).toBe('APPROVED');

      // 8. Create financial analysis
      const analysisRes = await request(app)
        .post('/api/financial/analysis')
        .set('Authorization', ADMIN_TOKEN)
        .send({ leadId, cpfAnalyzed: '999.888.777-66' });

      expect(analysisRes.status).toBe(201);
      const analysisId = analysisRes.body.data.id;

      // 9. Update and approve financial analysis
      await request(app)
        .patch(`/api/financial/analysis/${analysisId}`)
        .set('Authorization', ADMIN_TOKEN)
        .send({ cpfStatus: 'CLEAN', analysisNotes: 'No issues found' });

      const approveAnalysis = await request(app)
        .patch(`/api/financial/analysis/${analysisId}/approve`)
        .set('Authorization', FINANCE_TOKEN)
        .send({ status: 'APPROVED' });

      expect(approveAnalysis.body.data.status).toBe('APPROVED');

      // 10. Verify all contracts for lead
      const contractsListRes = await request(app)
        .get(`/api/contracts/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(contractsListRes.body.data).toHaveLength(1);
      expect(contractsListRes.body.data[0].legalApprovalStatus).toBe('APPROVED');
      expect(contractsListRes.body.data[0].financialApprovalStatus).toBe('APPROVED');

      // 11. Create and resolve an escalation
      const escCreateRes = await request(app)
        .post('/api/escalations')
        .set('Authorization', ADMIN_TOKEN)
        .send({
          leadId,
          department: 'HEALTH',
          gateStep: 'DOCS_RECEIVED',
          description: 'Medical records need verification',
          severity: 'HIGH',
        });

      expect(escCreateRes.status).toBe(201);
      const escalationId = escCreateRes.body.data.id;

      const escResolveRes = await request(app)
        .patch(`/api/escalations/${escalationId}/resolve`)
        .set('Authorization', DIRECTOR_TOKEN)
        .send({ notes: 'Medical records verified and accepted' });

      expect(escResolveRes.status).toBe(200);
      expect(escResolveRes.body.data.isResolved).toBe(true);

      // 12. Verify escalation for lead shows resolved
      const escLeadRes = await request(app)
        .get(`/api/escalations/lead/${leadId}`)
        .set('Authorization', ADMIN_TOKEN);

      expect(escLeadRes.body.data).toHaveLength(1);
      expect(escLeadRes.body.data[0].isResolved).toBe(true);
      expect(escLeadRes.body.data[0].resolutionNotes).toContain('verified');
    });
  });
});
