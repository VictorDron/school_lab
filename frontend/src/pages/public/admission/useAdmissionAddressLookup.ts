import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import {
  brazilianStates,
  getCitiesForState,
  getNeighborhoodsForCity,
} from '@/constants/brazilianStates';
import type { AdmissionForm } from '@/components/public/admission/types';

interface UseAdmissionAddressLookupParams {
  watch: UseFormWatch<AdmissionForm>;
  setValue: UseFormSetValue<AdmissionForm>;
  language: 'pt' | 'en';
}

interface Option {
  value: string;
  label: string;
}

interface UseAdmissionAddressLookupReturn {
  /** True while the ViaCEP request is in flight, for spinners. */
  isLoadingAddress: boolean;
  stateOptions: Option[];
  /** Cities cascading from the selected state; empty until state is set. */
  cityOptions: Option[];
  /** Neighborhoods cascading from the selected city; empty until city is set. */
  neighborhoodOptions: Option[];
  /** Re-exported from `watch` so the page can pass them to step components without re-subscribing. */
  watchedCountry: string;
  watchedState: string;
  watchedCity: string;
}

/**
 * Cascading address concerns for the admission form: ViaCEP lookup
 * triggered by an 8-digit ZIP, dependent option lists for state/city/
 * neighborhood, and reset effects that clear stale values when an
 * upstream field changes (country away from BR, state changed, city
 * changed). Mirrors the pattern in useAddressLookup for enrollment but
 * is scoped to the admission form's flatter address shape.
 */
export function useAdmissionAddressLookup({
  watch,
  setValue,
  language,
}: UseAdmissionAddressLookupParams): UseAdmissionAddressLookupReturn {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const watchedZipCode = watch('address.zipCode');
  const watchedCountry = watch('address.country');
  const watchedState = watch('address.state');
  const watchedCity = watch('address.city');

  const stateOptions = useMemo(
    () =>
      brazilianStates.map((s) => ({
        value: s.code,
        label: `${s.code} - ${s.name}`,
      })),
    []
  );

  const cityOptions = useMemo(() => {
    if (!watchedState) return [];
    return getCitiesForState(watchedState).map((c) => ({ value: c, label: c }));
  }, [watchedState]);

  const neighborhoodOptions = useMemo(() => {
    if (!watchedCity) return [];
    return getNeighborhoodsForCity(watchedCity).map((n) => ({ value: n, label: n }));
  }, [watchedCity]);

  const lookupZipCode = useCallback(async (zipCode: string) => {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) return;

    setIsLoadingAddress(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue('address.country', 'BR');
        setValue('address.state', data.uf || '');
        setValue('address.city', data.localidade || '');
        setValue('address.neighborhood', data.bairro || '');
        setValue('address.street', data.logradouro || '');

        toast.success(
          language === 'pt'
            ? 'Endereço preenchido automaticamente!'
            : 'Address filled automatically!'
        );
      }
    } catch {
      toast.error(
        language === 'pt'
          ? 'Não foi possível buscar o CEP. Preencha o endereço manualmente.'
          : 'Could not look up ZIP code. Please fill in the address manually.'
      );
    } finally {
      setIsLoadingAddress(false);
    }
  }, [setValue, language]);

  // Reset dependent fields when leaving Brazil (state/city/neighborhood are BR-specific lists)
  useEffect(() => {
    if (watchedCountry !== 'BR') {
      setValue('address.state', '');
      setValue('address.city', '');
      setValue('address.neighborhood', '');
    }
  }, [watchedCountry, setValue]);

  // Clear city + neighborhood when the state changes and no longer contains the current city
  useEffect(() => {
    if (watchedState && watchedCity) {
      const cities = getCitiesForState(watchedState);
      if (cities.length > 0 && !cities.includes(watchedCity)) {
        setValue('address.city', '');
        setValue('address.neighborhood', '');
      }
    }
  }, [watchedState, watchedCity, setValue]);

  // Clear neighborhood when the city changes and no longer contains it
  useEffect(() => {
    if (watchedCity) {
      const neighborhoods = getNeighborhoodsForCity(watchedCity);
      const currentNeighborhood = watch('address.neighborhood');
      if (neighborhoods.length > 0 && currentNeighborhood && !neighborhoods.includes(currentNeighborhood)) {
        setValue('address.neighborhood', '');
      }
    }
  }, [watchedCity, setValue, watch]);

  // Auto-trigger ViaCEP when the ZIP reaches 8 digits
  useEffect(() => {
    if (watchedZipCode && watchedZipCode.replace(/\D/g, '').length === 8) {
      lookupZipCode(watchedZipCode);
    }
  }, [watchedZipCode, lookupZipCode]);

  return {
    isLoadingAddress,
    stateOptions,
    cityOptions,
    neighborhoodOptions,
    watchedCountry,
    watchedState,
    watchedCity,
  };
}
