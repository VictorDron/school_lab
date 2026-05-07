import { FileText, GraduationCap, User, Users } from 'lucide-react';
import { defaultStudentData } from '@/components/public/admission/types';
import type { AdmissionForm } from '@/components/public/admission/types';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const STEPS = [
  { id: 1, icon: User, labelPt: 'Aluno', labelEn: 'Student' },
  { id: 2, icon: Users, labelPt: 'Família', labelEn: 'Family' },
  { id: 3, icon: GraduationCap, labelPt: 'Educação', labelEn: 'Education' },
  { id: 4, icon: FileText, labelPt: 'Adicional', labelEn: 'Additional' },
];

export const STORAGE_KEY = 'admission_form_draft';

export const defaultAdmissionValues: AdmissionForm = {
  numberOfStudents: 1,
  students: [{ ...defaultStudentData }],
  student: {
    studentType: 'NEW',
    currentGrade: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    desiredGrade: '',
  },
  father: { name: '', cpf: '', email: '', phone: '' },
  mother: { name: '', cpf: '', email: '', phone: '' },
  livesWith: 'BOTH',
  guardianInfo: '',
  address: {
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'BR',
  },
  siblings: [],
  languages: {
    studentNative: '',
    studentOther: '',
    motherNative: '',
    fatherNative: '',
  },
  educationHistory: [{ schoolName: '', country: 'BR', city: '', gradesAttended: '' }],
  additionalInfo: {
    hasPsychoEvaluation: 'NO',
    psychoEvaluationDetails: '',
    hasAcademicSupport: 'NO',
    academicSupportDetails: '',
    hasHealthIssues: 'NO',
    healthIssuesDetails: '',
    hasAdaptationDifficulty: 'NO',
    adaptationDifficultyDetails: '',
    otherRelevantInfo: '',
  },
  source: 'WEBSITE',
};
