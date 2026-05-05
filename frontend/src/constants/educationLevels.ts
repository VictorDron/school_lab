export interface EducationLevel {
  value: string;
  label: string;
}

export const educationLevels: EducationLevel[] = [
  { value: 'FUNDAMENTAL_INCOMPLETO', label: 'Ensino Fundamental Incompleto' },
  { value: 'FUNDAMENTAL_COMPLETO', label: 'Ensino Fundamental Completo' },
  { value: 'MEDIO_INCOMPLETO', label: 'Ensino Médio Incompleto' },
  { value: 'MEDIO_COMPLETO', label: 'Ensino Médio Completo' },
  { value: 'SUPERIOR_INCOMPLETO', label: 'Ensino Superior Incompleto' },
  { value: 'SUPERIOR_COMPLETO', label: 'Ensino Superior Completo' },
  { value: 'POS_GRADUACAO', label: 'Pós-Graduação' },
  { value: 'MESTRADO', label: 'Mestrado' },
  { value: 'DOUTORADO', label: 'Doutorado' },
];
