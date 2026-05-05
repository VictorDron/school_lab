import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  UseFormReset,
  UseFormWatch,
  UseFormGetValues,
} from 'react-hook-form';
import { API_URL, STORAGE_KEY, DRAFT_EXPIRY_HOURS } from './constants';
import type { EnrollmentForm } from './types';

interface ServerDraft {
  data: unknown;
  step: number;
  updatedAt: string;
}

interface UseEnrollmentDraftParams {
  token: string | null;
  enrollmentData: { isAlreadySubmitted?: boolean } | undefined;
  reset: UseFormReset<EnrollmentForm>;
  watch: UseFormWatch<EnrollmentForm>;
  getValues: UseFormGetValues<EnrollmentForm>;
  setCurrentStep: (step: number) => void;
  setIsSuccess: (value: boolean) => void;
}

interface UseEnrollmentDraftReturn {
  /** Server-side draft checkpoint, or null/undefined while loading. */
  serverDraft: ServerDraft | null | undefined;
  /** Persist the "submitted" flag and drop the local draft. */
  markSubmitted: () => void;
  /**
   * Fire-and-forget POST of the current form values + step to the server
   * checkpoint endpoint. Called when the user advances a step so the
   * draft survives across devices, not just localStorage.
   */
  saveServerCheckpoint: (step: number) => void;
}

/**
 * Persists the EnrollmentForm wizard state across reloads. Combines three
 * layers of storage:
 *
 * 1. Server-side checkpoint via /public/form-draft/{token}?type=ENROLLMENT.
 *    Highest priority — when present, hydrates the form and the current
 *    step on first render.
 * 2. localStorage fallback under "enrollment_form_draft_{token}". Loaded
 *    only if no server draft and no enrollment payload arrived. Entries
 *    older than DRAFT_EXPIRY_HOURS are dropped.
 * 3. localStorage "enrollment_submitted_{token}" flag — written by
 *    markSubmitted() so a refresh after submit lands on the success view.
 *
 * The debounced auto-save (1s) writes the live form values to layer 2 on
 * every change. layer 3 is cleared by markSubmitted() so the family
 * cannot be tricked back into the wizard after a successful submission.
 */
export function useEnrollmentDraft(
  params: UseEnrollmentDraftParams,
): UseEnrollmentDraftReturn {
  const {
    token,
    enrollmentData,
    reset,
    watch,
    getValues,
    setCurrentStep,
    setIsSuccess,
  } = params;

  const { data: serverDraft } = useQuery({
    queryKey: ['formDraft', token, 'ENROLLMENT'],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/public/form-draft/${token}?type=ENROLLMENT`,
      );
      const json = await response.json();
      if (!response.ok) return null;
      return json.data as ServerDraft | null;
    },
    enabled: !!token,
    retry: false,
  });

  // Restore from server draft (highest priority).
  useEffect(() => {
    if (serverDraft) {
      reset(serverDraft.data as Partial<EnrollmentForm>);
      setCurrentStep(serverDraft.step || 1);
    }
  }, [serverDraft, reset, setCurrentStep]);

  // Detect a previous successful submission via backend flag or localStorage.
  useEffect(() => {
    if (enrollmentData?.isAlreadySubmitted) {
      setIsSuccess(true);
      return;
    }
    if (token && localStorage.getItem(`enrollment_submitted_${token}`) === 'true') {
      setIsSuccess(true);
    }
  }, [enrollmentData, token, setIsSuccess]);

  // localStorage fallback (only when both server draft and the live
  // enrollment payload are missing).
  useEffect(() => {
    if (!token || serverDraft || enrollmentData) return;

    const draftKey = `${STORAGE_KEY}_${token}`;
    const draftData = localStorage.getItem(draftKey);
    if (!draftData) return;

    try {
      const parsed = JSON.parse(draftData) as {
        data?: unknown;
        savedAt?: string;
      };
      if (parsed.savedAt) {
        const savedTime = new Date(parsed.savedAt).getTime();
        const expiryTime = savedTime + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
        if (Date.now() < expiryTime && parsed.data) {
          reset(parsed.data as Partial<EnrollmentForm>);
        } else {
          localStorage.removeItem(draftKey);
        }
      } else if (parsed && typeof parsed === 'object') {
        // Legacy format without expiration metadata.
        reset(parsed as unknown as Partial<EnrollmentForm>);
      }
    } catch (e) {
      console.error('Failed to parse draft:', e);
    }
  }, [token, serverDraft, enrollmentData, reset]);

  // Debounced auto-save to localStorage.
  const formValues = watch();
  useEffect(() => {
    if (!token || !formValues) return;
    const timeoutId = setTimeout(() => {
      const draftData = {
        data: formValues,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${token}`, JSON.stringify(draftData));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [token, formValues]);

  const markSubmitted = useCallback(() => {
    if (!token) return;
    localStorage.setItem(`enrollment_submitted_${token}`, 'true');
    localStorage.removeItem(`${STORAGE_KEY}_${token}`);
  }, [token]);

  const saveServerCheckpoint = useCallback(
    (step: number) => {
      if (!token) return;
      fetch(`${API_URL}/public/form-draft/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'ENROLLMENT',
          data: getValues(),
          step,
        }),
      }).catch(() => {});
    },
    [token, getValues],
  );

  return { serverDraft, markSubmitted, saveServerCheckpoint };
}
