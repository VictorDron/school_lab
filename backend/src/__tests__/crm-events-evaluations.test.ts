/**
 * CRM Events & Evaluations - Service Logic Tests
 *
 * Covers:
 * - Event creation validation (VISIT / VIVENCIA)
 * - Status transitions (SCHEDULED → COMPLETED → CANCELLED)
 * - Gate status auto-advancement on event creation/completion
 * - Gate revert on event cancellation
 * - Evaluation creation validation (must be VIVENCIA, child belongs to lead)
 * - Evaluation decision logic (all approved → APPROVED, any rejected → REJECTED)
 * - Multi-child evaluation scenarios
 * - Edge cases: duplicate evaluations, missing data, wrong event types
 *
 * Uses mock in-memory database simulating the service layer logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

type CrmEventType = 'VISIT' | 'VIVENCIA';
type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
type VivenciaStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
type EvaluationDecision = 'PENDING' | 'APPROVED' | 'REJECTED';
type AdmissionGateStatus =
  | 'NOT_STARTED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED'
  | 'VISIT_APPROVED' | 'VIVENCIA_SCHEDULED' | 'VIVENCIA_COMPLETED'
  | 'EVALUATION_PENDING' | 'EVALUATION_COMPLETED' | 'APPROVED' | 'REJECTED';

interface MockLead {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  admissionGateStatus: AdmissionGateStatus;
  applicationStatus: string;
  children: MockChild[];
}

interface MockChild {
  id: string;
  leadId: string;
  fullName: string;
}

interface MockEvent {
  id: string;
  leadId: string;
  eventType: CrmEventType;
  title: string;
  startDate: Date;
  endDate: Date;
  visitStatus: VisitStatus | null;
  vivenciaStatus: VivenciaStatus | null;
  visitCompletedAt: Date | null;
  vivenciaCompletedAt: Date | null;
  assignedTeacherId: string | null;
  location: string | null;
  createdById: string;
}

interface MockEvaluation {
  id: string;
  eventId: string;
  childId: string;
  leadId: string;
  teacherName: string;
  evaluationDate: Date;
  behavior: string | null;
  english: string | null;
  interactionWithKids: string | null;
  mathPlacement: string | null;
  englishPlacement: string | null;
  additionalNotes: string | null;
  decision: EvaluationDecision;
  decisionById: string | null;
  decisionAt: Date | null;
  decisionNotes: string | null;
}

// ============================================================================
// GATE STATE MACHINE (mirrors admission-gate.service.ts)
// ============================================================================

const validTransitions: Record<AdmissionGateStatus, AdmissionGateStatus[]> = {
  NOT_STARTED: ['VISIT_SCHEDULED'],
  VISIT_SCHEDULED: ['VISIT_COMPLETED', 'NOT_STARTED'],
  VISIT_COMPLETED: ['VISIT_APPROVED', 'REJECTED'],
  VISIT_APPROVED: ['VIVENCIA_SCHEDULED'],
  VIVENCIA_SCHEDULED: ['VIVENCIA_COMPLETED', 'VISIT_APPROVED'],
  VIVENCIA_COMPLETED: ['EVALUATION_PENDING'],
  EVALUATION_PENDING: ['EVALUATION_COMPLETED'],
  EVALUATION_COMPLETED: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

function canTransition(from: AdmissionGateStatus, to: AdmissionGateStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

// ============================================================================
// MOCK DATABASE
// ============================================================================

class MockDB {
  leads = new Map<string, MockLead>();
  events = new Map<string, MockEvent>();
  evaluations = new Map<string, MockEvaluation>();
  history: { leadId: string; action: string; details: any }[] = [];
  private idCounter = 0;

  genId() {
    return `mock-${++this.idCounter}-${crypto.randomBytes(4).toString('hex')}`;
  }

  createLead(familyName: string, childNames: string[] = ['João']): MockLead {
    const id = this.genId();
    const children = childNames.map((name) => ({
      id: this.genId(),
      leadId: id,
      fullName: name,
    }));
    const lead: MockLead = {
      id,
      code: `L-${String(this.idCounter).padStart(4, '0')}`,
      familyName,
      primaryContactName: `Contato ${familyName}`,
      admissionGateStatus: 'NOT_STARTED',
      applicationStatus: 'FORM_RECEIVED',
      children,
    };
    this.leads.set(id, lead);
    return lead;
  }

  transitionGate(leadId: string, newStatus: AdmissionGateStatus, userId: string): void {
    const lead = this.leads.get(leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');
    if (!canTransition(lead.admissionGateStatus, newStatus)) {
      throw new Error(`INVALID_GATE_TRANSITION: ${lead.admissionGateStatus} → ${newStatus}`);
    }
    const prev = lead.admissionGateStatus;
    lead.admissionGateStatus = newStatus;
    this.history.push({
      leadId,
      action: 'ADMISSION_GATE_CHANGED',
      details: { previousStatus: prev, newStatus },
    });
  }

  tryTransitionGate(leadId: string, newStatus: AdmissionGateStatus, userId: string): boolean {
    try {
      this.transitionGate(leadId, newStatus, userId);
      return true;
    } catch {
      return false;
    }
  }

  createEvent(data: {
    leadId: string;
    eventType: CrmEventType;
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    assignedTeacherId?: string;
  }, userId: string): MockEvent {
    const lead = this.leads.get(data.leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');

    const event: MockEvent = {
      id: this.genId(),
      leadId: data.leadId,
      eventType: data.eventType,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      visitStatus: data.eventType === 'VISIT' ? 'SCHEDULED' : null,
      vivenciaStatus: data.eventType === 'VIVENCIA' ? 'SCHEDULED' : null,
      visitCompletedAt: null,
      vivenciaCompletedAt: null,
      assignedTeacherId: data.assignedTeacherId || null,
      location: data.location || null,
      createdById: userId,
    };
    this.events.set(event.id, event);

    // Auto-advance gate
    const targetGate = data.eventType === 'VISIT' ? 'VISIT_SCHEDULED' : 'VIVENCIA_SCHEDULED';
    this.tryTransitionGate(data.leadId, targetGate as AdmissionGateStatus, userId);

    return event;
  }

  updateEventStatus(eventId: string, status: string, userId: string, notes?: string): MockEvent {
    const event = this.events.get(eventId);
    if (!event) throw new Error('EVENT_NOT_FOUND');

    if (event.eventType === 'VISIT') {
      event.visitStatus = status as VisitStatus;
      if (status === 'COMPLETED') event.visitCompletedAt = new Date();
    } else {
      event.vivenciaStatus = status as VivenciaStatus;
      if (status === 'COMPLETED') event.vivenciaCompletedAt = new Date();
    }

    if (status === 'COMPLETED') {
      const targetGate = event.eventType === 'VISIT' ? 'VISIT_COMPLETED' : 'VIVENCIA_COMPLETED';
      this.tryTransitionGate(event.leadId, targetGate as AdmissionGateStatus, userId);
      if (event.eventType === 'VIVENCIA') {
        this.tryTransitionGate(event.leadId, 'EVALUATION_PENDING', userId);
      }
    } else if (status === 'CANCELLED') {
      const revertGate = event.eventType === 'VISIT' ? 'NOT_STARTED' : 'VISIT_APPROVED';
      this.tryTransitionGate(event.leadId, revertGate as AdmissionGateStatus, userId);
    }

    return event;
  }

  createEvaluation(data: {
    eventId: string;
    childId: string;
    leadId: string;
    teacherName: string;
    evaluationDate: Date;
    behavior?: string;
    english?: string;
    interactionWithKids?: string;
    mathPlacement?: string;
    englishPlacement?: string;
    additionalNotes?: string;
  }, userId: string): MockEvaluation {
    const event = this.events.get(data.eventId);
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.eventType !== 'VIVENCIA') throw new Error('EVENT_NOT_VIVENCIA');

    const lead = this.leads.get(data.leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');

    const child = lead.children.find((c) => c.id === data.childId);
    if (!child) throw new Error('CHILD_NOT_FOUND');

    // Check for duplicates
    const existing = [...this.evaluations.values()].find(
      (e) => e.eventId === data.eventId && e.childId === data.childId
    );
    if (existing) throw new Error('DUPLICATE_EVALUATION');

    const evaluation: MockEvaluation = {
      id: this.genId(),
      eventId: data.eventId,
      childId: data.childId,
      leadId: data.leadId,
      teacherName: data.teacherName,
      evaluationDate: data.evaluationDate,
      behavior: data.behavior || null,
      english: data.english || null,
      interactionWithKids: data.interactionWithKids || null,
      mathPlacement: data.mathPlacement || null,
      englishPlacement: data.englishPlacement || null,
      additionalNotes: data.additionalNotes || null,
      decision: 'PENDING',
      decisionById: null,
      decisionAt: null,
      decisionNotes: null,
    };
    this.evaluations.set(evaluation.id, evaluation);
    return evaluation;
  }

  makeDecision(evaluationId: string, decision: EvaluationDecision, userId: string, notes?: string): MockEvaluation {
    const evaluation = this.evaluations.get(evaluationId);
    if (!evaluation) throw new Error('EVALUATION_NOT_FOUND');

    evaluation.decision = decision;
    evaluation.decisionById = userId;
    evaluation.decisionAt = new Date();
    evaluation.decisionNotes = notes || null;

    // Check if all evaluations for this event have decisions
    const eventEvals = [...this.evaluations.values()].filter(
      (e) => e.eventId === evaluation.eventId
    );
    const allDecided = eventEvals.every((e) => e.decision !== 'PENDING');

    if (allDecided) {
      const hasRejection = eventEvals.some((e) => e.decision === 'REJECTED');
      this.tryTransitionGate(evaluation.leadId, 'EVALUATION_COMPLETED', userId);
      if (hasRejection) {
        this.tryTransitionGate(evaluation.leadId, 'REJECTED', userId);
      } else {
        this.tryTransitionGate(evaluation.leadId, 'APPROVED', userId);
      }
    }

    return evaluation;
  }

  getLeadGate(leadId: string): AdmissionGateStatus {
    const lead = this.leads.get(leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');
    return lead.admissionGateStatus;
  }

  getEventEvaluations(eventId: string): MockEvaluation[] {
    return [...this.evaluations.values()].filter((e) => e.eventId === eventId);
  }
}

const USER_ID = 'user-admin-001';
const TEACHER_ID = 'user-teacher-001';

// ============================================================================
// TESTS
// ============================================================================

describe('CRM Events - Creation & Gate Integration', () => {
  let db: MockDB;

  beforeEach(() => {
    db = new MockDB();
  });

  it('creating a VISIT event sets lead gate to VISIT_SCHEDULED', () => {
    const lead = db.createLead('Silva');
    expect(db.getLeadGate(lead.id)).toBe('NOT_STARTED');

    db.createEvent({
      leadId: lead.id,
      eventType: 'VISIT',
      title: 'Visita escola',
      startDate: new Date('2026-03-10T10:00:00Z'),
      endDate: new Date('2026-03-10T11:00:00Z'),
    }, USER_ID);

    expect(db.getLeadGate(lead.id)).toBe('VISIT_SCHEDULED');
  });

  it('creating a VIVENCIA event sets lead gate to VIVENCIA_SCHEDULED (when in VISIT_APPROVED)', () => {
    const lead = db.createLead('Oliveira');
    // Advance to VISIT_APPROVED manually
    db.transitionGate(lead.id, 'VISIT_SCHEDULED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    db.createEvent({
      leadId: lead.id,
      eventType: 'VIVENCIA',
      title: 'Vivência escolar',
      startDate: new Date('2026-03-15T08:00:00Z'),
      endDate: new Date('2026-03-15T16:00:00Z'),
      assignedTeacherId: TEACHER_ID,
    }, USER_ID);

    expect(db.getLeadGate(lead.id)).toBe('VIVENCIA_SCHEDULED');
  });

  it('creating event for non-existent lead throws LEAD_NOT_FOUND', () => {
    expect(() =>
      db.createEvent({
        leadId: 'non-existent-id',
        eventType: 'VISIT',
        title: 'Visita',
        startDate: new Date(),
        endDate: new Date(),
      }, USER_ID)
    ).toThrow('LEAD_NOT_FOUND');
  });

  it('creating a VISIT when gate is NOT at NOT_STARTED still creates event (gate silently fails)', () => {
    const lead = db.createLead('Santos');
    db.transitionGate(lead.id, 'VISIT_SCHEDULED', USER_ID);

    // Creating another visit - gate transition will fail silently
    const event = db.createEvent({
      leadId: lead.id,
      eventType: 'VISIT',
      title: 'Segunda Visita',
      startDate: new Date(),
      endDate: new Date(),
    }, USER_ID);

    expect(event).toBeDefined();
    expect(db.getLeadGate(lead.id)).toBe('VISIT_SCHEDULED'); // Unchanged
  });
});

describe('CRM Events - Status Updates & Gate Advancement', () => {
  let db: MockDB;
  let lead: MockLead;
  let visitEvent: MockEvent;

  beforeEach(() => {
    db = new MockDB();
    lead = db.createLead('Costa');
    visitEvent = db.createEvent({
      leadId: lead.id,
      eventType: 'VISIT',
      title: 'Visita escola',
      startDate: new Date('2026-03-10T10:00:00Z'),
      endDate: new Date('2026-03-10T11:00:00Z'),
    }, USER_ID);
  });

  it('completing a VISIT advances gate to VISIT_COMPLETED', () => {
    db.updateEventStatus(visitEvent.id, 'COMPLETED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('VISIT_COMPLETED');
    expect(visitEvent.visitStatus).toBe('COMPLETED');
    expect(visitEvent.visitCompletedAt).toBeInstanceOf(Date);
  });

  it('cancelling a VISIT reverts gate to NOT_STARTED', () => {
    db.updateEventStatus(visitEvent.id, 'CANCELLED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('NOT_STARTED');
    expect(visitEvent.visitStatus).toBe('CANCELLED');
  });

  it('completing a VIVENCIA advances gate to EVALUATION_PENDING (two transitions)', () => {
    // Advance to VISIT_APPROVED
    db.updateEventStatus(visitEvent.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    const vivencia = db.createEvent({
      leadId: lead.id,
      eventType: 'VIVENCIA',
      title: 'Vivência',
      startDate: new Date(),
      endDate: new Date(),
      assignedTeacherId: TEACHER_ID,
    }, USER_ID);

    expect(db.getLeadGate(lead.id)).toBe('VIVENCIA_SCHEDULED');

    db.updateEventStatus(vivencia.id, 'COMPLETED', USER_ID);
    // Should go VIVENCIA_COMPLETED → EVALUATION_PENDING
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');
  });

  it('cancelling a VIVENCIA reverts gate to VISIT_APPROVED', () => {
    db.updateEventStatus(visitEvent.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    const vivencia = db.createEvent({
      leadId: lead.id,
      eventType: 'VIVENCIA',
      title: 'Vivência',
      startDate: new Date(),
      endDate: new Date(),
    }, USER_ID);

    db.updateEventStatus(vivencia.id, 'CANCELLED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('VISIT_APPROVED');
  });

  it('NO_SHOW status does not change gate', () => {
    const currentGate = db.getLeadGate(lead.id);
    db.updateEventStatus(visitEvent.id, 'NO_SHOW', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe(currentGate);
  });

  it('updating a non-existent event throws EVENT_NOT_FOUND', () => {
    expect(() =>
      db.updateEventStatus('fake-event-id', 'COMPLETED', USER_ID)
    ).toThrow('EVENT_NOT_FOUND');
  });
});

describe('Evaluations - Creation Validation', () => {
  let db: MockDB;
  let lead: MockLead;
  let vivenciaEvent: MockEvent;

  beforeEach(() => {
    db = new MockDB();
    lead = db.createLead('Ferreira', ['Ana', 'Pedro']);

    // Advance to EVALUATION_PENDING
    const visit = db.createEvent({
      leadId: lead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    vivenciaEvent = db.createEvent({
      leadId: lead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(), assignedTeacherId: TEACHER_ID,
    }, USER_ID);
    db.updateEventStatus(vivenciaEvent.id, 'COMPLETED', USER_ID);
  });

  it('can create evaluation for a VIVENCIA event', () => {
    const eval1 = db.createEvaluation({
      eventId: vivenciaEvent.id,
      childId: lead.children[0].id,
      leadId: lead.id,
      teacherName: 'Prof. Maria',
      evaluationDate: new Date(),
      behavior: 'Excelente comportamento',
    }, TEACHER_ID);

    expect(eval1.decision).toBe('PENDING');
    expect(eval1.behavior).toBe('Excelente comportamento');
  });

  it('cannot create evaluation for a VISIT event', () => {
    const visit = db.createEvent({
      leadId: lead.id, eventType: 'VISIT', title: 'Visita 2',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);

    expect(() =>
      db.createEvaluation({
        eventId: visit.id,
        childId: lead.children[0].id,
        leadId: lead.id,
        teacherName: 'Prof. Maria',
        evaluationDate: new Date(),
      }, TEACHER_ID)
    ).toThrow('EVENT_NOT_VIVENCIA');
  });

  it('cannot create evaluation for child not belonging to the lead', () => {
    const otherLead = db.createLead('Outro', ['Carlos']);

    expect(() =>
      db.createEvaluation({
        eventId: vivenciaEvent.id,
        childId: otherLead.children[0].id,
        leadId: lead.id,
        teacherName: 'Prof. Maria',
        evaluationDate: new Date(),
      }, TEACHER_ID)
    ).toThrow('CHILD_NOT_FOUND');
  });

  it('cannot create duplicate evaluation for same child+event', () => {
    db.createEvaluation({
      eventId: vivenciaEvent.id,
      childId: lead.children[0].id,
      leadId: lead.id,
      teacherName: 'Prof. Maria',
      evaluationDate: new Date(),
    }, TEACHER_ID);

    expect(() =>
      db.createEvaluation({
        eventId: vivenciaEvent.id,
        childId: lead.children[0].id,
        leadId: lead.id,
        teacherName: 'Prof. João',
        evaluationDate: new Date(),
      }, TEACHER_ID)
    ).toThrow('DUPLICATE_EVALUATION');
  });

  it('can create separate evaluations for each child of the same event', () => {
    const eval1 = db.createEvaluation({
      eventId: vivenciaEvent.id,
      childId: lead.children[0].id,
      leadId: lead.id,
      teacherName: 'Prof. Maria',
      evaluationDate: new Date(),
    }, TEACHER_ID);

    const eval2 = db.createEvaluation({
      eventId: vivenciaEvent.id,
      childId: lead.children[1].id,
      leadId: lead.id,
      teacherName: 'Prof. Maria',
      evaluationDate: new Date(),
    }, TEACHER_ID);

    expect(eval1.id).not.toBe(eval2.id);
    expect(db.getEventEvaluations(vivenciaEvent.id)).toHaveLength(2);
  });

  it('non-existent event throws EVENT_NOT_FOUND', () => {
    expect(() =>
      db.createEvaluation({
        eventId: 'fake-event',
        childId: lead.children[0].id,
        leadId: lead.id,
        teacherName: 'Prof',
        evaluationDate: new Date(),
      }, TEACHER_ID)
    ).toThrow('EVENT_NOT_FOUND');
  });
});

describe('Evaluations - Decision Logic & Gate Advancement', () => {
  let db: MockDB;
  let lead: MockLead;
  let vivenciaEvent: MockEvent;

  beforeEach(() => {
    db = new MockDB();
    lead = db.createLead('Souza', ['Maria', 'Lucas']);

    // Advance to EVALUATION_PENDING
    const visit = db.createEvent({
      leadId: lead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    vivenciaEvent = db.createEvent({
      leadId: lead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(), assignedTeacherId: TEACHER_ID,
    }, USER_ID);
    db.updateEventStatus(vivenciaEvent.id, 'COMPLETED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');
  });

  it('approving ALL evaluations advances gate to APPROVED', () => {
    const eval1 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[0].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
      behavior: 'Ótimo', english: 'Bom', interactionWithKids: 'Excelente',
    }, TEACHER_ID);

    const eval2 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[1].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
      behavior: 'Bom', english: 'Regular', interactionWithKids: 'Bom',
    }, TEACHER_ID);

    // Approve first - gate should NOT advance yet (still one pending)
    db.makeDecision(eval1.id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');

    // Approve second - now all decided, all approved → APPROVED
    db.makeDecision(eval2.id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('APPROVED');
  });

  it('rejecting ANY evaluation advances gate to REJECTED', () => {
    const eval1 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[0].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
    }, TEACHER_ID);

    const eval2 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[1].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
    }, TEACHER_ID);

    db.makeDecision(eval1.id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');

    // Reject second → REJECTED
    db.makeDecision(eval2.id, 'REJECTED', USER_ID, 'Não se adaptou ao ambiente');
    expect(db.getLeadGate(lead.id)).toBe('REJECTED');
  });

  it('single child: approve immediately advances to APPROVED', () => {
    const singleChildLead = db.createLead('Lima', ['Sofia']);
    const visit = db.createEvent({
      leadId: singleChildLead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(singleChildLead.id, 'VISIT_APPROVED', USER_ID);
    const viv = db.createEvent({
      leadId: singleChildLead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(viv.id, 'COMPLETED', USER_ID);

    const evaluation = db.createEvaluation({
      eventId: viv.id, childId: singleChildLead.children[0].id,
      leadId: singleChildLead.id, teacherName: 'Prof. Ana',
      evaluationDate: new Date(), behavior: 'Excelente',
    }, TEACHER_ID);

    db.makeDecision(evaluation.id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(singleChildLead.id)).toBe('APPROVED');
  });

  it('single child: reject immediately advances to REJECTED', () => {
    const singleChildLead = db.createLead('Pereira', ['Gabriel']);
    const visit = db.createEvent({
      leadId: singleChildLead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(singleChildLead.id, 'VISIT_APPROVED', USER_ID);
    const viv = db.createEvent({
      leadId: singleChildLead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(viv.id, 'COMPLETED', USER_ID);

    const evaluation = db.createEvaluation({
      eventId: viv.id, childId: singleChildLead.children[0].id,
      leadId: singleChildLead.id, teacherName: 'Prof. Ana',
      evaluationDate: new Date(),
    }, TEACHER_ID);

    db.makeDecision(evaluation.id, 'REJECTED', USER_ID, 'Não atende critérios');
    expect(db.getLeadGate(singleChildLead.id)).toBe('REJECTED');
  });

  it('decision records metadata (userId, timestamp, notes)', () => {
    const eval1 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[0].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
    }, TEACHER_ID);

    const eval2 = db.createEvaluation({
      eventId: vivenciaEvent.id, childId: lead.children[1].id, leadId: lead.id,
      teacherName: 'Prof. Maria', evaluationDate: new Date(),
    }, TEACHER_ID);

    const before = new Date();
    db.makeDecision(eval1.id, 'APPROVED', USER_ID, 'Boa adaptação');
    db.makeDecision(eval2.id, 'APPROVED', USER_ID);

    expect(eval1.decisionById).toBe(USER_ID);
    expect(eval1.decisionAt).toBeInstanceOf(Date);
    expect(eval1.decisionAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(eval1.decisionNotes).toBe('Boa adaptação');
    expect(eval2.decisionNotes).toBeNull();
  });

  it('non-existent evaluation throws EVALUATION_NOT_FOUND', () => {
    expect(() =>
      db.makeDecision('fake-eval', 'APPROVED', USER_ID)
    ).toThrow('EVALUATION_NOT_FOUND');
  });
});

describe('Evaluations - Three or More Children', () => {
  let db: MockDB;

  it('3 children: all must be decided before gate advances', () => {
    db = new MockDB();
    const lead = db.createLead('Rodrigues', ['Ana', 'Bruno', 'Clara']);

    // Fast-track to EVALUATION_PENDING
    const visit = db.createEvent({
      leadId: lead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);
    const viv = db.createEvent({
      leadId: lead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(viv.id, 'COMPLETED', USER_ID);

    const evals = lead.children.map((child) =>
      db.createEvaluation({
        eventId: viv.id, childId: child.id, leadId: lead.id,
        teacherName: 'Prof. X', evaluationDate: new Date(),
      }, TEACHER_ID)
    );

    // Approve first two — gate should NOT change
    db.makeDecision(evals[0].id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');

    db.makeDecision(evals[1].id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');

    // Approve third — NOW gate should advance to APPROVED
    db.makeDecision(evals[2].id, 'APPROVED', USER_ID);
    expect(db.getLeadGate(lead.id)).toBe('APPROVED');
  });

  it('3 children: one rejection among approvals leads to REJECTED', () => {
    db = new MockDB();
    const lead = db.createLead('Almeida', ['Diana', 'Eduardo', 'Fernanda']);

    const visit = db.createEvent({
      leadId: lead.id, eventType: 'VISIT', title: 'Visita',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(visit.id, 'COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);
    const viv = db.createEvent({
      leadId: lead.id, eventType: 'VIVENCIA', title: 'Vivência',
      startDate: new Date(), endDate: new Date(),
    }, USER_ID);
    db.updateEventStatus(viv.id, 'COMPLETED', USER_ID);

    const evals = lead.children.map((child) =>
      db.createEvaluation({
        eventId: viv.id, childId: child.id, leadId: lead.id,
        teacherName: 'Prof. Y', evaluationDate: new Date(),
      }, TEACHER_ID)
    );

    db.makeDecision(evals[0].id, 'APPROVED', USER_ID);
    db.makeDecision(evals[1].id, 'REJECTED', USER_ID, 'Dificuldade severa');
    // Gate still EVALUATION_PENDING (one eval still pending)
    expect(db.getLeadGate(lead.id)).toBe('EVALUATION_PENDING');

    db.makeDecision(evals[2].id, 'APPROVED', USER_ID);
    // Now all decided, one rejected → REJECTED
    expect(db.getLeadGate(lead.id)).toBe('REJECTED');
  });
});

describe('Gate History Tracking', () => {
  let db: MockDB;

  it('records history entry for every gate transition', () => {
    db = new MockDB();
    const lead = db.createLead('Martins');

    db.transitionGate(lead.id, 'VISIT_SCHEDULED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_COMPLETED', USER_ID);
    db.transitionGate(lead.id, 'VISIT_APPROVED', USER_ID);

    const leadHistory = db.history.filter((h) => h.leadId === lead.id);
    expect(leadHistory).toHaveLength(3);

    expect(leadHistory[0].details).toEqual({
      previousStatus: 'NOT_STARTED',
      newStatus: 'VISIT_SCHEDULED',
    });
    expect(leadHistory[1].details).toEqual({
      previousStatus: 'VISIT_SCHEDULED',
      newStatus: 'VISIT_COMPLETED',
    });
    expect(leadHistory[2].details).toEqual({
      previousStatus: 'VISIT_COMPLETED',
      newStatus: 'VISIT_APPROVED',
    });
  });

  it('cancellation also records history', () => {
    db = new MockDB();
    const lead = db.createLead('Barbosa');

    db.transitionGate(lead.id, 'VISIT_SCHEDULED', USER_ID);
    db.transitionGate(lead.id, 'NOT_STARTED', USER_ID); // cancel

    const leadHistory = db.history.filter((h) => h.leadId === lead.id);
    expect(leadHistory).toHaveLength(2);
    expect(leadHistory[1].details).toEqual({
      previousStatus: 'VISIT_SCHEDULED',
      newStatus: 'NOT_STARTED',
    });
  });
});
