import { useCallback } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { EnrollmentForm } from './types';

type CheckboxPath = `health.${'medicalConditions' | 'allergies' | 'feverMedications' | 'painMedications'}`;

interface UseNoneAwareToggleParams {
  setValue: UseFormSetValue<EnrollmentForm>;
  watchHealth: EnrollmentForm['health'] | undefined;
}

interface UseNoneAwareToggleReturn {
  /**
   * Multi-select checkbox toggle that special-cases the literal "NONE" value:
   * picking "NONE" clears any siblings, picking any sibling clears "NONE".
   * Used by the health step for medical conditions, allergies, and the two
   * medication lists.
   */
  toggle: (path: CheckboxPath, value: string, checked: boolean) => void;
}

const fieldFromPath = (path: CheckboxPath) =>
  path.split('.')[1] as 'medicalConditions' | 'allergies' | 'feverMedications' | 'painMedications';

export function useNoneAwareToggle({
  setValue,
  watchHealth,
}: UseNoneAwareToggleParams): UseNoneAwareToggleReturn {
  const toggle = useCallback(
    (path: CheckboxPath, value: string, checked: boolean) => {
      const current = (watchHealth?.[fieldFromPath(path)] as string[] | undefined) ?? [];
      if (value === 'NONE') {
        setValue(path, checked ? ['NONE'] : []);
        return;
      }
      let updated = current.filter((v) => v !== 'NONE');
      if (checked) {
        updated = [...updated, value];
      } else {
        updated = updated.filter((v) => v !== value);
      }
      setValue(path, updated);
    },
    [setValue, watchHealth],
  );

  return { toggle };
}
