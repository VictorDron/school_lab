import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import type {
  HealthData,
  TransportData,
  AuthorizedPerson,
} from '@/types/enrollment';
import type { EnrollmentForm } from './types';

interface UseStudentTabsParams {
  /** Total enrolling students; only matters whether the count is > 1. */
  enrollmentStudents: ReadonlyArray<unknown>;
  getValues: UseFormGetValues<EnrollmentForm>;
  setValue: UseFormSetValue<EnrollmentForm>;
  language: 'pt' | 'en';
}

interface UseStudentTabsReturn {
  activeStudentTab: number;
  setActiveStudentTab: (index: number) => void;
  /**
   * Persist the visible health values into the active tab's slot, then
   * load the destination tab's health values into the visible form.
   * No-op when only one student is enrolling.
   */
  handleHealthTabSwitch: (newTab: number) => void;
  /**
   * Copy a sibling's shared health fields into the current student's
   * health (excluding individual measurements: weight, height, bloodType).
   */
  handleCopyHealthFromSibling: (sourceTabIndex: number) => void;
  /**
   * Persist the visible transport + authorizedPersons into the active
   * tab's slot, then load the destination tab's data.
   */
  handleTransportTabSwitch: (newTab: number) => void;
  /**
   * Copy a sibling's transport + authorizedPersons into the current
   * student's slot.
   */
  handleCopyTransportFromSibling: (sourceTabIndex: number) => void;
}

/**
 * Manages multi-child tab state on the EnrollmentFormPage.
 *
 * The form binds the visible Health / Transport / AuthorizedPersons
 * fields to the root paths (\`health\`, \`transport\`, \`authorizedPersons\`)
 * for ergonomic single-child use. When more than one student is being
 * enrolled, the per-student data lives under
 * \`studentsEnrollment.[i].\` and the visible root paths act as a
 * scratchpad for the active tab. The four helpers in this hook are the
 * only places that copy values between the scratchpad and the
 * per-student slots, plus the cross-sibling "copy from" actions.
 *
 * Updates to the visible form are atomic (single \`setValue('health',
 * { ...current, ...incoming })\`) to avoid the checkbox inconsistency
 * that motivated Bug 9 in the original implementation.
 */
export function useStudentTabs(
  params: UseStudentTabsParams,
): UseStudentTabsReturn {
  const { enrollmentStudents, getValues, setValue, language } = params;

  const [activeStudentTab, setActiveStudentTab] = useState(0);

  const handleHealthTabSwitch = useCallback(
    (newTab: number) => {
      if (enrollmentStudents.length <= 1) return;
      const currentHealth = getValues('health');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(`studentsEnrollment.${activeStudentTab}.health` as any, currentHealth);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newHealth = getValues(`studentsEnrollment.${newTab}.health` as any) as
        | HealthData
        | undefined;
      if (newHealth) {
        setValue('health', { ...currentHealth, ...newHealth });
      }
      setActiveStudentTab(newTab);
    },
    [enrollmentStudents.length, activeStudentTab, getValues, setValue],
  );

  const handleCopyHealthFromSibling = useCallback(
    (sourceTabIndex: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sourceHealth = getValues(
        `studentsEnrollment.${sourceTabIndex}.health` as any,
      ) as HealthData | undefined;
      if (!sourceHealth) {
        toast.error(
          language === 'pt'
            ? 'Nenhum dado de saúde encontrado para este irmão.'
            : 'No health data found for this sibling.',
        );
        return;
      }
      // weight / height / bloodType stay individual — never copied.
      const { weight: _w, height: _h, bloodType: _bt, ...sharedHealthData } =
        sourceHealth;
      const currentHealth = getValues('health');
      setValue('health', { ...currentHealth, ...sharedHealthData });
      setValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${activeStudentTab}.health` as any,
        { ...currentHealth, ...sharedHealthData },
      );
      toast.success(
        language === 'pt'
          ? 'Dados copiados! Revise e ajuste se necessário.'
          : 'Data copied! Review and adjust if needed.',
      );
    },
    [getValues, setValue, activeStudentTab, language],
  );

  const handleTransportTabSwitch = useCallback(
    (newTab: number) => {
      if (enrollmentStudents.length <= 1) return;
      const currentTransport = getValues('transport');
      const currentAP = getValues('authorizedPersons');
      setValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${activeStudentTab}.transport` as any,
        currentTransport,
      );
      setValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${activeStudentTab}.authorizedPersons` as any,
        currentAP,
      );
      const newTransport = getValues(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${newTab}.transport` as any,
      ) as TransportData | undefined;
      const newAP = getValues(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${newTab}.authorizedPersons` as any,
      ) as AuthorizedPerson[] | undefined;
      if (newTransport) {
        setValue('transport', { ...currentTransport, ...newTransport });
      }
      if (newAP) {
        setValue('authorizedPersons', newAP);
      }
      setActiveStudentTab(newTab);
    },
    [enrollmentStudents.length, activeStudentTab, getValues, setValue],
  );

  const handleCopyTransportFromSibling = useCallback(
    (sourceTabIndex: number) => {
      const sourceTransport = getValues(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${sourceTabIndex}.transport` as any,
      ) as TransportData | undefined;
      const sourceAP = getValues(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${sourceTabIndex}.authorizedPersons` as any,
      ) as AuthorizedPerson[] | undefined;
      if (!sourceTransport) {
        toast.error(
          language === 'pt'
            ? 'Nenhum dado de transporte encontrado para este irmão.'
            : 'No transport data found for this sibling.',
        );
        return;
      }
      const currentTransport = getValues('transport');
      setValue('transport', { ...currentTransport, ...sourceTransport });
      setValue('authorizedPersons', sourceAP || []);
      setValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${activeStudentTab}.transport` as any,
        { ...sourceTransport },
      );
      setValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `studentsEnrollment.${activeStudentTab}.authorizedPersons` as any,
        sourceAP || [],
      );
      toast.success(
        language === 'pt'
          ? 'Dados copiados! Revise e ajuste se necessário.'
          : 'Data copied! Review and adjust if needed.',
      );
    },
    [getValues, setValue, activeStudentTab, language],
  );

  return {
    activeStudentTab,
    setActiveStudentTab,
    handleHealthTabSwitch,
    handleCopyHealthFromSibling,
    handleTransportTabSwitch,
    handleCopyTransportFromSibling,
  };
}
