import { z } from 'zod';

// Shared student schema
export const studentSchema = z.object({
  fullName: z.string().min(2, 'Nome do estudante é obrigatório'),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.string().min(1, 'Gênero é obrigatório'),
  nationality: z.string().optional(),
  desiredGrade: z.string().min(1, 'Série desejada é obrigatória'),
  currentGrade: z.string().optional(),
  currentSchool: z.string().optional(),
  specialNeeds: z.string().optional(),
  studentType: z.enum(['NEW', 'RETURNING', 'CURRENT']).default('NEW'),
  primaryLanguage: z.string().min(1, 'Idioma principal é obrigatório'),
  otherLanguages: z.union([z.string(), z.array(z.string())]).optional(),
});

// Extended student schema with per-child education and additional info
export const studentWithDetailsSchema = studentSchema.extend({
  educationHistory: z.array(z.object({
    schoolName: z.string(),
    country: z.string().optional(),
    city: z.string().optional(),
    gradesAttended: z.string().optional(),
  })).default([]),
  additionalInfo: z.object({
    hasPsychoEvaluation: z.boolean().default(false),
    psychoEvaluationDetails: z.string().optional(),
    hasAcademicSupport: z.boolean().default(false),
    academicSupportDetails: z.string().optional(),
    hasHealthIssues: z.boolean().default(false),
    healthIssuesDetails: z.string().optional(),
    hasAdaptationDifficulty: z.boolean().default(false),
    adaptationDifficultyDetails: z.string().optional(),
    otherRelevantInfo: z.string().optional(),
  }).optional(),
});

// Validation schema for public admission form - Complete data capture
// Supports both singular `student` (backward compat) and plural `students`
export const publicAdmissionSchema = z.object({
  // Student information (singular - backward compatibility)
  student: studentSchema.optional(),

  // Students array (new multi-child format)
  students: z.array(studentWithDetailsSchema).min(1).optional(),

  // Living situation
  livesWith: z.string(),
  guardianInfo: z.string().optional(),

  // Father information
  father: z.object({
    name: z.string().min(2, 'Nome do pai é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Telefone é obrigatório'),
    cpf: z.string().optional(),
    occupation: z.string().optional(),
    nativeLanguage: z.string().optional(),
  }),

  // Mother information
  mother: z.object({
    name: z.string().min(2, 'Nome da mãe é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Telefone é obrigatório'),
    cpf: z.string().optional(),
    occupation: z.string().optional(),
    nativeLanguage: z.string().optional(),
  }),

  // Address
  address: z.object({
    country: z.string().min(1, 'País é obrigatório'),
    state: z.string().optional(),
    city: z.string().min(1, 'Cidade é obrigatória'),
    neighborhood: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    zipCode: z.string().optional(),
  }),

  // Siblings (non-applying)
  siblings: z.array(z.object({
    name: z.string(),
    cpf: z.string().optional(),
    dateOfBirth: z.string().optional(),
    grade: z.string().optional(),
    school: z.string().optional(),
  })).default([]),

  // Education history (legacy: shared for single student)
  educationHistory: z.array(z.object({
    schoolName: z.string(),
    country: z.string().optional(),
    city: z.string().optional(),
    gradesAttended: z.string().optional(),
  })).default([]),

  // Additional information (legacy: shared for single student)
  additionalInfo: z.object({
    hasPsychoEvaluation: z.boolean().default(false),
    psychoEvaluationDetails: z.string().optional(),
    hasAcademicSupport: z.boolean().default(false),
    academicSupportDetails: z.string().optional(),
    hasHealthIssues: z.boolean().default(false),
    healthIssuesDetails: z.string().optional(),
    hasAdaptationDifficulty: z.boolean().default(false),
    adaptationDifficultyDetails: z.string().optional(),
    otherRelevantInfo: z.string().optional(),
  }).optional(),

  source: z.string().default('WEBSITE'),
  applicationToken: z.string().optional(),
}).refine(
  (data) => data.student || (data.students && data.students.length > 0),
  { message: 'É necessário informar pelo menos um estudante', path: ['students'] }
);

// ==================== FORM DRAFT SCHEMA ====================

export const formDraftSchema = z.object({
  formType: z.enum(['ADMISSION', 'ENROLLMENT']),
  data: z.record(z.unknown()),
  step: z.number().int().min(1),
});

// ==================== ENROLLMENT FORM SCHEMAS ====================

// Schema for per-child enrollment info
export const childEnrollmentInfoSchema = z.object({
  academicCalendar: z.string().optional().default(''),
  campus: z.string().optional().default(''),
  course: z.string().optional().default(''),
  module: z.string().optional().default(''),
  classGroup: z.string().optional().default(''),
  personType: z.string().min(1, 'Tipo de pessoa é obrigatório'),
  studentCpf: z.string().min(1, 'CPF/Documento do aluno é obrigatório'),
  studentIdNumber: z.string().min(1, 'RG/Passaporte é obrigatório'),
  studentIdIssueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  studentIdIssuer: z.string().min(1, 'Órgão emissor é obrigatório'),
});

// Schema for per-child health data
export const childHealthSchema = z.object({
  weight: z.string().min(1, 'Peso é obrigatório'),
  height: z.string().min(1, 'Altura é obrigatória'),
  bloodType: z.string().min(1, 'Tipo sanguíneo é obrigatório'),
  medicalConditions: z.array(z.string()).min(1, 'Selecione condições médicas ou "Nenhuma"'),
  medicalConditionsNotes: z.string().optional(),
  hasHospitalizations: z.boolean().default(false),
  hospitalizationsNotes: z.string().optional(),
  hasSeizures: z.boolean().default(false),
  seizuresNotes: z.string().optional(),
  allergies: z.array(z.string()).min(1, 'Selecione alergias ou "Nenhuma"'),
  allergiesNotes: z.string().optional(),
  feverMedications: z.array(z.string()).min(1, 'Selecione medicamentos para febre ou "Nenhum"'),
  feverMedicationOther: z.string().optional(),
  painMedications: z.array(z.string()).min(1, 'Selecione medicamentos para dor ou "Nenhum"'),
  painMedicationOther: z.string().optional(),
  medicationRestrictions: z.string().optional(),
  regularMedications: z.string().optional(),
  hasEatingDisorder: z.boolean().default(false),
  eatingDisorderNotes: z.string().optional(),
  additionalHealthInfo: z.string().optional(),
});

// Schema for per-child transport data
export const childTransportSchema = z.object({
  dropoffPickupPersons: z.array(z.string()).default([]),
  dropoffPickupOther: z.string().optional(), // Legacy
  transportMethod: z.string().default(''),
  transportMethodOther: z.string().optional(),
  familyVehicles: z.array(z.object({
    model: z.string(),
    color: z.string(),
    plate: z.string(),
  })).optional().default([]),
  canLeaveAlone: z.boolean().default(false),
  isAthlete: z.boolean().default(false),
  athleteSchedule: z.record(z.object({
    lateEntry: z.string().optional(),
    earlyExit: z.string().optional(),
  })).optional(),
  athleteNotes: z.string().optional(),
  hasLegalRestrictions: z.boolean().default(false),
  legalRestrictionsNotes: z.string().optional(),
  authorizedPersons: z.array(z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
    cpf: z.string().min(1, 'CPF é obrigatório'),
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    bond: z.string().min(1, 'Vínculo é obrigatório'),
    relationship: z.string().optional(), // Legacy
    vehicle: z.object({
      model: z.string().optional().default(''),
      color: z.string().optional().default(''),
      plate: z.string().optional().default(''),
    }).optional(),
  })).optional().default([]),
  // Legacy fields (accepted but not required)
  schoolBusCompany: z.string().optional(),
  schoolBusContactName: z.string().optional(),
  schoolBusContactPhone: z.string().optional(),
  schoolBusContactEmail: z.string().optional(),
  allowThirdPartyPickup: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.canLeaveAlone) {
    if (!data.dropoffPickupPersons || data.dropoffPickupPersons.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione quem faz a entrada/saída',
        path: ['dropoffPickupPersons'],
      });
    }
    if (!data.transportMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o meio de transporte',
        path: ['transportMethod'],
      });
    }
  }
  if (data.transportMethod === 'OTHER' && !data.transportMethodOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Especifique o meio de transporte',
      path: ['transportMethodOther'],
    });
  }
  if (data.dropoffPickupPersons?.includes('THIRD_PARTY')) {
    if (!data.authorizedPersons || data.authorizedPersons.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adicione pelo menos uma pessoa autorizada',
        path: ['authorizedPersons'],
      });
    }
  }
});

// Validation schema for enrollment form
export const publicEnrollmentSchema = z.object({
  enrollmentToken: z.string(),

  // Per-child data (multi-child support)
  childrenData: z.array(z.object({
    childId: z.string(),
    enrollmentInfo: childEnrollmentInfoSchema.optional(),
    health: childHealthSchema.optional(),
    transport: childTransportSchema.optional(),
  })).optional(),

  // General info (Step 1) - legacy: single student (optional when using childrenData)
  enrollmentInfo: z.object({
    academicCalendar: z.string().optional().default(''),
    campus: z.string().optional().default(''),
    course: z.string().optional().default(''),
    module: z.string().optional().default(''),
    classGroup: z.string().optional().default(''),
    personType: z.string().min(1, 'Tipo de pessoa é obrigatório'),
    studentCpf: z.string().min(1, 'CPF/Documento do aluno é obrigatório'),
    studentIdNumber: z.string().min(1, 'RG/Passaporte é obrigatório'),
    studentIdIssueDate: z.string().min(1, 'Data de emissão é obrigatória'),
    studentIdIssuer: z.string().min(1, 'Órgão emissor é obrigatório'),
  }).optional(),

  // Student data updates
  student: z.object({
    desiredGrade: z.string().optional().default(''),
  }).optional(),

  // Parent data updates (editable fields only)
  fatherUpdates: z.object({
    email: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    cpf: z.string().optional().default(''),
    occupation: z.string().optional().default(''),
    idNumber: z.string().optional().default(''),
    idIssueDate: z.string().optional().default(''),
    idIssuer: z.string().optional().default(''),
    dateOfBirth: z.string().optional().default(''),
    education: z.string().optional().default(''),
    religion: z.string().optional().default(''),
    address: z.object({
      zipCode: z.string().optional().default(''),
      country: z.string().optional().default(''),
      state: z.string().optional().default(''),
      city: z.string().optional().default(''),
      neighborhood: z.string().optional().default(''),
      street: z.string().optional().default(''),
      number: z.string().optional().default(''),
      complement: z.string().optional().default(''),
    }).optional(),
    sameAddressAsOtherParent: z.boolean().optional(),
  }).optional(),

  motherUpdates: z.object({
    email: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    cpf: z.string().optional().default(''),
    occupation: z.string().optional().default(''),
    idNumber: z.string().optional().default(''),
    idIssueDate: z.string().optional().default(''),
    idIssuer: z.string().optional().default(''),
    dateOfBirth: z.string().optional().default(''),
    education: z.string().optional().default(''),
    religion: z.string().optional().default(''),
    address: z.object({
      zipCode: z.string().optional().default(''),
      country: z.string().optional().default(''),
      state: z.string().optional().default(''),
      city: z.string().optional().default(''),
      neighborhood: z.string().optional().default(''),
      street: z.string().optional().default(''),
      number: z.string().optional().default(''),
      complement: z.string().optional().default(''),
    }).optional(),
    sameAddressAsOtherParent: z.boolean().optional(),
  }).optional(),

  // Health data (Step 3) - legacy: single student (optional when using childrenData)
  health: z.object({
    weight: z.string().min(1, 'Peso é obrigatório'),
    height: z.string().min(1, 'Altura é obrigatória'),
    bloodType: z.string().min(1, 'Tipo sanguíneo é obrigatório'),
    medicalConditions: z.array(z.string()).min(1, 'Selecione condições médicas ou "Nenhuma"'),
    medicalConditionsNotes: z.string().optional(),
    hasHospitalizations: z.boolean().default(false),
    hospitalizationsNotes: z.string().optional(),
    hasSeizures: z.boolean().default(false),
    seizuresNotes: z.string().optional(),
    allergies: z.array(z.string()).min(1, 'Selecione alergias ou "Nenhuma"'),
    allergiesNotes: z.string().optional(),
    feverMedications: z.array(z.string()).min(1, 'Selecione medicamentos para febre ou "Nenhum"'),
    feverMedicationOther: z.string().optional(),
    painMedications: z.array(z.string()).min(1, 'Selecione medicamentos para dor ou "Nenhum"'),
    painMedicationOther: z.string().optional(),
    medicationRestrictions: z.string().optional(),
    regularMedications: z.string().optional(),
    hasEatingDisorder: z.boolean().default(false),
    eatingDisorderNotes: z.string().optional(),
    additionalHealthInfo: z.string().optional(),
  }).optional(),

  // Emergency contacts - At least one required with name and phone
  emergencyContacts: z.array(z.object({
    name: z.string().min(1, 'Nome do contato é obrigatório'),
    phone: z.string().min(1, 'Telefone do contato é obrigatório'),
    email: z.string().optional().default(''),
    relationship: z.string().optional().default(''),
    isPrimary: z.boolean().default(false),
  })).min(1, 'É necessário pelo menos um contato de emergência'),

  // Health plan
  healthPlan: z.object({
    operator: z.string().optional().default(''),
    beneficiaryCode: z.string().optional().default(''),
    planType: z.string().optional().default(''),
    preferredHospital: z.string().optional().default(''),
  }).optional(),

  // Transport data (Step 4) - Required fields with conditional validation
  transport: childTransportSchema,

  // Financial responsible (Step 5) - Required fields with conditional validation
  financialResponsible: z.object({
    responsibleType: z.enum(['FATHER', 'MOTHER', 'OTHER'], { required_error: 'Selecione o responsável financeiro' }),
    relationship: z.string().optional().default(''),
    personType: z.string().optional().default('INDIVIDUAL'),
    fullName: z.string().optional().default(''),
    cpf: z.string().optional().default(''),
    email: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    companyName: z.string().optional().default(''),
    cnpj: z.string().optional().default(''),
    tradeName: z.string().optional().default(''),
    contactPerson: z.string().optional().default(''),
    contactEmail: z.string().optional().default(''),
    contactPhone: z.string().optional().default(''),
    address: z.object({
      country: z.string().optional().default(''),
      state: z.string().optional().default(''),
      city: z.string().optional().default(''),
      neighborhood: z.string().optional().default(''),
      street: z.string().optional().default(''),
      number: z.string().optional().default(''),
      complement: z.string().optional().default(''),
      zipCode: z.string().optional().default(''),
    }).optional(),
  }).superRefine((data, ctx) => {
    // Validate all fields when OTHER is selected
    if (data.responsibleType === 'OTHER') {
      const personType = data.personType || 'INDIVIDUAL';

      if (personType === 'INDIVIDUAL') {
        // Relationship required only for Pessoa Fisica
        if (!data.relationship?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Parentesco do responsável financeiro é obrigatório',
            path: ['relationship'],
          });
        }
        // Pessoa Fisica validation
        if (!data.fullName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nome completo do responsável financeiro é obrigatório',
            path: ['fullName'],
          });
        }
        if (!data.cpf?.trim() || data.cpf.replace(/\D/g, '').length !== 11) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'CPF válido do responsável financeiro é obrigatório',
            path: ['cpf'],
          });
        }
        if (!data.email?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Email do responsável financeiro é obrigatório',
            path: ['email'],
          });
        }
        if (!data.phone?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Telefone do responsável financeiro é obrigatório',
            path: ['phone'],
          });
        }
      } else if (personType === 'COMPANY') {
        // Pessoa Juridica validation
        if (!data.companyName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Razão Social é obrigatória',
            path: ['companyName'],
          });
        }
        if (!data.cnpj?.trim() || data.cnpj.replace(/\D/g, '').length !== 14) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'CNPJ válido é obrigatório',
            path: ['cnpj'],
          });
        }
        if (!data.contactPerson?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nome do responsável na empresa é obrigatório',
            path: ['contactPerson'],
          });
        }
        if (!data.contactEmail?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Email de contato é obrigatório',
            path: ['contactEmail'],
          });
        }
        if (!data.contactPhone?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Telefone de contato é obrigatório',
            path: ['contactPhone'],
          });
        }
      }

      // Validate address fields (required for both PF and PJ)
      const address = data.address;
      if (!address?.state?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Estado do responsável financeiro é obrigatório',
          path: ['address', 'state'],
        });
      }
      if (!address?.city?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cidade do responsável financeiro é obrigatória',
          path: ['address', 'city'],
        });
      }
      if (!address?.neighborhood?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bairro do responsável financeiro é obrigatório',
          path: ['address', 'neighborhood'],
        });
      }
      if (!address?.street?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rua do responsável financeiro é obrigatória',
          path: ['address', 'street'],
        });
      }
      if (!address?.number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Número do endereço do responsável financeiro é obrigatório',
          path: ['address', 'number'],
        });
      }
    }
  }),

  // Terms (Step 7) - Must be accepted
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar os termos' }) }),
});

// ==================== RE-ENROLLMENT SCHEMA ====================

export const reEnrollmentFormSchema = z.object({
  confirmed: z.boolean().optional().default(true),
  declineReason: z.string().max(500).nullish(),
  health: z.record(z.unknown()).nullish(),
  transport: z.record(z.unknown()).nullish(),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1, 'Nome do contato é obrigatório.'),
    phone: z.string().min(1, 'Telefone do contato é obrigatório.'),
    email: z.string().email('E-mail inválido.').nullish().or(z.literal('')),
    relationship: z.string().nullish(),
    isPrimary: z.boolean().nullish(),
  })).optional(),
  financialResponsible: z.record(z.unknown()).nullish(),
  healthPlan: z.record(z.unknown()).nullish(),
  parentUpdates: z.array(z.object({
    parentId: z.string(),
    email: z.string().email('E-mail inválido.'),
    phone: z.string().optional(),
  })).optional(),
  additionalResponsible: z.object({
    fullName: z.string(),
    email: z.string().email('E-mail inválido.'),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).nullish(),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos LGPD para prosseguir.' }),
  }),
  correctionNotes: z.string().nullish(),
});

// ==================== PRE-RE-ENROLLMENT SCHEMA ====================

export const preReEnrollmentResponseSchema = z.object({
  response: z.enum(['AGREED', 'DISAGREED']),
  reason: z.string().max(500).optional(),
});
