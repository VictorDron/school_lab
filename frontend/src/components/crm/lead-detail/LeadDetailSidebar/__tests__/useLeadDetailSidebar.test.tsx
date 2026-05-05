import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Lead } from '@/types/crm';

const mutationStub = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
});

vi.mock('@/hooks/useLeads', () => ({
  useTokenStatus: vi.fn(),
  useEnrollmentTokenStatus: vi.fn(),
  useGenerateApplicationLink: vi.fn(() => mutationStub()),
  useSendApplicationLinkEmail: vi.fn(() => mutationStub()),
  useGenerateEnrollmentLink: vi.fn(() => mutationStub()),
  useSendEnrollmentLinkEmail: vi.fn(() => mutationStub()),
  useUpdateLead: vi.fn(() => mutationStub()),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useTokenStatus,
  useEnrollmentTokenStatus,
  useGenerateApplicationLink,
  useSendApplicationLinkEmail,
  useGenerateEnrollmentLink,
  useSendEnrollmentLinkEmail,
  useUpdateLead,
} from '@/hooks/useLeads';
import toast from 'react-hot-toast';
import { useLeadDetailSidebar } from '../useLeadDetailSidebar';

const baseLead: Lead = {
  id: 'lead-1',
  code: 'L001',
  primaryContactName: 'Maria Silva',
  primaryContactEmail: 'maria@example.com',
  primaryContactPhone: '+5521999999999',
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
  vi.mocked(useTokenStatus).mockReturnValue({ data: undefined } as any);
  vi.mocked(useEnrollmentTokenStatus).mockReturnValue({ data: undefined } as any);
  vi.mocked(useGenerateApplicationLink).mockReturnValue(mutationStub() as any);
  vi.mocked(useSendApplicationLinkEmail).mockReturnValue(mutationStub() as any);
  vi.mocked(useGenerateEnrollmentLink).mockReturnValue(mutationStub() as any);
  vi.mocked(useSendEnrollmentLinkEmail).mockReturnValue(mutationStub() as any);
  vi.mocked(useUpdateLead).mockReturnValue(mutationStub() as any);
});

describe('useLeadDetailSidebar - initial state', () => {
  it('viewingForm starts as null', () => {
    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));
    expect(result.current.ui.viewingForm).toBeNull();
  });

  it('all pending flags start as false', () => {
    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));
    expect(result.current.mutations.generateApplicationLinkPending).toBe(false);
    expect(result.current.mutations.sendApplicationEmailPending).toBe(false);
    expect(result.current.mutations.generateEnrollmentLinkPending).toBe(false);
    expect(result.current.mutations.sendEnrollmentEmailPending).toBe(false);
    expect(result.current.mutations.updateLeadPending).toBe(false);
  });
});

describe('useLeadDetailSidebar - derived values', () => {
  it('computes initials from the primary contact name', () => {
    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));
    expect(result.current.derived.initials).toBe('MS');
  });

  it('builds applicationLink and enrollmentLink when tokens exist', () => {
    const lead = {
      ...baseLead,
      applicationToken: 'app-token',
      enrollmentToken: 'enr-token',
    } as Lead;
    const { result } = renderHook(() => useLeadDetailSidebar({ lead }));
    expect(result.current.derived.applicationLink).toBe(
      'https://app.example.com/admissions/apply?token=app-token'
    );
    expect(result.current.derived.enrollmentLink).toBe(
      'https://app.example.com/enrollment/apply?token=enr-token'
    );
  });

  it('returns null links when tokens are absent', () => {
    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));
    expect(result.current.derived.applicationLink).toBeNull();
    expect(result.current.derived.enrollmentLink).toBeNull();
  });

  it('derives hasSecondaryContact when any secondary field is present', () => {
    const { result: noSecondary } = renderHook(() =>
      useLeadDetailSidebar({ lead: baseLead })
    );
    expect(noSecondary.current.derived.hasSecondaryContact).toBe(false);

    const lead = { ...baseLead, secondaryContactEmail: 'pai@example.com' } as Lead;
    const { result } = renderHook(() => useLeadDetailSidebar({ lead }));
    expect(result.current.derived.hasSecondaryContact).toBe(true);
  });

  it('showEnrollmentSection is true for eligible admission gate statuses', () => {
    const lead = { ...baseLead, admissionGateStatus: 'APPROVED' } as Lead;
    const { result } = renderHook(() => useLeadDetailSidebar({ lead }));
    expect(result.current.derived.showEnrollmentSection).toBe(true);
  });

  it('showEnrollmentSection is false for non-eligible statuses', () => {
    const lead = { ...baseLead, admissionGateStatus: 'NOT_STARTED' } as Lead;
    const { result } = renderHook(() => useLeadDetailSidebar({ lead }));
    expect(result.current.derived.showEnrollmentSection).toBe(false);
  });

  it('exposes tokenStatus and enrollmentStatus from the queries', () => {
    vi.mocked(useTokenStatus).mockReturnValue({
      data: { data: { isExpired: false } },
    } as any);
    vi.mocked(useEnrollmentTokenStatus).mockReturnValue({
      data: { data: { isExpired: true } },
    } as any);

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));
    expect(result.current.derived.tokenStatus).toEqual({ isExpired: false });
    expect(result.current.derived.enrollmentStatus).toEqual({ isExpired: true });
  });
});

describe('useLeadDetailSidebar - setters', () => {
  it('setViewingForm changes the viewing form value', () => {
    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    act(() => {
      result.current.setters.setViewingForm('admission');
    });
    expect(result.current.ui.viewingForm).toBe('admission');

    act(() => {
      result.current.setters.setViewingForm('enrollment');
    });
    expect(result.current.ui.viewingForm).toBe('enrollment');

    act(() => {
      result.current.setters.setViewingForm(null);
    });
    expect(result.current.ui.viewingForm).toBeNull();
  });
});

describe('useLeadDetailSidebar - handlers', () => {
  it('handleCopyLink writes to clipboard and shows a toast', () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleCopyLink('https://example.com/x', 'Link de inscrição');
    });

    expect(writeText).toHaveBeenCalledWith('https://example.com/x');
    expect(toast.success).toHaveBeenCalledWith('Link de inscrição copiado!');
  });

  it('handleNotificationPreferenceChange forwards the chosen value to the mutation', () => {
    const updateMutate = vi.fn();
    vi.mocked(useUpdateLead).mockReturnValue({
      mutate: updateMutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleNotificationPreferenceChange('FATHER');
    });

    expect(updateMutate).toHaveBeenCalledWith({
      id: 'lead-1',
      data: { notificationPreference: 'FATHER' },
    });
  });
});

describe('useLeadDetailSidebar - mutations', () => {
  it('generateApplicationLink calls mutate with the lead id', () => {
    const generateMutate = vi.fn();
    vi.mocked(useGenerateApplicationLink).mockReturnValue({
      mutate: generateMutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    act(() => {
      result.current.mutations.generateApplicationLink();
    });

    expect(generateMutate).toHaveBeenCalledWith('lead-1');
  });

  it('reflects isPending from the underlying mutations', () => {
    vi.mocked(useGenerateApplicationLink).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);
    vi.mocked(useUpdateLead).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    expect(result.current.mutations.generateApplicationLinkPending).toBe(true);
    expect(result.current.mutations.updateLeadPending).toBe(true);
    expect(result.current.mutations.sendApplicationEmailPending).toBe(false);
  });

  it('sendEnrollmentEmail calls mutate with the lead id', () => {
    const sendMutate = vi.fn();
    vi.mocked(useSendEnrollmentLinkEmail).mockReturnValue({
      mutate: sendMutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadDetailSidebar({ lead: baseLead }));

    act(() => {
      result.current.mutations.sendEnrollmentEmail();
    });

    expect(sendMutate).toHaveBeenCalledWith('lead-1');
  });
});
