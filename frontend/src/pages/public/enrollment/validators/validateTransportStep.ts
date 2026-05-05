import toast from 'react-hot-toast';
import { validateCPF } from '@/utils/validation';
import type { AuthorizedPerson, TransportData } from '@/types/enrollment';
import type { ValidatorContext } from './types';

export function validateTransportStep(ctx: ValidatorContext): boolean {
  const {
    watch,
    setValue,
    getValues,
    language,
    enrollmentStudents,
    enrollmentData,
    activeStudentTab,
    setActiveStudentTab,
  } = ctx;

  const numTransportStudents = enrollmentStudents.length;

  const validateTransport = (
    transport: TransportData | undefined,
    authorizedPersons: AuthorizedPerson[] | undefined,
    label: string,
  ) => {
    if (!transport?.canLeaveAlone) {
      if (!transport?.dropoffPickupPersons || transport.dropoffPickupPersons.length === 0) {
        toast.error(`${label}${language === 'pt' ? 'Selecione quem faz a entrada/saída' : 'Select who does drop-off/pick-up'}`);
        return false;
      }
      if (!transport?.transportMethod) {
        toast.error(`${label}${language === 'pt' ? 'Selecione o meio de transporte' : 'Select transport method'}`);
        return false;
      }
      if (transport?.transportMethod === 'OTHER' && !transport?.transportMethodOther?.trim()) {
        toast.error(`${label}${language === 'pt' ? 'Especifique o meio de transporte' : 'Specify transport method'}`);
        return false;
      }
      if (transport?.transportMethod === 'CAR') {
        const familyVehicles = transport.familyVehicles || [];
        if (familyVehicles.length === 0) {
          toast.error(`${label}${language === 'pt' ? 'Adicione pelo menos um veículo da família' : 'Add at least one family vehicle'}`);
          return false;
        }
        for (let i = 0; i < familyVehicles.length; i++) {
          const v = familyVehicles[i];
          if (!v.model?.trim() || !v.color?.trim() || !v.plate?.trim()) {
            toast.error(`${label}${language === 'pt' ? `Preencha todos os dados do veículo ${i + 1}` : `Fill all data for vehicle ${i + 1}`}`);
            return false;
          }
        }
      }
    }
    if (transport?.dropoffPickupPersons?.includes('THIRD_PARTY')) {
      if (!authorizedPersons || authorizedPersons.length === 0) {
        toast.error(`${label}${language === 'pt' ? 'Adicione pelo menos uma pessoa autorizada' : 'Add at least one authorized person'}`);
        return false;
      }
      for (let i = 0; i < authorizedPersons.length; i++) {
        const p = authorizedPersons[i];
        if (!p.name?.trim() || !p.dateOfBirth?.trim() || !p.cpf?.trim() || !p.email?.trim() || !p.bond?.trim()) {
          toast.error(`${label}${language === 'pt' ? `Preencha todos os campos da pessoa autorizada ${i + 1}` : `Fill all fields for authorized person ${i + 1}`}`);
          return false;
        }
        if (p.cpf && validateCPF(p.cpf) !== true) {
          toast.error(`${label}${language === 'pt' ? `Informe um CPF válido para a pessoa autorizada ${i + 1}` : `Enter a valid CPF for authorized person ${i + 1}`}`);
          return false;
        }
      }
    }
    return true;
  };

  const switchToTransportTab = (i: number) => {
    if (i !== activeStudentTab) {
      const currentTransport = getValues('transport');
      const currentAP = getValues('authorizedPersons');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(`studentsEnrollment.${activeStudentTab}.transport` as any, currentTransport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(`studentsEnrollment.${activeStudentTab}.authorizedPersons` as any, currentAP);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newTransport = getValues(`studentsEnrollment.${i}.transport` as any) as TransportData | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newAP = getValues(`studentsEnrollment.${i}.authorizedPersons` as any) as AuthorizedPerson[] | undefined;
      if (newTransport) {
        setValue('transport', { ...getValues('transport'), ...newTransport });
      }
      if (newAP) {
        setValue('authorizedPersons', newAP);
      }
      setActiveStudentTab(i);
    }
  };

  if (numTransportStudents > 1) {
    const currentTransport = getValues('transport');
    const currentAP = getValues('authorizedPersons');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`studentsEnrollment.${activeStudentTab}.transport` as any, currentTransport);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`studentsEnrollment.${activeStudentTab}.authorizedPersons` as any, currentAP);

    for (let i = 0; i < numTransportStudents; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = getValues(`studentsEnrollment.${i}.transport` as any) as TransportData | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ap = getValues(`studentsEnrollment.${i}.authorizedPersons` as any) as AuthorizedPerson[] | undefined;
      const childLabel = ` (${enrollmentStudents[i]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`}): `;
      if (!validateTransport(t, ap, childLabel)) {
        switchToTransportTab(i);
        return false;
      }
    }
  } else {
    const transport = watch('transport');
    const authorizedPersons = watch('authorizedPersons');
    if (!validateTransport(transport, authorizedPersons, '')) {
      return false;
    }
  }

  // Duplicate CPF check: authorized persons (from ALL children) + students + parents
  const normCpf = (v: string | undefined | null) => v?.replace(/\D/g, '') || '';
  const cpfEntries: { label: string; value: string }[] = [];

  if (numTransportStudents > 1) {
    for (let i = 0; i < numTransportStudents; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ei = getValues(`studentsEnrollment.${i}.enrollmentInfo` as any) as any;
      const childName = enrollmentStudents[i]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`;
      const sCpf = normCpf(ei?.studentCpf);
      if (sCpf) cpfEntries.push({ label: language === 'pt' ? `CPF do aluno (${childName})` : `Student CPF (${childName})`, value: sCpf });
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ei = getValues('enrollmentInfo') as any;
    const sCpf = normCpf(ei?.studentCpf);
    if (sCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do aluno' : 'Student CPF', value: sCpf });
  }

  const father = getValues('fatherUpdates');
  const mother = getValues('motherUpdates');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fCpf = normCpf(father?.cpf || (enrollmentData as any)?.father?.cpf);
  if (fCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do pai' : 'Father CPF', value: fCpf });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mCpf = normCpf(mother?.cpf || (enrollmentData as any)?.mother?.cpf);
  if (mCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF da mãe' : 'Mother CPF', value: mCpf });

  if (numTransportStudents > 1) {
    for (let ci = 0; ci < numTransportStudents; ci++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childAP = getValues(`studentsEnrollment.${ci}.authorizedPersons` as any) as AuthorizedPerson[] || [];
      const childName = enrollmentStudents[ci]?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${ci + 1}`;
      for (let i = 0; i < childAP.length; i++) {
        const aCpf = normCpf(childAP[i]?.cpf);
        if (aCpf) cpfEntries.push({ label: language === 'pt' ? `CPF da pessoa autorizada ${i + 1} (${childName})` : `Authorized person ${i + 1} CPF (${childName})`, value: aCpf });
      }
    }
  } else {
    const ap = watch('authorizedPersons') || [];
    for (let i = 0; i < ap.length; i++) {
      const aCpf = normCpf(ap[i]?.cpf);
      if (aCpf) cpfEntries.push({ label: language === 'pt' ? `CPF da pessoa autorizada ${i + 1}` : `Authorized person ${i + 1} CPF`, value: aCpf });
    }
  }

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

  return true;
}
