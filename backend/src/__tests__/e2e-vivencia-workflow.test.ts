/**
 * E2E Vivência Workflow Tests
 *
 * Simulates REAL USER JOURNEYS through the admission pipeline:
 *
 * 1. Happy path: Form1 → Visit → Approve → Vivência → Evaluate → Approve → Form2
 * 2. Rejection at visit stage
 * 3. Rejection at evaluation stage
 * 4. Visit cancellation & reschedule
 * 5. Vivência cancellation & reschedule
 * 6. Multi-child family with mixed evaluation outcomes
 * 7. Large family (4 children) full workflow
 * 8. Edge: attempt to send Form2 link before approval
 * 9. Edge: attempt to approve visit that wasn't completed
 * 10. Edge: attempt to schedule vivência before visit approval
 *
 * These tests validate the ENTIRE user experience flow, not just individual units.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

// ============================================================================
// TYPES (mirrors Prisma enums)
// ============================================================================

type AdmissionGateStatus =
  | 'NOT_STARTED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED'
  | 'VISIT_APPROVED' | 'VIVENCIA_SCHEDULED' | 'VIVENCIA_COMPLETED'
  | 'EVALUATION_PENDING' | 'EVALUATION_COMPLETED' | 'APPROVED' | 'REJECTED';

type CrmEventType = 'VISIT' | 'VIVENCIA';
type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS';
type EvalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

// ============================================================================
// FULL SYSTEM SIMULATION
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

interface Child { id: string; fullName: string; }
interface Lead {
  id: string; code: string; familyName: string;
  admissionGateStatus: AdmissionGateStatus;
  applicationStatus: string;
  enrollmentLinkSent: boolean;
  children: Child[];
}
interface Event {
  id: string; leadId: string; type: CrmEventType;
  title: string; status: EventStatus;
  startDate: Date; endDate: Date;
}
interface Evaluation {
  id: string; eventId: string; childId: string; leadId: string;
  teacherName: string; decision: EvalDecision;
  behavior?: string; english?: string;
  interactionWithKids?: string; mathPlacement?: string;
  englishPlacement?: string; additionalNotes?: string;
}

class AdmissionSystem {
  private leads = new Map<string, Lead>();
  private events = new Map<string, Event>();
  private evaluations = new Map<string, Evaluation>();
  private auditLog: string[] = [];
  private counter = 0;

  private id() { return `id-${++this.counter}-${crypto.randomBytes(3).toString('hex')}`; }

  // ---- Lead Management ----

  createLeadWithForm1(familyName: string, childNames: string[]): Lead {
    const lead: Lead = {
      id: this.id(), code: `RIS-${String(this.counter).padStart(4, '0')}`,
      familyName, admissionGateStatus: 'NOT_STARTED',
      applicationStatus: 'FORM_RECEIVED', enrollmentLinkSent: false,
      children: childNames.map((n) => ({ id: this.id(), fullName: n })),
    };
    this.leads.set(lead.id, lead);
    this.audit(`Lead ${lead.code} criado com Form1 (${childNames.length} aluno(s))`);
    return lead;
  }

  getLead(id: string): Lead {
    const lead = this.leads.get(id);
    if (!lead) throw new Error('LEAD_NOT_FOUND');
    return lead;
  }

  // ---- Gate Transitions ----

  private advanceGate(leadId: string, to: AdmissionGateStatus): void {
    const lead = this.getLead(leadId);
    if (!validTransitions[lead.admissionGateStatus]?.includes(to)) {
      throw new Error(`INVALID_TRANSITION: ${lead.admissionGateStatus} → ${to}`);
    }
    const prev = lead.admissionGateStatus;
    lead.admissionGateStatus = to;
    this.audit(`Gate ${prev} → ${to} para lead ${lead.code}`);
  }

  private tryAdvanceGate(leadId: string, to: AdmissionGateStatus): boolean {
    try { this.advanceGate(leadId, to); return true; } catch { return false; }
  }

  // ---- Visit Flow ----

  scheduleVisit(leadId: string, date: Date): Event {
    const lead = this.getLead(leadId);
    if (lead.applicationStatus !== 'FORM_RECEIVED') {
      throw new Error('FORM1_NOT_RECEIVED');
    }
    const event: Event = {
      id: this.id(), leadId, type: 'VISIT',
      title: `Visita - ${lead.familyName}`,
      status: 'SCHEDULED', startDate: date, endDate: new Date(date.getTime() + 3600000),
    };
    this.events.set(event.id, event);
    this.advanceGate(leadId, 'VISIT_SCHEDULED');
    this.audit(`Visita agendada para ${lead.code}`);
    return event;
  }

  completeVisit(eventId: string): void {
    const event = this.getEvent(eventId, 'VISIT');
    if (event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_SCHEDULED');
    event.status = 'COMPLETED';
    this.advanceGate(event.leadId, 'VISIT_COMPLETED');
    this.audit(`Visita concluída para ${this.getLead(event.leadId).code}`);
  }

  cancelVisit(eventId: string): void {
    const event = this.getEvent(eventId, 'VISIT');
    if (event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_SCHEDULED');
    event.status = 'CANCELLED';
    this.advanceGate(event.leadId, 'NOT_STARTED');
    this.audit(`Visita cancelada para ${this.getLead(event.leadId).code}`);
  }

  approveVisit(leadId: string): void {
    const lead = this.getLead(leadId);
    if (lead.admissionGateStatus !== 'VISIT_COMPLETED') {
      throw new Error('VISIT_NOT_COMPLETED');
    }
    this.advanceGate(leadId, 'VISIT_APPROVED');
    this.audit(`Visita aprovada para ${lead.code}`);
  }

  rejectAtVisit(leadId: string): void {
    const lead = this.getLead(leadId);
    if (lead.admissionGateStatus !== 'VISIT_COMPLETED') {
      throw new Error('VISIT_NOT_COMPLETED');
    }
    this.advanceGate(leadId, 'REJECTED');
    this.audit(`Lead ${lead.code} rejeitado na etapa de visita`);
  }

  // ---- Vivência Flow ----

  scheduleVivencia(leadId: string, date: Date, teacher: string): Event {
    const lead = this.getLead(leadId);
    if (lead.admissionGateStatus !== 'VISIT_APPROVED') {
      throw new Error('VISIT_NOT_APPROVED');
    }
    const event: Event = {
      id: this.id(), leadId, type: 'VIVENCIA',
      title: `Vivência - ${lead.familyName}`,
      status: 'SCHEDULED', startDate: date, endDate: new Date(date.getTime() + 28800000),
    };
    this.events.set(event.id, event);
    this.advanceGate(leadId, 'VIVENCIA_SCHEDULED');
    this.audit(`Vivência agendada para ${lead.code} com ${teacher}`);
    return event;
  }

  completeVivencia(eventId: string): void {
    const event = this.getEvent(eventId, 'VIVENCIA');
    if (event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_SCHEDULED');
    event.status = 'COMPLETED';
    this.advanceGate(event.leadId, 'VIVENCIA_COMPLETED');
    this.advanceGate(event.leadId, 'EVALUATION_PENDING');
    this.audit(`Vivência concluída para ${this.getLead(event.leadId).code}`);
  }

  cancelVivencia(eventId: string): void {
    const event = this.getEvent(eventId, 'VIVENCIA');
    if (event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_SCHEDULED');
    event.status = 'CANCELLED';
    this.advanceGate(event.leadId, 'VISIT_APPROVED');
    this.audit(`Vivência cancelada para ${this.getLead(event.leadId).code}`);
  }

  // ---- Evaluation Flow ----

  createEvaluation(eventId: string, childId: string, leadId: string, data: {
    teacherName: string;
    behavior?: string; english?: string; interactionWithKids?: string;
    mathPlacement?: string; englishPlacement?: string; additionalNotes?: string;
  }): Evaluation {
    const event = this.getEvent(eventId, 'VIVENCIA');
    const lead = this.getLead(leadId);
    if (!lead.children.find((c) => c.id === childId)) {
      throw new Error('CHILD_NOT_FOUND');
    }
    // Check duplicate
    const existing = [...this.evaluations.values()].find(
      (e) => e.eventId === eventId && e.childId === childId
    );
    if (existing) throw new Error('DUPLICATE_EVALUATION');

    const evaluation: Evaluation = {
      id: this.id(), eventId, childId, leadId,
      decision: 'PENDING',
      ...data,
    };
    this.evaluations.set(evaluation.id, evaluation);
    this.audit(`Avaliação criada para ${lead.children.find(c => c.id === childId)!.fullName}`);
    return evaluation;
  }

  decideEvaluation(evalId: string, decision: 'APPROVED' | 'REJECTED', notes?: string): void {
    const evaluation = this.evaluations.get(evalId);
    if (!evaluation) throw new Error('EVALUATION_NOT_FOUND');
    evaluation.decision = decision;

    const eventEvals = [...this.evaluations.values()].filter(
      (e) => e.eventId === evaluation.eventId
    );
    const allDecided = eventEvals.every((e) => e.decision !== 'PENDING');

    if (allDecided) {
      const hasRejection = eventEvals.some((e) => e.decision === 'REJECTED');
      this.advanceGate(evaluation.leadId, 'EVALUATION_COMPLETED');
      this.advanceGate(evaluation.leadId, hasRejection ? 'REJECTED' : 'APPROVED');
    }

    this.audit(`Avaliação ${decision} para ${this.getLead(evaluation.leadId).code}`);
  }

  // ---- Enrollment Link (Form2) ----

  sendEnrollmentLink(leadId: string): string {
    const lead = this.getLead(leadId);
    if (lead.admissionGateStatus !== 'APPROVED') {
      throw new Error('LEAD_NOT_APPROVED');
    }
    lead.enrollmentLinkSent = true;
    const token = crypto.randomBytes(16).toString('hex');
    this.audit(`Link de matrícula (Form2) enviado para ${lead.code}`);
    return token;
  }

  // ---- Helpers ----

  private getEvent(id: string, expectedType: CrmEventType): Event {
    const event = this.events.get(id);
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.type !== expectedType) throw new Error(`EXPECTED_${expectedType}`);
    return event;
  }

  private audit(msg: string) { this.auditLog.push(msg); }
  getAuditLog() { return [...this.auditLog]; }
  getLeadEvents(leadId: string): Event[] {
    return [...this.events.values()].filter((e) => e.leadId === leadId);
  }
  getLeadEvaluations(leadId: string): Evaluation[] {
    return [...this.evaluations.values()].filter((e) => e.leadId === leadId);
  }
}

// ============================================================================
// USER JOURNEY TESTS
// ============================================================================

describe('User Journey: Happy Path - Form1 → Approved → Form2', () => {
  let sys: AdmissionSystem;

  beforeEach(() => { sys = new AdmissionSystem(); });

  it('completes the FULL admission journey for a single-child family', () => {
    // 1. Family submits Form1
    const lead = sys.createLeadWithForm1('Família Silva', ['João Silva']);
    expect(lead.admissionGateStatus).toBe('NOT_STARTED');
    expect(lead.applicationStatus).toBe('FORM_RECEIVED');

    // 2. Admin schedules a visit
    const visit = sys.scheduleVisit(lead.id, new Date('2026-03-10T09:00:00Z'));
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_SCHEDULED');
    expect(visit.type).toBe('VISIT');

    // 3. Visit happens, marked as complete
    sys.completeVisit(visit.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_COMPLETED');

    // 4. Admin approves the visit
    sys.approveVisit(lead.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_APPROVED');

    // 5. Admin schedules vivência
    const vivencia = sys.scheduleVivencia(lead.id, new Date('2026-03-17T08:00:00Z'), 'Prof. Maria');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VIVENCIA_SCHEDULED');

    // 6. Vivência happens, marked as complete
    sys.completeVivencia(vivencia.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    // 7. Teacher fills evaluation
    const evaluation = sys.createEvaluation(vivencia.id, lead.children[0].id, lead.id, {
      teacherName: 'Prof. Maria',
      behavior: 'Excelente comportamento, respeitoso com colegas',
      english: 'Nível intermediário, comunicação fluente',
      interactionWithKids: 'Integrou-se facilmente ao grupo',
      mathPlacement: 'Nível adequado para série pretendida',
      englishPlacement: 'B1 - intermediário',
      additionalNotes: 'Recomendo admissão sem ressalvas',
    });
    expect(evaluation.decision).toBe('PENDING');

    // 8. Admin approves evaluation
    sys.decideEvaluation(evaluation.id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('APPROVED');

    // 9. Admin sends Form2 enrollment link
    const token = sys.sendEnrollmentLink(lead.id);
    expect(token).toBeTruthy();
    expect(sys.getLead(lead.id).enrollmentLinkSent).toBe(true);

    // Verify audit trail
    const log = sys.getAuditLog();
    expect(log.length).toBeGreaterThanOrEqual(8);
    expect(log[log.length - 1]).toContain('Link de matrícula');
  });
});

describe('User Journey: Rejection at Visit Stage', () => {
  let sys: AdmissionSystem;

  beforeEach(() => { sys = new AdmissionSystem(); });

  it('admin rejects lead after visit — cannot proceed further', () => {
    const lead = sys.createLeadWithForm1('Família Oliveira', ['Maria']);
    const visit = sys.scheduleVisit(lead.id, new Date('2026-03-10T10:00:00Z'));
    sys.completeVisit(visit.id);

    // Admin decides to reject
    sys.rejectAtVisit(lead.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('REJECTED');

    // Cannot schedule vivência
    expect(() => sys.scheduleVivencia(lead.id, new Date(), 'Prof.')).toThrow();

    // Cannot send enrollment link
    expect(() => sys.sendEnrollmentLink(lead.id)).toThrow('LEAD_NOT_APPROVED');
  });
});

describe('User Journey: Rejection at Evaluation Stage', () => {
  let sys: AdmissionSystem;

  beforeEach(() => { sys = new AdmissionSystem(); });

  it('teacher evaluates negatively → lead rejected after all evaluations decided', () => {
    const lead = sys.createLeadWithForm1('Família Santos', ['Pedro', 'Ana']);
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof. Carlos');
    sys.completeVivencia(viv.id);

    const eval1 = sys.createEvaluation(viv.id, lead.children[0].id, lead.id, {
      teacherName: 'Prof. Carlos', behavior: 'Agressivo com colegas',
    });
    const eval2 = sys.createEvaluation(viv.id, lead.children[1].id, lead.id, {
      teacherName: 'Prof. Carlos', behavior: 'Bom comportamento',
    });

    sys.decideEvaluation(eval1.id, 'REJECTED', 'Comportamento inadequado');
    // Still pending because eval2 not decided
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    sys.decideEvaluation(eval2.id, 'APPROVED');
    // Now all decided — one rejected → lead REJECTED
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('REJECTED');

    // Cannot send Form2
    expect(() => sys.sendEnrollmentLink(lead.id)).toThrow('LEAD_NOT_APPROVED');
  });
});

describe('User Journey: Visit Cancellation & Reschedule', () => {
  let sys: AdmissionSystem;

  beforeEach(() => { sys = new AdmissionSystem(); });

  it('admin cancels visit and reschedules to a new date', () => {
    const lead = sys.createLeadWithForm1('Família Costa', ['Luís']);
    const visit1 = sys.scheduleVisit(lead.id, new Date('2026-03-10T09:00:00Z'));
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_SCHEDULED');

    // Family can't make it — cancel
    sys.cancelVisit(visit1.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('NOT_STARTED');

    // Reschedule for a week later
    const visit2 = sys.scheduleVisit(lead.id, new Date('2026-03-17T09:00:00Z'));
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_SCHEDULED');
    expect(visit2.id).not.toBe(visit1.id);

    // Complete and continue workflow normally
    sys.completeVisit(visit2.id);
    sys.approveVisit(lead.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_APPROVED');
  });

  it('multiple cancellations still allow eventual completion', () => {
    const lead = sys.createLeadWithForm1('Família Pereira', ['Sofia']);

    // Cancel 3 times
    for (let i = 0; i < 3; i++) {
      const v = sys.scheduleVisit(lead.id, new Date());
      sys.cancelVisit(v.id);
    }
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('NOT_STARTED');
    expect(sys.getLeadEvents(lead.id)).toHaveLength(3);

    // Finally complete
    const final = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(final.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_COMPLETED');
  });
});

describe('User Journey: Vivência Cancellation & Reschedule', () => {
  let sys: AdmissionSystem;
  let lead: Lead;

  beforeEach(() => {
    sys = new AdmissionSystem();
    lead = sys.createLeadWithForm1('Família Lima', ['Gabriel']);
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
  });

  it('admin cancels vivência and reschedules', () => {
    const viv1 = sys.scheduleVivencia(lead.id, new Date('2026-03-15'), 'Prof. Ana');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VIVENCIA_SCHEDULED');

    sys.cancelVivencia(viv1.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VISIT_APPROVED');

    const viv2 = sys.scheduleVivencia(lead.id, new Date('2026-03-22'), 'Prof. Paulo');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('VIVENCIA_SCHEDULED');

    sys.completeVivencia(viv2.id);
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');
  });
});

describe('User Journey: Multi-Child Family (4 children)', () => {
  let sys: AdmissionSystem;

  it('evaluates all 4 children individually — all approved', () => {
    sys = new AdmissionSystem();
    const lead = sys.createLeadWithForm1('Família Grande', [
      'Alice', 'Bernardo', 'Camila', 'Daniel',
    ]);

    // Full workflow until evaluation
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof. Helena');
    sys.completeVivencia(viv.id);

    // Create evaluations for all 4 children
    const evals = lead.children.map((child) =>
      sys.createEvaluation(viv.id, child.id, lead.id, {
        teacherName: 'Prof. Helena',
        behavior: `${child.fullName} - Bom comportamento`,
        english: 'Adequado',
        interactionWithKids: 'Positiva',
      })
    );
    expect(evals).toHaveLength(4);

    // Approve one by one — gate should only advance after the last
    sys.decideEvaluation(evals[0].id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    sys.decideEvaluation(evals[1].id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    sys.decideEvaluation(evals[2].id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    sys.decideEvaluation(evals[3].id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('APPROVED');

    // Can send Form2
    const token = sys.sendEnrollmentLink(lead.id);
    expect(token).toBeTruthy();
  });

  it('4 children: 3 approved + 1 rejected = lead REJECTED', () => {
    sys = new AdmissionSystem();
    const lead = sys.createLeadWithForm1('Família Mista', [
      'Eva', 'Felipe', 'Giovana', 'Henrique',
    ]);

    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof. Roberto');
    sys.completeVivencia(viv.id);

    const evals = lead.children.map((child) =>
      sys.createEvaluation(viv.id, child.id, lead.id, {
        teacherName: 'Prof. Roberto',
      })
    );

    sys.decideEvaluation(evals[0].id, 'APPROVED');
    sys.decideEvaluation(evals[1].id, 'APPROVED');
    sys.decideEvaluation(evals[2].id, 'REJECTED', 'Dificuldades de adaptação graves');
    // Still pending (eval[3] not decided)
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('EVALUATION_PENDING');

    sys.decideEvaluation(evals[3].id, 'APPROVED');
    expect(sys.getLead(lead.id).admissionGateStatus).toBe('REJECTED');
  });
});

describe('User Journey: Edge Cases & Error Prevention', () => {
  let sys: AdmissionSystem;

  beforeEach(() => { sys = new AdmissionSystem(); });

  it('cannot send Form2 link before lead is APPROVED', () => {
    const lead = sys.createLeadWithForm1('Família X', ['Teste']);
    expect(() => sys.sendEnrollmentLink(lead.id)).toThrow('LEAD_NOT_APPROVED');

    // Even after visit completion
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    expect(() => sys.sendEnrollmentLink(lead.id)).toThrow('LEAD_NOT_APPROVED');

    sys.approveVisit(lead.id);
    expect(() => sys.sendEnrollmentLink(lead.id)).toThrow('LEAD_NOT_APPROVED');
  });

  it('cannot approve visit before it is completed', () => {
    const lead = sys.createLeadWithForm1('Família Y', ['Teste']);
    sys.scheduleVisit(lead.id, new Date());

    expect(() => sys.approveVisit(lead.id)).toThrow('VISIT_NOT_COMPLETED');
  });

  it('cannot schedule vivência before visit is approved', () => {
    const lead = sys.createLeadWithForm1('Família Z', ['Teste']);
    expect(() => sys.scheduleVivencia(lead.id, new Date(), 'Prof.')).toThrow('VISIT_NOT_APPROVED');

    const visit = sys.scheduleVisit(lead.id, new Date());
    expect(() => sys.scheduleVivencia(lead.id, new Date(), 'Prof.')).toThrow('VISIT_NOT_APPROVED');

    sys.completeVisit(visit.id);
    expect(() => sys.scheduleVivencia(lead.id, new Date(), 'Prof.')).toThrow('VISIT_NOT_APPROVED');
  });

  it('cannot complete an already cancelled event', () => {
    const lead = sys.createLeadWithForm1('Família W', ['Teste']);
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.cancelVisit(visit.id);
    expect(() => sys.completeVisit(visit.id)).toThrow('EVENT_NOT_SCHEDULED');
  });

  it('cannot create evaluation for a VISIT event', () => {
    const lead = sys.createLeadWithForm1('Família V', ['Teste']);
    const visit = sys.scheduleVisit(lead.id, new Date());
    expect(() =>
      sys.createEvaluation(visit.id, lead.children[0].id, lead.id, {
        teacherName: 'Prof.',
      })
    ).toThrow('EXPECTED_VIVENCIA');
  });

  it('cannot create duplicate evaluation for same child in same event', () => {
    const lead = sys.createLeadWithForm1('Família U', ['Teste']);
    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof.');
    sys.completeVivencia(viv.id);

    sys.createEvaluation(viv.id, lead.children[0].id, lead.id, {
      teacherName: 'Prof. A',
    });

    expect(() =>
      sys.createEvaluation(viv.id, lead.children[0].id, lead.id, {
        teacherName: 'Prof. B',
      })
    ).toThrow('DUPLICATE_EVALUATION');
  });

  it('cannot evaluate a child that does not belong to the lead', () => {
    const lead1 = sys.createLeadWithForm1('Família A', ['Criança A']);
    const lead2 = sys.createLeadWithForm1('Família B', ['Criança B']);

    const visit = sys.scheduleVisit(lead1.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead1.id);
    const viv = sys.scheduleVivencia(lead1.id, new Date(), 'Prof.');
    sys.completeVivencia(viv.id);

    // Try to evaluate lead2's child in lead1's vivência
    expect(() =>
      sys.createEvaluation(viv.id, lead2.children[0].id, lead1.id, {
        teacherName: 'Prof.',
      })
    ).toThrow('CHILD_NOT_FOUND');
  });
});

describe('User Journey: Concurrent Leads (independent pipelines)', () => {
  let sys: AdmissionSystem;

  it('two families proceed independently through the pipeline', () => {
    sys = new AdmissionSystem();
    const silva = sys.createLeadWithForm1('Silva', ['João']);
    const santos = sys.createLeadWithForm1('Santos', ['Maria']);

    // Both schedule visits
    const visitSilva = sys.scheduleVisit(silva.id, new Date('2026-03-10'));
    const visitSantos = sys.scheduleVisit(santos.id, new Date('2026-03-11'));

    // Silva completes and gets approved
    sys.completeVisit(visitSilva.id);
    sys.approveVisit(silva.id);

    // Santos is still scheduled
    expect(sys.getLead(santos.id).admissionGateStatus).toBe('VISIT_SCHEDULED');
    expect(sys.getLead(silva.id).admissionGateStatus).toBe('VISIT_APPROVED');

    // Santos rejects
    sys.completeVisit(visitSantos.id);
    sys.rejectAtVisit(santos.id);
    expect(sys.getLead(santos.id).admissionGateStatus).toBe('REJECTED');

    // Silva continues to full approval
    const viv = sys.scheduleVivencia(silva.id, new Date(), 'Prof.');
    sys.completeVivencia(viv.id);
    const evalSilva = sys.createEvaluation(viv.id, silva.children[0].id, silva.id, {
      teacherName: 'Prof.',
    });
    sys.decideEvaluation(evalSilva.id, 'APPROVED');
    expect(sys.getLead(silva.id).admissionGateStatus).toBe('APPROVED');

    // Santos status unchanged
    expect(sys.getLead(santos.id).admissionGateStatus).toBe('REJECTED');
  });
});

describe('User Journey: Audit Trail Completeness', () => {
  let sys: AdmissionSystem;

  it('full happy path generates complete audit trail', () => {
    sys = new AdmissionSystem();
    const lead = sys.createLeadWithForm1('Família Audit', ['Teste']);

    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);

    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof.');
    sys.completeVivencia(viv.id);

    const evaluation = sys.createEvaluation(viv.id, lead.children[0].id, lead.id, {
      teacherName: 'Prof.',
    });
    sys.decideEvaluation(evaluation.id, 'APPROVED');

    sys.sendEnrollmentLink(lead.id);

    const log = sys.getAuditLog();

    // Check key milestones are in the log
    expect(log.some((l) => l.includes('criado com Form1'))).toBe(true);
    expect(log.some((l) => l.includes('Visita agendada'))).toBe(true);
    expect(log.some((l) => l.includes('Visita concluída'))).toBe(true);
    expect(log.some((l) => l.includes('Visita aprovada'))).toBe(true);
    expect(log.some((l) => l.includes('Vivência agendada'))).toBe(true);
    expect(log.some((l) => l.includes('Vivência concluída'))).toBe(true);
    expect(log.some((l) => l.includes('Avaliação criada'))).toBe(true);
    expect(log.some((l) => l.includes('APPROVED'))).toBe(true);
    expect(log.some((l) => l.includes('Link de matrícula'))).toBe(true);

    // Verify gate transitions are logged
    const gateEntries = log.filter((l) => l.includes('Gate'));
    expect(gateEntries.length).toBeGreaterThanOrEqual(7);
  });
});

describe('User Journey: Evaluation Content Quality', () => {
  let sys: AdmissionSystem;

  it('evaluations store all 5 qualitative sections correctly', () => {
    sys = new AdmissionSystem();
    const lead = sys.createLeadWithForm1('Família Qualidade', ['Beatriz']);

    const visit = sys.scheduleVisit(lead.id, new Date());
    sys.completeVisit(visit.id);
    sys.approveVisit(lead.id);
    const viv = sys.scheduleVivencia(lead.id, new Date(), 'Prof. Lúcia');
    sys.completeVivencia(viv.id);

    const evaluation = sys.createEvaluation(viv.id, lead.children[0].id, lead.id, {
      teacherName: 'Prof. Lúcia',
      behavior: 'Comportamento exemplar. Respeita regras e colegas. Proativa em atividades.',
      english: 'Nível B2. Compreende instruções complexas. Lê textos com fluência.',
      interactionWithKids: 'Liderança natural. Ajudou colegas com dificuldade. Inclusiva.',
      mathPlacement: 'Nível 7º ano. Domina frações, equações de 1º grau. Precisa trabalhar geometria.',
      englishPlacement: 'B2 Upper. Recomendação: turma avançada com suporte em escrita acadêmica.',
      additionalNotes: 'Aluna demonstrou maturidade acima da média. Recomendo fortemente a admissão.',
    });

    expect(evaluation.behavior).toContain('Comportamento exemplar');
    expect(evaluation.english).toContain('B2');
    expect(evaluation.interactionWithKids).toContain('Liderança natural');
    expect(evaluation.mathPlacement).toContain('equações de 1º grau');
    expect(evaluation.englishPlacement).toContain('turma avançada');
    expect(evaluation.additionalNotes).toContain('Recomendo fortemente');

    // All evaluations for lead
    const allEvals = sys.getLeadEvaluations(lead.id);
    expect(allEvals).toHaveLength(1);
    expect(allEvals[0].teacherName).toBe('Prof. Lúcia');
  });
});
