export type AdmissionLanguage = 'pt' | 'en';

export interface AdmissionTranslations {
  [key: string]: string;

  next: string;
  previous: string;
  submit: string;
  required: string;
  select: string;
  search: string;
  yes: string;
  no: string;
  add: string;
  remove: string;
  lockedBySchool: string;

  numberOfStudents: string;
  studentTab: string;

  studentInfo: string;
  studentType: string;
  newStudent: string;
  returningStudent: string;
  currentRisStudent: string;
  currentGrade: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  male: string;
  female: string;
  other: string;
  nationality: string;
  desiredGrade: string;

  familyInfo: string;
  fatherInfo: string;
  motherInfo: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  livesWith: string;
  bothParents: string;
  withFather: string;
  withMother: string;
  otherGuardian: string;
  guardianInfo: string;
  notificationContact: string;
  notificationFather: string;
  notificationMother: string;
  notificationBoth: string;
  notificationOptional: string;
  addressInfo: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  siblingsInfo: string;
  siblingsOptional: string;
  siblingsHint: string;
  siblingName: string;
  siblingCpf: string;
  siblingDob: string;
  siblingGrade: string;
  noSiblings: string;

  languagesEducation: string;
  languagesInfo: string;
  studentNativeLanguage: string;
  studentOtherLanguages: string;
  addLanguage: string;
  motherNativeLanguage: string;
  fatherNativeLanguage: string;
  educationHistory: string;
  educationHint: string;
  schoolName: string;
  schoolCountry: string;
  schoolCity: string;
  gradesAttended: string;
  noSchools: string;

  additionalInfo: string;
  psychoEvaluation: string;
  provideDetails: string;
  academicSupport: string;
  healthIssues: string;
  adaptationDifficulty: string;
  otherRelevantInfo: string;
  howDidYouHear: string;
  source: string;

  restrictedAccess: string;
  restrictedMessage: string;
  backToHome: string;
  linkExpired: string;
  expiredMessage: string;
  invalidLink: string;
  invalidMessage: string;
  loadingData: string;
  applicationSubmitted: string;
  submittedMessage: string;
  newApplication: string;
  formTitle: string;
  schoolYear: string;
  timeLimitedLink: string;
  completeFormMessage: string;
  welcomeMessage: string;
  welcomeSubtitle: string;
  brazilianEquivalent: string;
  firstSchoolExperience: string;
  skipEducationHistory: string;
  mayBeFirstSchoolExperience: string;
  hasEducationHistory: string;
  addEducationHistory: string;
  useCustomValue: string;
  noResultsAddCustom: string;

  invalidCpf: string;
  invalidEmail: string;
  invalidPhone: string;
  minNameLength: string;
  futureDateError: string;
  invalidDateRange: string;
  confirmReduceStudents: string;
}

export function buildAdmissionTranslations(language: AdmissionLanguage): AdmissionTranslations {
  const isPt = language === 'pt';
  return {
    next: isPt ? 'Próximo' : 'Next',
    previous: isPt ? 'Anterior' : 'Previous',
    submit: isPt ? 'Enviar Inscrição' : 'Submit Application',
    required: isPt ? 'Campo obrigatório' : 'Required field',
    select: isPt ? 'Selecione...' : 'Select...',
    search: isPt ? 'Buscar...' : 'Search...',
    yes: isPt ? 'Sim' : 'Yes',
    no: isPt ? 'Não' : 'No',
    add: isPt ? 'Adicionar' : 'Add',
    remove: isPt ? 'Remover' : 'Remove',
    lockedBySchool: isPt ? 'Preenchido pela escola' : 'Filled by school',

    numberOfStudents: isPt ? 'Quantos filhos deseja inscrever?' : 'How many children would you like to enroll?',
    studentTab: isPt ? 'Filho' : 'Child',

    studentInfo: isPt ? 'Informações do Aluno' : 'Student Information',
    studentType: isPt ? 'Tipo de Aluno' : 'Student Type',
    newStudent: isPt ? 'Aluno Novo' : 'New Student',
    returningStudent: isPt ? 'Ex-Aluno Retornando' : 'Returning Student',
    currentRisStudent: isPt ? 'Aluno Atual RIS' : 'Current RIS Student',
    currentGrade: isPt ? 'Série Atual do Aluno' : 'Current Grade',
    fullName: isPt ? 'Nome Completo do Aluno(a)' : 'Student Full Name',
    dateOfBirth: isPt ? 'Data de Nascimento do Aluno(a)' : 'Student Date of Birth',
    gender: isPt ? 'Gênero do Aluno(a)' : 'Student Gender',
    male: isPt ? 'Masculino' : 'Male',
    female: isPt ? 'Feminino' : 'Female',
    other: isPt ? 'Outro' : 'Other',
    nationality: isPt ? 'Nacionalidade do Aluno(a)' : 'Student Nationality',
    desiredGrade: isPt ? 'Série Pretendida' : 'Grade Applying For',

    familyInfo: isPt ? 'Informações da Família' : 'Family Information',
    fatherInfo: isPt ? 'Informações do Pai' : "Father's Information",
    motherInfo: isPt ? 'Informações da Mãe' : "Mother's Information",
    name: isPt ? 'Nome Completo' : 'Full Name',
    cpf: isPt ? 'CPF' : 'Individual Tax ID (CPF)',
    email: 'Email',
    phone: isPt ? 'Celular' : 'Phone',
    livesWith: isPt ? 'Com quem o aluno mora?' : 'Who does the student live with?',
    bothParents: isPt ? 'Ambos os Pais' : 'Both Parents',
    withFather: isPt ? 'Com o Pai' : 'With the Father',
    withMother: isPt ? 'Com a Mãe' : 'With the Mother',
    otherGuardian: isPt ? 'Outros' : 'Other',
    guardianInfo: isPt ? 'Nome do responsável e relação' : 'Guardian name and relationship',
    notificationContact: isPt ? 'Quem deve receber as comunicações da escola?' : 'Who should receive school communications?',
    notificationFather: isPt ? 'Pai' : 'Father',
    notificationMother: isPt ? 'Mãe' : 'Mother',
    notificationBoth: isPt ? 'Ambos' : 'Both',
    notificationOptional: isPt
      ? '(Opcional — se não selecionado, a mãe será o contato padrão)'
      : '(Optional — if not selected, mother will be the default contact)',
    addressInfo: isPt ? 'Endereço' : 'Address',
    zipCode: isPt ? 'CEP' : 'Zip Code',
    street: isPt ? 'Rua' : 'Street',
    number: isPt ? 'Número' : 'Number',
    complement: isPt ? 'Complemento' : 'Complement',
    neighborhood: isPt ? 'Bairro' : 'Neighborhood',
    city: isPt ? 'Cidade' : 'City',
    state: isPt ? 'Estado' : 'State',
    country: isPt ? 'País' : 'Country',
    siblingsInfo: isPt ? 'Informações sobre Irmãos' : 'Siblings Information',
    siblingsOptional: isPt ? 'Esta seção é opcional' : 'This section is optional',
    siblingsHint: isPt
      ? 'Preencha apenas se o aluno tiver irmãos. Caso não tenha, basta avançar para a próxima etapa.'
      : 'Fill in only if the student has siblings. If not, just proceed to the next step.',
    siblingName: isPt ? 'Nome' : 'Name',
    siblingCpf: 'CPF',
    siblingDob: isPt ? 'Data de Nascimento' : 'Date of Birth',
    siblingGrade: isPt ? 'Série' : 'Grade',
    noSiblings: isPt ? 'Nenhum irmão adicionado' : 'No siblings added',

    languagesEducation: isPt ? 'Idiomas e Histórico Educacional' : 'Languages & Education History',
    languagesInfo: isPt ? 'Informações sobre Idiomas' : 'Language Information',
    studentNativeLanguage: isPt ? 'Idioma Nativo do Estudante' : "Student's Native Language",
    studentOtherLanguages: isPt ? 'Outros Idiomas do Estudante' : "Student's Other Languages",
    addLanguage: isPt ? 'Adicionar Idioma' : 'Add Language',
    motherNativeLanguage: isPt ? 'Idioma Nativo da Mãe' : "Mother's Native Language",
    fatherNativeLanguage: isPt ? 'Idioma Nativo do Pai' : "Father's Native Language",
    educationHistory: isPt ? 'Histórico Educacional' : 'Education History',
    educationHint: isPt
      ? 'Comece pela última escola frequentada'
      : 'Start with the most recent school attended',
    schoolName: isPt ? 'Nome da Escola' : 'School Name',
    schoolCountry: isPt ? 'País' : 'Country',
    schoolCity: isPt ? 'Cidade' : 'City',
    gradesAttended: isPt ? 'Séries Cursadas' : 'Grades Attended',
    noSchools: isPt ? 'Nenhuma escola adicionada' : 'No schools added',

    additionalInfo: isPt ? 'Informações Adicionais' : 'Additional Information',
    psychoEvaluation: isPt
      ? 'O aluno já passou por avaliações psicoeducacionais, psicológicas, etc?'
      : 'Has the student undergone psychoeducational, psychological evaluations, etc?',
    provideDetails: isPt ? 'Se sim, forneça detalhes' : 'If yes, please provide details',
    academicSupport: isPt
      ? 'O aluno já precisou de suporte acadêmico, social ou emocional?'
      : 'Has the student needed academic, social, or emotional support?',
    healthIssues: isPt
      ? 'O aluno tem problemas de saúde, requisitos médicos, alergias ou toma medicamentos?'
      : 'Does the student have health issues, medical requirements, allergies, or take medication?',
    adaptationDifficulty: isPt
      ? 'O aluno tem dificuldades de se adaptar a novas situações?'
      : 'Does the student have difficulty adapting to new situations?',
    otherRelevantInfo: isPt
      ? 'Existe alguma outra informação relevante sobre a condição do aluno?'
      : 'Is there any other relevant information about the student?',
    howDidYouHear: isPt ? 'Como soube de nós?' : 'How did you hear about us?',
    source: isPt ? 'Origem' : 'Source',

    restrictedAccess: isPt ? 'Acesso Restrito' : 'Restricted Access',
    restrictedMessage: isPt
      ? 'Este formulário só pode ser acessado através de um link enviado pela escola. Entre em contato com a escola para solicitar o seu link de inscrição.'
      : 'This form can only be accessed through a link sent by the school. Please contact the school to request your application link.',
    backToHome: isPt ? 'Voltar ao Início' : 'Back to Home',
    linkExpired: isPt ? 'Link Expirado' : 'Link Expired',
    expiredMessage: isPt
      ? 'Este link de inscrição expirou. Por favor, entre em contato com a escola para solicitar um novo link.'
      : 'This application link has expired. Please contact the school to request a new link.',
    invalidLink: isPt ? 'Link Inválido' : 'Invalid Link',
    invalidMessage: isPt
      ? 'Este link de inscrição não é válido. Verifique se você copiou o link corretamente ou entre em contato com a escola.'
      : 'This application link is not valid. Please verify you copied the link correctly or contact the school.',
    loadingData: isPt ? 'Carregando dados...' : 'Loading data...',
    applicationSubmitted: isPt ? 'Inscrição Enviada!' : 'Application Submitted!',
    submittedMessage: isPt
      ? 'Obrigado pela sua inscrição. Nossa equipe de admissões entrará em contato em breve.'
      : 'Thank you for your application. Our admissions team will contact you soon.',
    newApplication: isPt ? 'Nova Inscrição' : 'New Application',
    formTitle: isPt ? 'Formulário de Admissão' : 'Application for Admission',
    schoolYear: isPt ? 'Ano Letivo 2026-2027' : 'School Year 2026-2027',
    timeLimitedLink: isPt ? 'Link com prazo de validade' : 'Time-limited link',
    completeFormMessage: isPt
      ? 'Complete o formulário antes que o link expire.'
      : 'Please complete the form before the link expires.',
    welcomeMessage: isPt ? 'Bem-vinda, família' : 'Welcome, family',
    welcomeSubtitle: isPt
      ? 'Estamos felizes em recebê-los! Por favor, preencha as informações abaixo.'
      : "We're happy to have you! Please fill in the information below.",
    brazilianEquivalent: isPt ? 'Equivalente brasileiro' : 'Brazilian equivalent',
    firstSchoolExperience: isPt
      ? 'Esta será a primeira experiência escolar do aluno.'
      : "This will be the student's first school experience.",
    skipEducationHistory: isPt
      ? 'Como a série pretendida é a primeira experiência escolar, o histórico educacional não é necessário.'
      : 'Since the desired grade is the first school experience, education history is not required.',
    mayBeFirstSchoolExperience: isPt
      ? 'Para esta série, o histórico escolar geralmente não é necessário.'
      : 'For this grade, education history is usually not required.',
    hasEducationHistory: isPt
      ? 'O aluno já frequentou escola anteriormente? Clique para informar o histórico.'
      : 'Has the student attended school before? Click to provide the history.',
    addEducationHistory: isPt ? 'Informar histórico escolar' : 'Add education history',
    useCustomValue: isPt ? 'Usar valor personalizado' : 'Use custom value',
    noResultsAddCustom: isPt ? 'Nenhum resultado. Digite para adicionar' : 'No results. Type to add',

    invalidCpf: isPt ? 'CPF inválido' : 'Invalid CPF',
    invalidEmail: isPt ? 'Email inválido' : 'Invalid email',
    invalidPhone: isPt ? 'Telefone inválido' : 'Invalid phone number',
    minNameLength: isPt ? 'Mínimo de 3 caracteres' : 'Minimum 3 characters',
    futureDateError: isPt ? 'A data não pode ser futura' : 'Date cannot be in the future',
    invalidDateRange: isPt ? 'Idade do aluno deve ser no máximo 19 anos' : 'Student age must be at most 19 years',
    confirmReduceStudents: isPt
      ? 'Ao reduzir o número de filhos, os dados dos filhos excedentes serão perdidos. Deseja continuar?'
      : 'Reducing the number of children will discard the data of removed children. Do you want to continue?',
  };
}
