import toast from 'react-hot-toast';
import { scrollToFirstError } from '@/utils/validation';
import type { HealthData } from '@/types/enrollment';
import type { ValidatorContext } from './types';

export function validateHealthStep(ctx: ValidatorContext): boolean {
  const {
    watch,
    setValue,
    getValues,
    language,
    enrollmentStudents,
    activeStudentTab,
    setActiveStudentTab,
    setFieldErrors,
  } = ctx;

  const errs: Record<string, string> = {};
  const numHealthStudents = enrollmentStudents.length;

  if (numHealthStudents > 1) {
    const currentHealth = getValues('health');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`studentsEnrollment.${activeStudentTab}.health` as any, currentHealth);

    const switchToHealthTab = (i: number) => {
      if (i !== activeStudentTab) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newHealth = getValues(`studentsEnrollment.${i}.health` as any) as HealthData | undefined;
        if (newHealth) {
          const defaultHealth = getValues('health');
          setValue('health', { ...defaultHealth, ...newHealth });
        }
        setActiveStudentTab(i);
      }
    };

    for (let i = 0; i < numHealthStudents; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h = getValues(`studentsEnrollment.${i}.health` as any) as any;
      const label = ` (${enrollmentStudents[i]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`})`;
      const wStr = String(h?.weight || '').trim();
      if (!wStr) {
        switchToHealthTab(i);
        errs['health.weight'] = language === 'pt' ? `Informe o peso do aluno${label}` : `Enter student weight${label}`;
        toast.error(errs['health.weight']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      const wNum = parseFloat(wStr);
      if (isNaN(wNum) || wNum < 1 || wNum > 200) {
        switchToHealthTab(i);
        errs['health.weight'] = language === 'pt' ? `Peso inválido (1-200 kg)${label}` : `Invalid weight (1-200 kg)${label}`;
        toast.error(errs['health.weight']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      const hStr = String(h?.height || '').trim();
      if (!hStr) {
        switchToHealthTab(i);
        errs['health.height'] = language === 'pt' ? `Informe a altura do aluno${label}` : `Enter student height${label}`;
        toast.error(errs['health.height']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      const hNum = parseFloat(hStr);
      if (isNaN(hNum) || hNum < 30 || hNum > 250) {
        switchToHealthTab(i);
        errs['health.height'] = language === 'pt' ? `Altura inválida (30-250 cm)${label}` : `Invalid height (30-250 cm)${label}`;
        toast.error(errs['health.height']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!h?.bloodType) {
        switchToHealthTab(i);
        errs['health.bloodType'] = language === 'pt' ? `Selecione o tipo sanguíneo${label}` : `Select blood type${label}`;
        toast.error(errs['health.bloodType']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!h?.medicalConditions || h.medicalConditions.length === 0) {
        switchToHealthTab(i);
        errs['health.medicalConditions'] = language === 'pt' ? `Selecione as condições médicas ou "Nenhuma"${label}` : `Select medical conditions or "None"${label}`;
        toast.error(errs['health.medicalConditions']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!h?.allergies || h.allergies.length === 0) {
        switchToHealthTab(i);
        errs['health.allergies'] = language === 'pt' ? `Selecione as alergias ou "Nenhuma"${label}` : `Select allergies or "None"${label}`;
        toast.error(errs['health.allergies']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!h?.feverMedications || h.feverMedications.length === 0) {
        switchToHealthTab(i);
        errs['health.feverMedications'] = language === 'pt' ? `Selecione medicamentos para febre ou "Nenhum"${label}` : `Select fever medications or "None"${label}`;
        toast.error(errs['health.feverMedications']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!h?.painMedications || h.painMedications.length === 0) {
        switchToHealthTab(i);
        errs['health.painMedications'] = language === 'pt' ? `Selecione medicamentos para dor ou "Nenhum"${label}` : `Select pain medications or "None"${label}`;
        toast.error(errs['health.painMedications']);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const health = getValues('health') as any;
    const wStr = String(health?.weight || '').trim();
    if (!wStr) {
      errs['health.weight'] = language === 'pt' ? 'Informe o peso do aluno' : 'Enter student weight';
      toast.error(errs['health.weight']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    const wNum = parseFloat(wStr);
    if (isNaN(wNum) || wNum < 1 || wNum > 200) {
      errs['health.weight'] = language === 'pt' ? 'Peso inválido (1-200 kg)' : 'Invalid weight (1-200 kg)';
      toast.error(errs['health.weight']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    const hStr = String(health?.height || '').trim();
    if (!hStr) {
      errs['health.height'] = language === 'pt' ? 'Informe a altura do aluno' : 'Enter student height';
      toast.error(errs['health.height']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    const hNum = parseFloat(hStr);
    if (isNaN(hNum) || hNum < 30 || hNum > 250) {
      errs['health.height'] = language === 'pt' ? 'Altura inválida (30-250 cm)' : 'Invalid height (30-250 cm)';
      toast.error(errs['health.height']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!health?.bloodType) {
      errs['health.bloodType'] = language === 'pt' ? 'Selecione o tipo sanguíneo' : 'Select blood type';
      toast.error(errs['health.bloodType']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!health?.medicalConditions || health.medicalConditions.length === 0) {
      errs['health.medicalConditions'] = language === 'pt' ? 'Selecione as condições médicas ou "Nenhuma"' : 'Select medical conditions or "None"';
      toast.error(errs['health.medicalConditions']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!health?.allergies || health.allergies.length === 0) {
      errs['health.allergies'] = language === 'pt' ? 'Selecione as alergias ou "Nenhuma"' : 'Select allergies or "None"';
      toast.error(errs['health.allergies']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!health?.feverMedications || health.feverMedications.length === 0) {
      errs['health.feverMedications'] = language === 'pt' ? 'Selecione medicamentos para febre ou "Nenhum"' : 'Select fever medications or "None"';
      toast.error(errs['health.feverMedications']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!health?.painMedications || health.painMedications.length === 0) {
      errs['health.painMedications'] = language === 'pt' ? 'Selecione medicamentos para dor ou "Nenhum"' : 'Select pain medications or "None"';
      toast.error(errs['health.painMedications']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
  }

  const contacts = watch('emergencyContacts');
  if (!contacts || contacts.length === 0) {
    errs['emergencyContacts'] = language === 'pt' ? 'Adicione pelo menos um contato de emergência' : 'Add at least one emergency contact';
    toast.error(errs['emergencyContacts']);
    setFieldErrors(errs); scrollToFirstError(); return false;
  }
  const hasValidContact = contacts.some(c => c.name && c.phone);
  if (!hasValidContact) {
    errs['emergencyContacts'] = language === 'pt' ? 'Preencha nome e telefone do contato de emergência' : 'Fill in emergency contact name and phone';
    toast.error(errs['emergencyContacts']);
    setFieldErrors(errs); scrollToFirstError(); return false;
  }

  setFieldErrors({});
  return true;
}
