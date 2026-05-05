import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Lead, LeadChild } from '@/types/crm';

const mutationStub = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
});

vi.mock('@/hooks/useLeads', () => ({
  useAddChild: vi.fn(() => mutationStub()),
  useUpdateChild: vi.fn(() => mutationStub()),
  useDeleteChild: vi.fn(() => mutationStub()),
  useUpdateChildHealth: vi.fn(() => mutationStub()),
  useUpdateChildTransport: vi.fn(() => mutationStub()),
}));

import {
  useAddChild,
  useUpdateChild,
  useDeleteChild,
  useUpdateChildHealth,
  useUpdateChildTransport,
} from '@/hooks/useLeads';
import { useLeadChildrenTab } from '../useLeadChildrenTab';

const baseLead: Lead = {
  id: 'lead-1',
  code: 'L001',
  primaryContactName: 'Maria Silva',
  source: 'WEBSITE',
  numberOfChildren: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  children: [],
  educationHistory: [],
} as unknown as Lead;

const childA: LeadChild = {
  id: 'child-a',
  fullName: 'João Silva',
  dateOfBirth: '2020-05-03T00:00:00.000Z',
  gender: 'M',
  nationality: 'Brazilian',
  desiredGrade: 'G1',
} as unknown as LeadChild;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAddChild).mockReturnValue(mutationStub() as any);
  vi.mocked(useUpdateChild).mockReturnValue(mutationStub() as any);
  vi.mocked(useDeleteChild).mockReturnValue(mutationStub() as any);
  vi.mocked(useUpdateChildHealth).mockReturnValue(mutationStub() as any);
  vi.mocked(useUpdateChildTransport).mockReturnValue(mutationStub() as any);
});

describe('useLeadChildrenTab - initial state', () => {
  it('starts with all UI flags closed and empty form buckets', () => {
    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));
    expect(result.current.ui.showForm).toBe(false);
    expect(result.current.ui.editingChild).toBeNull();
    expect(result.current.ui.deletingId).toBeNull();
    expect(result.current.ui.expandedChildId).toBeNull();
    expect(result.current.ui.editingHealthChildId).toBeNull();
    expect(result.current.ui.editingTransportChildId).toBeNull();
    expect(result.current.ui.healthForm).toEqual({});
    expect(result.current.ui.transportForm).toEqual({});
  });

  it('exposes children and educationHistory from the lead', () => {
    const lead = { ...baseLead, children: [childA] } as Lead;
    const { result } = renderHook(() => useLeadChildrenTab({ lead }));
    expect(result.current.derived.children).toHaveLength(1);
    expect(result.current.derived.children[0].id).toBe('child-a');
  });

  it('falls back to empty arrays when children/educationHistory are missing', () => {
    const lead = { ...baseLead, children: undefined, educationHistory: undefined } as unknown as Lead;
    const { result } = renderHook(() => useLeadChildrenTab({ lead }));
    expect(result.current.derived.children).toEqual([]);
    expect(result.current.derived.educationHistory).toEqual([]);
  });

  it('builds nationality options sorted by pt-BR label', () => {
    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));
    const labels = result.current.derived.nationalityOptions.map((o) => o.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });
});

describe('useLeadChildrenTab - getChildEducationHistory', () => {
  it('filters the education history by childId', () => {
    const lead = {
      ...baseLead,
      educationHistory: [
        { id: 'edu-1', childId: 'child-a', schoolName: 'Escola A' },
        { id: 'edu-2', childId: 'child-b', schoolName: 'Escola B' },
        { id: 'edu-3', childId: 'child-a', schoolName: 'Escola C' },
      ],
    } as unknown as Lead;
    const { result } = renderHook(() => useLeadChildrenTab({ lead }));
    const filtered = result.current.derived.getChildEducationHistory('child-a');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(['edu-1', 'edu-3']);
  });
});

describe('useLeadChildrenTab - handleEdit', () => {
  it('seeds the form with the child fields and opens the form', () => {
    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleEdit(childA);
    });

    expect(result.current.ui.editingChild).toBe(childA);
    expect(result.current.ui.showForm).toBe(true);
    expect(result.current.form.getValues('fullName')).toBe('João Silva');
    expect(result.current.form.getValues('dateOfBirth')).toBe('2020-05-03');
    expect(result.current.form.getValues('gender')).toBe('M');
    expect(result.current.form.getValues('desiredGrade')).toBe('G1');
  });
});

describe('useLeadChildrenTab - onSubmit', () => {
  it('calls the create mutation with leadId + data when no editing target is set', () => {
    const mutate = vi.fn();
    vi.mocked(useAddChild).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));

    const data = { fullName: 'Pedro' } as any;
    act(() => {
      result.current.handlers.onSubmit(data);
    });

    expect(mutate).toHaveBeenCalledWith(
      { leadId: 'lead-1', data },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('calls the update mutation with leadId + childId + data when editing', () => {
    const mutate = vi.fn();
    vi.mocked(useUpdateChild).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleEdit(childA);
    });

    const data = { fullName: 'João Silva Edited' } as any;
    act(() => {
      result.current.handlers.onSubmit(data);
    });

    expect(mutate).toHaveBeenCalledWith(
      { leadId: 'lead-1', childId: 'child-a', data },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});

describe('useLeadChildrenTab - handleDelete', () => {
  it('calls the delete mutation with leadId + childId', () => {
    const mutate = vi.fn();
    vi.mocked(useDeleteChild).mockReturnValue({
      mutate,
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleDelete('child-a');
    });

    expect(mutate).toHaveBeenCalledWith(
      { leadId: 'lead-1', childId: 'child-a' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});

describe('useLeadChildrenTab - handleCancel', () => {
  it('clears editingChild and closes the form panel', () => {
    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));

    act(() => {
      result.current.handlers.handleEdit(childA);
    });
    expect(result.current.ui.showForm).toBe(true);
    expect(result.current.ui.editingChild).toBe(childA);

    act(() => {
      result.current.handlers.handleCancel();
    });

    expect(result.current.ui.showForm).toBe(false);
    expect(result.current.ui.editingChild).toBeNull();
  });
});

describe('useLeadChildrenTab - mutation pending flags', () => {
  it('exposes isPending from underlying mutations on the mutations bucket', () => {
    vi.mocked(useAddChild).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    const { result } = renderHook(() => useLeadChildrenTab({ lead: baseLead }));
    expect(result.current.mutations.add.isPending).toBe(true);
    expect(result.current.mutations.update.isPending).toBe(false);
  });
});
