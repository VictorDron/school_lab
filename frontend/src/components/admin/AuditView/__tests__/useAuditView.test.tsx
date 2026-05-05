import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  get: vi.fn(),
}));

import { get } from '@/lib/api';
import { useAuditView } from '../useAuditView';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.mocked(get).mockResolvedValue({ data: [] } as any);
});

describe('useAuditView - initial state', () => {
  it('starts with default filter values', () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.limit).toBe(25);
    expect(result.current.filters.searchQuery).toBe('');
    expect(result.current.filters.selectedUser).toBe('');
    expect(result.current.filters.selectedCategory).toBe('');
    expect(result.current.filters.selectedAction).toBe('');
    expect(result.current.filters.selectedEntityType).toBe('');
    expect(result.current.filters.selectedDateRange).toBe('last7');
    expect(result.current.filters.customStartDate).toBe('');
    expect(result.current.filters.customEndDate).toBe('');
    expect(result.current.filters.showFilters).toBe(true);
    expect(result.current.filters.selectedLog).toBeNull();
  });

  it('reports activeFiltersCount as 0 when no filter is set', () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });
    expect(result.current.derived.activeFiltersCount).toBe(0);
  });
});

describe('useAuditView - clearFilters', () => {
  it('resets all filters and brings selectedDateRange back to last7', async () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });

    act(() => {
      result.current.setters.setSearchQuery('alice');
      result.current.setters.setSelectedUser('user-1');
      result.current.setters.setSelectedCategory('AUTH');
      result.current.setters.setSelectedAction('LOGIN_SUCCESS');
      result.current.setters.setSelectedEntityType('User');
      result.current.setters.setSelectedDateRange('last30');
      result.current.setters.setCustomStartDate('2026-01-01');
      result.current.setters.setCustomEndDate('2026-01-31');
      result.current.setters.setPage(7);
    });

    expect(result.current.filters.selectedUser).toBe('user-1');
    expect(result.current.filters.selectedDateRange).toBe('last30');

    act(() => {
      result.current.handlers.clearFilters();
    });

    expect(result.current.filters.searchQuery).toBe('');
    expect(result.current.filters.selectedUser).toBe('');
    expect(result.current.filters.selectedCategory).toBe('');
    expect(result.current.filters.selectedAction).toBe('');
    expect(result.current.filters.selectedEntityType).toBe('');
    expect(result.current.filters.selectedDateRange).toBe('last7');
    expect(result.current.filters.customStartDate).toBe('');
    expect(result.current.filters.customEndDate).toBe('');
    expect(result.current.filters.page).toBe(1);
  });
});

describe('useAuditView - page reset on filter change', () => {
  it('resets page to 1 when a filter changes', async () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });

    act(() => {
      result.current.setters.setPage(5);
    });
    expect(result.current.filters.page).toBe(5);

    act(() => {
      result.current.setters.setSelectedUser('user-7');
    });

    await waitFor(() => {
      expect(result.current.filters.page).toBe(1);
    });
  });

  it('resets page to 1 when selectedDateRange changes', async () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });

    act(() => {
      result.current.setters.setPage(4);
    });

    act(() => {
      result.current.setters.setSelectedDateRange('last30');
    });

    await waitFor(() => {
      expect(result.current.filters.page).toBe(1);
    });
  });
});

describe('useAuditView - activeFiltersCount', () => {
  it('counts each non-empty filter exactly once and excludes the date range', () => {
    const { result } = renderHook(() => useAuditView(), { wrapper });

    act(() => {
      result.current.setters.setSelectedUser('user-1');
      result.current.setters.setSelectedCategory('AUTH');
      result.current.setters.setSelectedDateRange('last30');
    });

    expect(result.current.derived.activeFiltersCount).toBe(2);

    act(() => {
      result.current.setters.setSearchQuery('term');
      result.current.setters.setSelectedAction('LOGIN_SUCCESS');
      result.current.setters.setSelectedEntityType('User');
    });

    expect(result.current.derived.activeFiltersCount).toBe(5);
  });
});
