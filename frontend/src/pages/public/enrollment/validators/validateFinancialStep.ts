import toast from 'react-hot-toast';
import { validateCNPJ, validateCPF } from '@/utils/validation';
import type { AuthorizedPerson } from '@/types/enrollment';
import type { ValidatorContext } from './types';

export function validateFinancialStep(ctx: ValidatorContext): boolean {
  const {
    watch,
    getValues,
    language,
    enrollmentStudents,
    enrollmentData,
  } = ctx;

  const financial = watch('financialResponsible');
  if (!financial?.responsibleType) {
    toast.error(language === 'pt' ? 'Selecione o responsável financeiro' : 'Select financial responsible');
    return false;
  }

  if (financial?.responsibleType !== 'OTHER') {
    return true;
  }

  const personType = financial?.personType || 'INDIVIDUAL';

  if (personType === 'INDIVIDUAL') {
    if (!financial?.relationship?.trim()) {
      toast.error(language === 'pt' ? 'Selecione o parentesco do responsável financeiro' : 'Select financial responsible relationship');
      return false;
    }
    if (!financial?.fullName?.trim()) {
      toast.error(language === 'pt' ? 'Informe o nome completo do responsável financeiro' : 'Enter financial responsible full name');
      return false;
    }
    if (!financial?.cpf?.trim() || validateCPF(financial.cpf) !== true) {
      toast.error(language === 'pt' ? 'Informe um CPF válido do responsável financeiro' : 'Enter a valid financial responsible CPF');
      return false;
    }
    if (!financial?.email?.trim()) {
      toast.error(language === 'pt' ? 'Informe o email do responsável financeiro' : 'Enter financial responsible email');
      return false;
    }
    if (!financial?.phone?.trim()) {
      toast.error(language === 'pt' ? 'Informe o telefone do responsável financeiro' : 'Enter financial responsible phone');
      return false;
    }
  } else if (personType === 'COMPANY') {
    if (!financial?.companyName?.trim()) {
      toast.error(language === 'pt' ? 'Informe a Razão Social' : 'Enter company name');
      return false;
    }
    if (!financial?.cnpj?.trim() || !validateCNPJ(financial.cnpj)) {
      toast.error(language === 'pt' ? 'Informe um CNPJ válido' : 'Enter a valid CNPJ');
      return false;
    }
    if (!financial?.contactPerson?.trim()) {
      toast.error(language === 'pt' ? 'Informe o responsável na empresa' : 'Enter contact person');
      return false;
    }
    if (!financial?.contactEmail?.trim()) {
      toast.error(language === 'pt' ? 'Informe o email de contato' : 'Enter contact email');
      return false;
    }
    if (!financial?.contactPhone?.trim()) {
      toast.error(language === 'pt' ? 'Informe o telefone de contato' : 'Enter contact phone');
      return false;
    }
  }

  const address = financial?.address;
  if (!address?.state) {
    toast.error(language === 'pt' ? 'Selecione o estado do responsável financeiro' : 'Select financial responsible state');
    return false;
  }
  if (!address?.city?.trim()) {
    toast.error(language === 'pt' ? 'Informe a cidade do responsável financeiro' : 'Enter financial responsible city');
    return false;
  }
  if (!address?.neighborhood?.trim()) {
    toast.error(language === 'pt' ? 'Informe o bairro do responsável financeiro' : 'Enter financial responsible neighborhood');
    return false;
  }
  if (!address?.street?.trim()) {
    toast.error(language === 'pt' ? 'Informe a rua do responsável financeiro' : 'Enter financial responsible street');
    return false;
  }
  if (!address?.number?.trim()) {
    toast.error(language === 'pt' ? 'Informe o número do endereço do responsável financeiro' : 'Enter financial responsible address number');
    return false;
  }

  if (personType !== 'INDIVIDUAL') {
    return true;
  }

  // Duplicate CPF check (Pessoa Física only)
  const normCpf = (v: string | undefined | null) => v?.replace(/\D/g, '') || '';
  const numStudents = enrollmentStudents.length;
  const cpfEntries: { label: string; value: string }[] = [];

  if (numStudents > 1) {
    for (let i = 0; i < numStudents; i++) {
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

  if (numStudents > 1) {
    for (let ci = 0; ci < numStudents; ci++) {
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

  const frCpf = normCpf(financial?.cpf);
  if (frCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do responsável financeiro' : 'Financial responsible CPF', value: frCpf });

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
