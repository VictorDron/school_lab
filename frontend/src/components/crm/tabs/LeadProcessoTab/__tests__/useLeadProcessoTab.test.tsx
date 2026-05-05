import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Lead, CrmEvent } from '@/types/crm';

const mutationStub = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
});

vi.mock('@/hooks/useCrmEvents', () => ({
  useLeadEvents: vi.fn(),
  useApproveVisit: vi.fn(() => mutationStub()),
  useRejectLead: vi.fn(() => mutationStub()),
  useUpdateEventStatus: vi.fn(() => mutationStub()),
}));

vi.mock('@/hooks/useEvaluations', () => ({
  useLeadEvaluations: vi.fn(),
}));

vi.mock('@/hooks/useLeads', () => ({
  useGenerateApplicationLink: vi.fn(() => mutationStub()),
  useSendApplicationLinkEmail: vi.fn(() => mutationStub()),
}));

vi.mock('@/hooks/useGateApprovals', () => ({
  useTransitionGate: vi.fn(() => mutationStub()),
  useSubmitApproval: vi.fn(() => mutationStub()),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    hasModuleAccess: () => true,
    user: { role: 'ADMIN' },
  })),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import {
  useLeadEvents,
  useApproveVisit,
  useRejectLead,
} from '@/hooks/useCrmEvents';
import { useLeadEvaluations } from '@/hooks/useEvaluations';
import {
  useGenerateApplicationLink,
  useSendApplicationLinkEmail,
} from '@/hooks/useLeads';
import { useTransitionGate, useSubmitApproval } from '@/hooks/useGateApprovals';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useLeadProcessoTab } from '../useLeadProcessoTab';

const baseLead: Lead = {
  id: 'lead-1',
  code: 'L001',
  primaryContactName: 'Maria Silva',
  primaryContactEmail: 'maria@example.com',
  source: 'WEBSITE',
  numberOfChildren: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as Lead;

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin: 'https://app.example.com' },
  });
  vi.mocked(useLeadEvents).mockReturnValue({ data: { data: [] }, isLoading: false } as any);
  vi.mocked(useLeadEvaluations).mockReturnValue({ data: { data: [] } } as any);
  vi.mocked(useApproveVisit).mockReturnValue(mutationStub() as any);
  vi.mocked(useRejectLead).mockReturnValue(mutationStub() as any);
  vi.mocked(useGenerateApplicationLink).mockReturnValue(mutationStub() as any);
  vi.mocked(useSendApplicationLinkEmail).mockReturnValue(mutationStub() as any);
  vi.mocked(useTransitionGate).mockReturnValue(mutationStub() as any);
  vi.mocked(useSubmitApproval).mockReturnValue(mutationStub() as any);
  vi.mocked(useAuthStore).mockReturnValue({
    hasModuleAccess: () => true,
    user: { role: 'ADMIN' },
  } as any);
});

describe('useLeadProcessoTab - initial state', () => {
  it('starts with all UI flags closed and createEventType defaulted to VISIT', () => {
    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));
    expect(result.current.ui.showCreateEvent).toBe(false);
    expect(result.current.ui.createEventType).toBe('VISIT');
    expect(result.current.ui.showEvalForm).toBe(false);
    expect(result.current.ui.evalEventId).toBeNull();
    expect(result.current.ui.showCreateEscalation).toBe(false);
  });

  it('reflects auth permissions in canEdit and userRole', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      hasModuleAccess: () => false,
      user: { role: 'TEACHER' },
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));
    expect(result.current.derived.canEdit).toBe(false);
    expect(result.current.derived.userRole).toBe('TEACHER');
  });

  it('falls back to NOT_STARTED when admissionGateStatus is missing', () => {
    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));
    expect(result.current.derived.gate).toBe('NOT_STARTED');
  });
});

describe('useLeadProcessoTab - schedule handlers', () => {
  it('onScheduleVisit sets createEventType to VISIT and opens the modal', () => {
    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onScheduleVisit();
    });

    expect(result.current.ui.createEventType).toBe('VISIT');
    expect(result.current.ui.showCreateEvent).toBe(true);
  });

  it('onScheduleVivencia sets createEventType to VIVENCIA and opens the modal', () => {
    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onScheduleVivencia();
    });

    expect(result.current.ui.createEventType).toBe('VIVENCIA');
    expect(result.current.ui.showCreateEvent).toBe(true);
  });
});

describe('useLeadProcessoTab - fill evaluation', () => {
  it('opens the form pinned to the latest completed vivencia event', () => {
    const completedVivencia: CrmEvent = {
      id: 'event-vivencia-1',
      leadId: 'lead-1',
      eventType: 'VIVENCIA',
      vivenciaStatus: 'COMPLETED',
      title: 'Vivência',
      startDate: '2026-02-01T00:00:00Z',
    } as unknown as CrmEvent;
    vi.mocked(useLeadEvents).mockReturnValue({
      data: { data: [completedVivencia] },
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onFillEvaluation();
    });

    expect(result.current.ui.evalEventId).toBe('event-vivencia-1');
    expect(result.current.ui.showEvalForm).toBe(true);
  });

  it('does nothing when there is no completed vivencia event', () => {
    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onFillEvaluation();
    });

    expect(result.current.ui.evalEventId).toBeNull();
    expect(result.current.ui.showEvalForm).toBe(false);
  });

  it('handleCloseEvalForm resets eval state', () => {
    const completedVivencia: CrmEvent = {
      id: 'event-vivencia-1',
      leadId: 'lead-1',
      eventType: 'VIVENCIA',
      vivenciaStatus: 'COMPLETED',
      title: 'Vivência',
      startDate: '2026-02-01T00:00:00Z',
    } as unknown as CrmEvent;
    vi.mocked(useLeadEvents).mockReturnValue({
      data: { data: [completedVivencia] },
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onFillEvaluation();
    });
    expect(result.current.ui.showEvalForm).toBe(true);

    act(() => {
      result.current.handlers.handleCloseEvalForm();
    });
    expect(result.current.ui.showEvalForm).toBe(false);
    expect(result.current.ui.evalEventId).toBeNull();
  });
});

describe('useLeadProcessoTab - copy link', () => {
  it('writes the application link to clipboard and shows a toast when token exists', () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const lead = { ...baseLead, applicationToken: 'app-token' } as Lead;
    const { result } = renderHook(() => useLeadProcessoTab({ lead }));

    act(() => {
      result.current.callbacks.onCopyLink();
    });

    expect(writeText).toHaveBeenCalledWith(
      'https://app.example.com/admissions/apply?token=app-token'
    );
    expect(toast.success).toHaveBeenCalledWith('Link de inscrição copiado!');
  });

  it('does nothing when there is no application token', () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onCopyLink();
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('useLeadProcessoTab - mutation callbacks', () => {
  it('onApproveVisit forwards the lead id to the mutation', () => {
    const mutate = vi.fn();
    vi.mocked(useApproveVisit).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onApproveVisit();
    });
    expect(mutate).toHaveBeenCalledWith('lead-1');
  });

  it('onDeptApprove builds the approval payload', () => {
    const mutate = vi.fn();
    vi.mocked(useSubmitApproval).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onDeptApprove('FORM_APPROVED', 'ADMISSIONS');
    });

    expect(mutate).toHaveBeenCalledWith({
      leadId: 'lead-1',
      gateStep: 'FORM_APPROVED',
      department: 'ADMISSIONS',
      decision: 'APPROVED',
    });
  });

  it('onDeptReject builds the rejection payload', () => {
    const mutate = vi.fn();
    vi.mocked(useSubmitApproval).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onDeptReject('VISIT_APPROVED', 'ADMISSIONS');
    });

    expect(mutate).toHaveBeenCalledWith({
      leadId: 'lead-1',
      gateStep: 'VISIT_APPROVED',
      department: 'ADMISSIONS',
      decision: 'REJECTED',
    });
  });

  it('reflects isPending from underlying mutations', () => {
    vi.mocked(useGenerateApplicationLink).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);
    vi.mocked(useSubmitApproval).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    const { result } = renderHook(() => useLeadProcessoTab({ lead: baseLead }));

    expect(result.current.loading.generateLink).toBe(true);
    expect(result.current.loading.deptApproval).toBe(true);
    expect(result.current.loading.sendEmail).toBe(false);
  });
});
