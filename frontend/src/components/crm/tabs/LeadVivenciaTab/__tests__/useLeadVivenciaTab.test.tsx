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
}));

vi.mock('@/hooks/useEvaluations', () => ({
  useLeadEvaluations: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    hasModuleAccess: () => true,
  })),
}));

import {
  useLeadEvents,
  useApproveVisit,
  useRejectLead,
} from '@/hooks/useCrmEvents';
import { useLeadEvaluations } from '@/hooks/useEvaluations';
import { useAuthStore } from '@/stores/authStore';
import { useLeadVivenciaTab } from '../useLeadVivenciaTab';

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
  vi.mocked(useLeadEvents).mockReturnValue({ data: { data: [] }, isLoading: false } as any);
  vi.mocked(useLeadEvaluations).mockReturnValue({ data: { data: [] } } as any);
  vi.mocked(useApproveVisit).mockReturnValue(mutationStub() as any);
  vi.mocked(useRejectLead).mockReturnValue(mutationStub() as any);
  vi.mocked(useAuthStore).mockReturnValue({
    hasModuleAccess: () => true,
  } as any);
});

describe('useLeadVivenciaTab - initial state', () => {
  it('starts with all UI flags closed and createEventType defaulted to VISIT', () => {
    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));
    expect(result.current.ui.showCreateEvent).toBe(false);
    expect(result.current.ui.createEventType).toBe('VISIT');
    expect(result.current.ui.showEvalForm).toBe(false);
    expect(result.current.ui.evalEventId).toBeNull();
    expect(result.current.ui.showCreateEscalation).toBe(false);
  });

  it('reflects auth permissions in canEdit', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      hasModuleAccess: () => false,
    } as any);

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));
    expect(result.current.derived.canEdit).toBe(false);
  });

  it('falls back to NOT_STARTED when admissionGateStatus is missing', () => {
    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));
    expect(result.current.derived.gate).toBe('NOT_STARTED');
  });

  it('exposes events and evaluations from the underlying queries', () => {
    const event: CrmEvent = {
      id: 'event-1',
      leadId: 'lead-1',
      eventType: 'VISIT',
      title: 'Visita',
      startDate: '2026-02-01T00:00:00Z',
    } as unknown as CrmEvent;

    vi.mocked(useLeadEvents).mockReturnValue({
      data: { data: [event] },
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));
    expect(result.current.derived.events).toHaveLength(1);
    expect(result.current.derived.events[0].id).toBe('event-1');
  });
});

describe('useLeadVivenciaTab - schedule handlers', () => {
  it('onScheduleVisit sets createEventType to VISIT and opens the modal', () => {
    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onScheduleVisit();
    });

    expect(result.current.ui.createEventType).toBe('VISIT');
    expect(result.current.ui.showCreateEvent).toBe(true);
  });

  it('onScheduleVivencia sets createEventType to VIVENCIA and opens the modal', () => {
    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onScheduleVivencia();
    });

    expect(result.current.ui.createEventType).toBe('VIVENCIA');
    expect(result.current.ui.showCreateEvent).toBe(true);
  });
});

describe('useLeadVivenciaTab - fill evaluation', () => {
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

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onFillEvaluation();
    });

    expect(result.current.ui.evalEventId).toBe('event-vivencia-1');
    expect(result.current.ui.showEvalForm).toBe(true);
  });

  it('does nothing when there is no completed vivencia event', () => {
    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

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

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

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

describe('useLeadVivenciaTab - mutation callbacks', () => {
  it('onApproveVisit forwards the lead id to the mutation', () => {
    const mutate = vi.fn();
    vi.mocked(useApproveVisit).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onApproveVisit();
    });
    expect(mutate).toHaveBeenCalledWith('lead-1');
  });

  it('onRejectLead forwards the lead id to the mutation', () => {
    const mutate = vi.fn();
    vi.mocked(useRejectLead).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    act(() => {
      result.current.callbacks.onRejectLead();
    });
    expect(mutate).toHaveBeenCalledWith('lead-1');
  });

  it('reflects isPending from underlying mutations', () => {
    vi.mocked(useApproveVisit).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);
    vi.mocked(useRejectLead).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadVivenciaTab({ lead: baseLead }));

    expect(result.current.loading.approve).toBe(true);
    expect(result.current.loading.reject).toBe(false);
  });
});
