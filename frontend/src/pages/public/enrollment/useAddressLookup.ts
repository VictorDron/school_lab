import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type {
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import {
  brazilianStates,
  getCitiesForState,
  getNeighborhoodsForCity,
} from '@/constants/brazilianStates';
import { countries } from '@/constants/countries';
import { nationalities } from '@/constants/nationalities';
import { ADDRESS_FIELDS } from './constants';
import type { EnrollmentForm } from './types';

interface UseAddressLookupParams {
  watch: UseFormWatch<EnrollmentForm>;
  setValue: UseFormSetValue<EnrollmentForm>;
  getValues: UseFormGetValues<EnrollmentForm>;
  language: 'pt' | 'en';
}

interface Option {
  value: string;
  label: string;
}

interface UseAddressLookupReturn {
  countryOptions: Option[];
  nationalityOptions: Option[];
  stateOptions: Option[];
  fatherCityOptions: Option[];
  fatherNeighborhoodOptions: Option[];
  motherCityOptions: Option[];
  motherNeighborhoodOptions: Option[];
  isFatherAddressLoading: boolean;
  isMotherAddressLoading: boolean;
  /**
   * Whether the parents declared separate addresses. When false the
   * mother address mirrors the father address on every change.
   */
  parentsSeparateAddresses: boolean;
  /** Direct setter — used by the prefill effect to reflect server data. */
  setParentsSeparateAddresses: (separate: boolean) => void;
  /**
   * Handler bound to the "parents have separate addresses" toggle. Keeps
   * the form's motherUpdates.sameAddressAsOtherParent flag in sync and
   * copies the father address into the mother address when re-sharing.
   */
  handleSeparateAddressToggle: (separate: boolean) => void;
}

/**
 * Encapsulates every read and side-effect tied to the parent-address
 * fields on the EnrollmentFormPage:
 *
 * - memoised select options for country / nationality / state plus the
 *   per-parent city and neighborhood lists derived from the watched
 *   country/state/city values;
 * - the ViaCEP lookup for both parents, gated to 8-digit cleaned zips,
 *   with localized success/failure toasts and a loading flag each;
 * - the auto-lookup effects that fire when a zipCode reaches 8 digits;
 * - the cascade resets that clear state/city/neighborhood when the
 *   country (non-BR), state or city changes;
 * - the sync effect that mirrors the father address onto the mother
 *   address while parentsSeparateAddresses is false.
 */
export function useAddressLookup(
  params: UseAddressLookupParams,
): UseAddressLookupReturn {
  const { watch, setValue, getValues, language } = params;

  const [isFatherAddressLoading, setIsFatherAddressLoading] = useState(false);
  const [isMotherAddressLoading, setIsMotherAddressLoading] = useState(false);
  const [parentsSeparateAddresses, setParentsSeparateAddresses] =
    useState(false);

  const watchFatherCountry = watch('fatherUpdates.address.country');
  const watchFatherState = watch('fatherUpdates.address.state');
  const watchFatherCity = watch('fatherUpdates.address.city');
  const watchFatherZipCode = watch('fatherUpdates.address.zipCode');
  const watchFatherAddress = watch('fatherUpdates.address');

  const watchMotherCountry = watch('motherUpdates.address.country');
  const watchMotherState = watch('motherUpdates.address.state');
  const watchMotherCity = watch('motherUpdates.address.city');
  const watchMotherZipCode = watch('motherUpdates.address.zipCode');

  const countryOptions = useMemo<Option[]>(
    () =>
      countries.map((country) => ({
        value: country.code,
        label: language === 'pt' ? country.pt : country.en,
      })),
    [language],
  );

  const nationalityOptions = useMemo<Option[]>(
    () =>
      nationalities
        .map((n) => ({
          value: n.en,
          label: language === 'pt' ? n.pt : n.en,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [language],
  );

  const stateOptions = useMemo<Option[]>(
    () =>
      brazilianStates.map((state) => ({
        value: state.code,
        label: state.name,
      })),
    [],
  );

  const fatherCityOptions = useMemo<Option[]>(() => {
    if (watchFatherCountry === 'BR' && watchFatherState) {
      return getCitiesForState(watchFatherState).map((city) => ({
        value: city,
        label: city,
      }));
    }
    return [];
  }, [watchFatherCountry, watchFatherState]);

  const fatherNeighborhoodOptions = useMemo<Option[]>(() => {
    if (watchFatherCountry === 'BR' && watchFatherCity) {
      return getNeighborhoodsForCity(watchFatherCity).map((n) => ({
        value: n,
        label: n,
      }));
    }
    return [];
  }, [watchFatherCountry, watchFatherCity]);

  const motherCityOptions = useMemo<Option[]>(() => {
    if (watchMotherCountry === 'BR' && watchMotherState) {
      return getCitiesForState(watchMotherState).map((city) => ({
        value: city,
        label: city,
      }));
    }
    return [];
  }, [watchMotherCountry, watchMotherState]);

  const motherNeighborhoodOptions = useMemo<Option[]>(() => {
    if (watchMotherCountry === 'BR' && watchMotherCity) {
      return getNeighborhoodsForCity(watchMotherCity).map((n) => ({
        value: n,
        label: n,
      }));
    }
    return [];
  }, [watchMotherCountry, watchMotherCity]);

  const copyAddress = useCallback(
    (
      from: 'fatherUpdates' | 'motherUpdates',
      to: 'fatherUpdates' | 'motherUpdates',
    ) => {
      ADDRESS_FIELDS.forEach((field) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (getValues(`${from}.address.${field}` as any) as string) || '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`${to}.address.${field}` as any, value);
      });
    },
    [getValues, setValue],
  );

  const handleSeparateAddressToggle = useCallback(
    (separate: boolean) => {
      setParentsSeparateAddresses(separate);
      setValue('motherUpdates.sameAddressAsOtherParent', !separate);
      if (!separate) {
        copyAddress('fatherUpdates', 'motherUpdates');
      }
    },
    [copyAddress, setValue],
  );

  // Mirror the father address onto the mother address while shared.
  useEffect(() => {
    if (parentsSeparateAddresses || !watchFatherAddress) return;
    ADDRESS_FIELDS.forEach((field) => {
      const fatherVal =
        (watchFatherAddress as Record<string, string>)[field] || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const motherVal = (getValues(`motherUpdates.address.${field}` as any) as string) || '';
      if (fatherVal !== motherVal) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`motherUpdates.address.${field}` as any, fatherVal);
      }
    });
  }, [parentsSeparateAddresses, watchFatherAddress, setValue, getValues]);

  const lookupFatherZipCode = useCallback(
    async (zipCode: string) => {
      const cleanZip = zipCode.replace(/\D/g, '');
      if (cleanZip.length !== 8) return;

      setIsFatherAddressLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue('fatherUpdates.address.country', 'BR');
          setValue('fatherUpdates.address.state', data.uf);
          setValue('fatherUpdates.address.city', data.localidade);
          setValue('fatherUpdates.address.neighborhood', data.bairro || '');
          setValue('fatherUpdates.address.street', data.logradouro || '');
        } else {
          toast.error(language === 'pt' ? 'CEP não encontrado' : 'ZIP code not found');
        }
      } catch {
        toast.error(language === 'pt' ? 'Erro ao buscar CEP' : 'Error fetching ZIP code');
      } finally {
        setIsFatherAddressLoading(false);
      }
    },
    [setValue, language],
  );

  const lookupMotherZipCode = useCallback(
    async (zipCode: string) => {
      const cleanZip = zipCode.replace(/\D/g, '');
      if (cleanZip.length !== 8) return;

      setIsMotherAddressLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setValue('motherUpdates.address.country', 'BR');
          setValue('motherUpdates.address.state', data.uf);
          setValue('motherUpdates.address.city', data.localidade);
          setValue('motherUpdates.address.neighborhood', data.bairro || '');
          setValue('motherUpdates.address.street', data.logradouro || '');
        } else {
          toast.error(language === 'pt' ? 'CEP não encontrado' : 'ZIP code not found');
        }
      } catch {
        toast.error(language === 'pt' ? 'Erro ao buscar CEP' : 'Error fetching ZIP code');
      } finally {
        setIsMotherAddressLoading(false);
      }
    },
    [setValue, language],
  );

  // Auto-lookup father CEP once the field reaches 8 digits.
  useEffect(() => {
    if (watchFatherZipCode && watchFatherZipCode.replace(/\D/g, '').length === 8) {
      lookupFatherZipCode(watchFatherZipCode);
    }
  }, [watchFatherZipCode, lookupFatherZipCode]);

  // Father cascade resets — non-BR country drops state/zip/neighborhood;
  // state change drops a now-invalid city; city change drops a now-invalid
  // neighborhood.
  useEffect(() => {
    if (watchFatherCountry && watchFatherCountry !== 'BR') {
      setValue('fatherUpdates.address.state', '');
      setValue('fatherUpdates.address.zipCode', '');
      setValue('fatherUpdates.address.neighborhood', '');
    }
  }, [watchFatherCountry, setValue]);

  useEffect(() => {
    const currentCity = getValues('fatherUpdates.address.city');
    if (watchFatherState && currentCity) {
      const cities = getCitiesForState(watchFatherState);
      if (!cities.includes(currentCity)) {
        setValue('fatherUpdates.address.city', '');
      }
    }
  }, [watchFatherState, setValue, getValues]);

  useEffect(() => {
    if (!watchFatherCity) return;
    const neighborhoods = getNeighborhoodsForCity(watchFatherCity);
    const currentNeighborhood = getValues('fatherUpdates.address.neighborhood');
    if (
      neighborhoods.length > 0 &&
      currentNeighborhood &&
      !neighborhoods.includes(currentNeighborhood)
    ) {
      setValue('fatherUpdates.address.neighborhood', '');
    }
  }, [watchFatherCity, setValue, getValues]);

  // Auto-lookup mother CEP once the field reaches 8 digits.
  useEffect(() => {
    if (watchMotherZipCode && watchMotherZipCode.replace(/\D/g, '').length === 8) {
      lookupMotherZipCode(watchMotherZipCode);
    }
  }, [watchMotherZipCode, lookupMotherZipCode]);

  useEffect(() => {
    if (watchMotherCountry && watchMotherCountry !== 'BR') {
      setValue('motherUpdates.address.state', '');
      setValue('motherUpdates.address.zipCode', '');
      setValue('motherUpdates.address.neighborhood', '');
    }
  }, [watchMotherCountry, setValue]);

  useEffect(() => {
    const currentCity = getValues('motherUpdates.address.city');
    if (watchMotherState && currentCity) {
      const cities = getCitiesForState(watchMotherState);
      if (!cities.includes(currentCity)) {
        setValue('motherUpdates.address.city', '');
      }
    }
  }, [watchMotherState, setValue, getValues]);

  useEffect(() => {
    if (!watchMotherCity) return;
    const neighborhoods = getNeighborhoodsForCity(watchMotherCity);
    const currentNeighborhood = getValues('motherUpdates.address.neighborhood');
    if (
      neighborhoods.length > 0 &&
      currentNeighborhood &&
      !neighborhoods.includes(currentNeighborhood)
    ) {
      setValue('motherUpdates.address.neighborhood', '');
    }
  }, [watchMotherCity, setValue, getValues]);

  return {
    countryOptions,
    nationalityOptions,
    stateOptions,
    fatherCityOptions,
    fatherNeighborhoodOptions,
    motherCityOptions,
    motherNeighborhoodOptions,
    isFatherAddressLoading,
    isMotherAddressLoading,
    parentsSeparateAddresses,
    setParentsSeparateAddresses,
    handleSeparateAddressToggle,
  };
}
