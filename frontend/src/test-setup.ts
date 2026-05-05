import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// react-hot-toast is invoked from validators that we exercise as units;
// stub it so unit tests don't render real DOM toasts.
vi.mock('react-hot-toast', () => {
  const fn = vi.fn();
  return {
    default: Object.assign(fn, {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
      remove: vi.fn(),
    }),
  };
});

// validators call scrollToFirstError which assumes a real layout; jsdom
// does not implement scrollIntoView. Stub it on the prototype.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement.prototype as any).scrollIntoView = vi.fn();
}
