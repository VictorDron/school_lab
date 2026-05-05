import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  UseFormGetValues,
  UseFormReset,
  UseFormWatch,
} from 'react-hook-form';
import type { AdmissionForm } from '@/components/public/admission/types';
import { API_URL, STORAGE_KEY } from './constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrefillData = any;
interface ServerDraft {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  step: number;
  updatedAt: string;
}

interface UseAdmissionDraftParams {
  applicationToken: string | null;
  reset: UseFormReset<AdmissionForm>;
  watch: UseFormWatch<AdmissionForm>;
  getValues: UseFormGetValues<AdmissionForm>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

interface UseAdmissionDraftReturn {
  prefillData: PrefillData | undefined;
  isPrefillLoading: boolean;
  prefillError: unknown;
  serverDraft: ServerDraft | null | undefined;
  /**
   * Shared guard ref — set to true once any restore path (server draft or
   * prefill data) has populated the form, so subsequent effects don't
   * overwrite the user's edits.
   */
  hasPrefilled: MutableRefObject<boolean>;
  submitted: boolean;
  tokenError: 'expired' | 'invalid' | null;
  setTokenError: (value: 'expired' | 'invalid' | null) => void;
  /** Persist the "submitted" flag, clear the local draft, and flip UI state. */
  markSubmitted: () => void;
}

/**
 * Owns all draft / persistence concerns of the public admission form:
 * server-side prefill query, server draft checkpoint, localStorage
 * autosave + restore, submitted-flag detection, and token error
 * surfacing. The actual form-population logic for prefillData lives in
 * useAdmissionPrefill, sharing the hasPrefilled ref returned here.
 */
export function useAdmissionDraft({
  applicationToken,
  reset,
  watch,
  getValues,
  currentStep,
  setCurrentStep,
}: UseAdmissionDraftParams): UseAdmissionDraftReturn {
  const [submitted, setSubmitted] = useState(false);
  const [tokenError, setTokenError] = useState<'expired' | 'invalid' | null>(null);
  const hasPrefilled = useRef(false);

  // Fetch existing application data if a token is present
  const { data: prefillData, error: prefillError, isLoading: isPrefillLoading } = useQuery({
    queryKey: ['application', applicationToken],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/public/application/${applicationToken}`);
      const json = await response.json();

      if (!response.ok) {
        if (json.code === 'TOKEN_EXPIRED') throw new Error('TOKEN_EXPIRED');
        if (json.code === 'TOKEN_NOT_FOUND' || response.status === 404) throw new Error('TOKEN_NOT_FOUND');
        throw new Error(json.error || 'Erro ao carregar dados');
      }

      return json.data;
    },
    enabled: !!applicationToken,
    retry: false,
  });

  // Fetch server draft checkpoint
  const { data: serverDraft } = useQuery({
    queryKey: ['formDraft', applicationToken, 'ADMISSION'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/public/form-draft/${applicationToken}?type=ADMISSION`);
      const json = await response.json();
      if (!response.ok) return null;
      return json.data as ServerDraft | null;
    },
    enabled: !!applicationToken,
    retry: false,
  });

  // Surface prefill query errors as token states for the page to render
  useEffect(() => {
    if (prefillError) {
      const errorMessage = prefillError instanceof Error ? prefillError.message : '';
      if (errorMessage === 'TOKEN_EXPIRED') setTokenError('expired');
      else if (errorMessage === 'TOKEN_NOT_FOUND') setTokenError('invalid');
    }
  }, [prefillError]);

  // Detect already-submitted state from server flag or local marker
  useEffect(() => {
    if (prefillData?.isAlreadySubmitted) {
      setSubmitted(true);
    } else if (applicationToken && localStorage.getItem(`admission_submitted_${applicationToken}`) === 'true') {
      setSubmitted(true);
    }
  }, [prefillData, applicationToken]);

  // Restore from server draft (highest priority)
  useEffect(() => {
    if (serverDraft && !hasPrefilled.current) {
      hasPrefilled.current = true;
      reset(serverDraft.data);
      setCurrentStep(serverDraft.step || 1);
    }
  }, [serverDraft, reset, setCurrentStep]);

  // Auto-save to localStorage (debounced 1s)
  const formValues = watch();
  useEffect(() => {
    if (applicationToken && !submitted) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(
          `${STORAGE_KEY}_${applicationToken}`,
          JSON.stringify({ data: formValues, step: currentStep })
        );
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formValues, currentStep, applicationToken, submitted]);

  // Restore from localStorage on mount when no server-side source applies
  useEffect(() => {
    if (applicationToken && !prefillData && !serverDraft) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${applicationToken}`);
      if (saved) {
        try {
          const { data, step } = JSON.parse(saved);
          reset(data);
          setCurrentStep(step || 1);
        } catch {
          // Ignore parse errors — corrupt drafts are dropped silently.
        }
      }
    }
  }, [applicationToken, prefillData, serverDraft, reset, setCurrentStep]);

  const markSubmitted = useCallback(() => {
    setSubmitted(true);
    if (applicationToken) {
      localStorage.setItem(`admission_submitted_${applicationToken}`, 'true');
      localStorage.removeItem(`${STORAGE_KEY}_${applicationToken}`);
    }
    // getValues is unused here but kept in deps to mirror the hook's
    // declared inputs without lying about the closure surface.
    void getValues;
  }, [applicationToken, getValues]);

  return {
    prefillData,
    isPrefillLoading,
    prefillError,
    serverDraft,
    hasPrefilled,
    submitted,
    tokenError,
    setTokenError,
    markSubmitted,
  };
}
