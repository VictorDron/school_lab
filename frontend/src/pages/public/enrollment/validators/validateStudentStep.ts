import toast from 'react-hot-toast';
import {
  scrollToFirstError,
  validateCPF,
  validateEmail,
  validateNotFutureDate,
} from '@/utils/validation';
import type { ValidatorContext } from './types';

export function validateStudentStep(ctx: ValidatorContext): boolean {
  const {
    getValues,
    language,
    enrollmentStudents,
    enrollmentData,
    setActiveStudentTab,
    setFieldErrors,
  } = ctx;

  const errs: Record<string, string> = {};
  const numStudents = enrollmentStudents.length;

  if (numStudents > 1) {
    for (let i = 0; i < numStudents; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ei = getValues(`studentsEnrollment.${i}.enrollmentInfo` as any) as any;
      const label = ` (${enrollmentStudents[i]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`})`;
      if (!ei?.studentCpf || validateCPF(ei.studentCpf) !== true) {
        setActiveStudentTab(i);
        errs[`studentsEnrollment.${i}.enrollmentInfo.studentCpf`] = language === 'pt' ? `Informe um CPF válido do aluno${label}` : `Enter a valid student CPF${label}`;
        toast.error(errs[`studentsEnrollment.${i}.enrollmentInfo.studentCpf`]);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!ei?.studentIdNumber?.trim()) {
        setActiveStudentTab(i);
        errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdNumber`] = language === 'pt' ? `Informe o RG/Passaporte do aluno${label}` : `Enter student ID/Passport${label}`;
        toast.error(errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdNumber`]);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!ei?.studentIdIssueDate) {
        setActiveStudentTab(i);
        errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdIssueDate`] = language === 'pt' ? `Informe a data de emissão do documento${label}` : `Enter document issue date${label}`;
        toast.error(errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdIssueDate`]);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
      if (!ei?.studentIdIssuer) {
        setActiveStudentTab(i);
        errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdIssuer`] = language === 'pt' ? `Selecione o órgão emissor${label}` : `Select issuing authority${label}`;
        toast.error(errs[`studentsEnrollment.${i}.enrollmentInfo.studentIdIssuer`]);
        setFieldErrors(errs); scrollToFirstError(); return false;
      }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrollmentInfo = getValues('enrollmentInfo') as any;
    if (!enrollmentInfo?.studentCpf || validateCPF(enrollmentInfo.studentCpf) !== true) {
      errs['enrollmentInfo.studentCpf'] = language === 'pt' ? 'Informe um CPF válido do aluno' : 'Enter a valid student CPF';
      toast.error(errs['enrollmentInfo.studentCpf']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!enrollmentInfo?.studentIdNumber?.trim()) {
      errs['enrollmentInfo.studentIdNumber'] = language === 'pt' ? 'Informe o RG/Passaporte do aluno' : 'Enter student ID/Passport';
      toast.error(errs['enrollmentInfo.studentIdNumber']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!enrollmentInfo?.studentIdIssueDate) {
      errs['enrollmentInfo.studentIdIssueDate'] = language === 'pt' ? 'Informe a data de emissão do documento' : 'Enter document issue date';
      toast.error(errs['enrollmentInfo.studentIdIssueDate']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
    if (!enrollmentInfo?.studentIdIssuer) {
      errs['enrollmentInfo.studentIdIssuer'] = language === 'pt' ? 'Selecione o órgão emissor' : 'Select issuing authority';
      toast.error(errs['enrollmentInfo.studentIdIssuer']);
      setFieldErrors(errs); scrollToFirstError(); return false;
    }
  }

  const father = getValues('fatherUpdates');
  const mother = getValues('motherUpdates');

  if (!father?.email?.trim()) {
    errs['fatherUpdates.email'] = language === 'pt' ? 'Informe o email do pai' : 'Enter father email';
  } else if (!validateEmail(father.email)) {
    errs['fatherUpdates.email'] = language === 'pt' ? 'Email do pai inválido' : 'Invalid father email';
  }
  if (!father?.phone?.trim()) {
    errs['fatherUpdates.phone'] = language === 'pt' ? 'Informe o telefone do pai' : 'Enter father phone';
  }
  if (!father?.idNumber?.trim()) {
    errs['fatherUpdates.idNumber'] = language === 'pt' ? 'Informe o RG/Passaporte do pai' : 'Enter father ID/Passport';
  }
  if (!father?.idIssueDate) {
    errs['fatherUpdates.idIssueDate'] = language === 'pt' ? 'Informe a data de emissão do documento do pai' : 'Enter father document issue date';
  }
  if (!father?.idIssuer) {
    errs['fatherUpdates.idIssuer'] = language === 'pt' ? 'Selecione o órgão emissor do pai' : 'Select father issuing authority';
  }
  if (!father?.dateOfBirth) {
    errs['fatherUpdates.dateOfBirth'] = language === 'pt' ? 'Informe a data de nascimento do pai' : 'Enter father date of birth';
  } else if (!validateNotFutureDate(father.dateOfBirth)) {
    errs['fatherUpdates.dateOfBirth'] = language === 'pt' ? 'Data de nascimento do pai não pode ser no futuro' : 'Father date of birth cannot be in the future';
  }
  if (!father?.occupation?.trim()) {
    errs['fatherUpdates.occupation'] = language === 'pt' ? 'Informe a profissão do pai' : 'Enter father occupation';
  }
  if (!father?.education) {
    errs['fatherUpdates.education'] = language === 'pt' ? 'Selecione a escolaridade do pai' : 'Select father education';
  }
  if (!father?.address?.country) {
    errs['fatherUpdates.address.country'] = language === 'pt' ? 'Selecione o país' : 'Select country';
  }
  if (father?.address?.country === 'BR') {
    if (!father?.address?.state) errs['fatherUpdates.address.state'] = language === 'pt' ? 'Selecione o estado' : 'Select state';
  }
  if (father?.address?.country && !father?.address?.city?.trim()) {
    errs['fatherUpdates.address.city'] = language === 'pt' ? 'Informe a cidade' : 'Enter city';
  }
  if (!father?.address?.street?.trim()) errs['fatherUpdates.address.street'] = language === 'pt' ? 'Informe a rua' : 'Enter street';
  if (!father?.address?.number?.trim()) errs['fatherUpdates.address.number'] = language === 'pt' ? 'Informe o número' : 'Enter number';

  if (!mother?.email?.trim()) {
    errs['motherUpdates.email'] = language === 'pt' ? 'Informe o email da mãe' : 'Enter mother email';
  } else if (!validateEmail(mother.email)) {
    errs['motherUpdates.email'] = language === 'pt' ? 'Email da mãe inválido' : 'Invalid mother email';
  }
  if (!mother?.phone?.trim()) {
    errs['motherUpdates.phone'] = language === 'pt' ? 'Informe o telefone da mãe' : 'Enter mother phone';
  }
  if (!mother?.idNumber?.trim()) {
    errs['motherUpdates.idNumber'] = language === 'pt' ? 'Informe o RG/Passaporte da mãe' : 'Enter mother ID/Passport';
  }
  if (!mother?.idIssueDate) {
    errs['motherUpdates.idIssueDate'] = language === 'pt' ? 'Informe a data de emissão do documento da mãe' : 'Enter mother document issue date';
  }
  if (!mother?.idIssuer) {
    errs['motherUpdates.idIssuer'] = language === 'pt' ? 'Selecione o órgão emissor da mãe' : 'Select mother issuing authority';
  }
  if (!mother?.dateOfBirth) {
    errs['motherUpdates.dateOfBirth'] = language === 'pt' ? 'Informe a data de nascimento da mãe' : 'Enter mother date of birth';
  } else if (!validateNotFutureDate(mother.dateOfBirth)) {
    errs['motherUpdates.dateOfBirth'] = language === 'pt' ? 'Data de nascimento da mãe não pode ser no futuro' : 'Mother date of birth cannot be in the future';
  }
  if (!mother?.occupation?.trim()) {
    errs['motherUpdates.occupation'] = language === 'pt' ? 'Informe a profissão da mãe' : 'Enter mother occupation';
  }
  if (!mother?.education) {
    errs['motherUpdates.education'] = language === 'pt' ? 'Selecione a escolaridade da mãe' : 'Select mother education';
  }

  if (Object.keys(errs).length > 0) {
    toast.error(Object.values(errs)[0]);
    setFieldErrors(errs); scrollToFirstError(); return false;
  }

  // Duplicate CPF + RG check (students + parents)
  const normCpf = (v: string | undefined | null) => v?.replace(/\D/g, '') || '';
  const normId = (v: string | undefined | null) => v?.trim().toLowerCase() || '';

  const cpfEntries: { label: string; value: string }[] = [];
  const idEntries: { label: string; value: string }[] = [];

  if (numStudents > 1) {
    for (let i = 0; i < numStudents; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ei = getValues(`studentsEnrollment.${i}.enrollmentInfo` as any) as any;
      const childName = enrollmentStudents[i]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`;
      const sCpf = normCpf(ei?.studentCpf);
      if (sCpf) cpfEntries.push({ label: language === 'pt' ? `CPF do aluno (${childName})` : `Student CPF (${childName})`, value: sCpf });
      const sId = normId(ei?.studentIdNumber);
      if (sId) idEntries.push({ label: language === 'pt' ? `RG/Passaporte do aluno (${childName})` : `Student ID (${childName})`, value: sId });
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ei = getValues('enrollmentInfo') as any;
    const sCpf = normCpf(ei?.studentCpf);
    if (sCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do aluno' : 'Student CPF', value: sCpf });
    const sId = normId(ei?.studentIdNumber);
    if (sId) idEntries.push({ label: language === 'pt' ? 'RG/Passaporte do aluno' : 'Student ID', value: sId });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fCpf = normCpf(father?.cpf || (enrollmentData as any)?.father?.cpf);
  if (fCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do pai' : 'Father CPF', value: fCpf });
  const fId = normId(father?.idNumber);
  if (fId) idEntries.push({ label: language === 'pt' ? 'RG/Passaporte do pai' : 'Father ID', value: fId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mCpf = normCpf(mother?.cpf || (enrollmentData as any)?.mother?.cpf);
  if (mCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF da mãe' : 'Mother CPF', value: mCpf });
  const mId = normId(mother?.idNumber);
  if (mId) idEntries.push({ label: language === 'pt' ? 'RG/Passaporte da mãe' : 'Mother ID', value: mId });

  for (let a = 0; a < cpfEntries.length; a++) {
    for (let b = a + 1; b < cpfEntries.length; b++) {
      if (cpfEntries[a].value === cpfEntries[b].value) {
        toast.error(language === 'pt'
          ? `${cpfEntries[a].label} é igual ao ${cpfEntries[b].label}`
          : `${cpfEntries[a].label} is the same as ${cpfEntries[b].label}`);
        return false;
      }
    }
  }
  for (let a = 0; a < idEntries.length; a++) {
    for (let b = a + 1; b < idEntries.length; b++) {
      if (idEntries[a].value === idEntries[b].value) {
        toast.error(language === 'pt'
          ? `${idEntries[a].label} é igual ao ${idEntries[b].label}`
          : `${idEntries[a].label} is the same as ${idEntries[b].label}`);
        return false;
      }
    }
  }

  setFieldErrors({});
  return true;
}
