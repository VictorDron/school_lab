import type { ColumnMapping } from '../../types/import.types.js';

// Grade mapping: CSV Module values -> system grade strings
export const GRADE_MAP: Record<string, string> = {
  'RIS Nursery': 'Nursery',
  'RIS Pre-K3': 'Pre-K3',
  'RIS Pre-K4': 'Pre-K4',
  'RIS Kinder': 'Kindergarten',
  '1st Grade (1o Ano)': '1st Grade',
  '2nd Grade (2o Ano)': '2nd Grade',
  '3rd Grade (3o Ano)': '3rd Grade',
  '4th Grade (4o Ano)': '4th Grade',
  '5th Grade (5o Ano)': '5th Grade',
  '6th Grade (6o Ano)': '6th Grade',
  '7th Grade (7o Ano)': '7th Grade',
  '8th Grade (8o Ano)': '8th Grade',
  '9th Grade (9o Ano)': '9th Grade',
  '10th Grade (1a Serie)': '10th Grade',
  '11th Grade (2a Serie)': '11th Grade',
  '12th Grade (3a Serie)': '12th Grade',
};

// Complete 96-column CSV-to-Prisma mapping based on dados_base.csv headers
export const COLUMN_MAP: ColumnMapping[] = [
  // --- Enrollment Info (columns 0-2) ---
  { csvIndex: 0, csvHeaderEN: 'Course', csvHeaderPT: 'Curso', targetModel: 'LeadEnrollmentInfo', targetField: 'course', example: 'Pre-school / Pré Escola' },
  { csvIndex: 1, csvHeaderEN: 'Module', csvHeaderPT: 'Módulo', targetModel: 'LeadEnrollmentInfo', targetField: 'module', transform: 'grade', example: 'RIS Pre-K3' },
  { csvIndex: 2, csvHeaderEN: 'Class', csvHeaderPT: 'Turma', targetModel: 'LeadEnrollmentInfo', targetField: 'classGroup', example: 'Pre-K3 A' },

  // --- Student / LeadChild (column 3) ---
  { csvIndex: 3, csvHeaderEN: 'Student', csvHeaderPT: 'Aluno', targetModel: 'LeadChild', targetField: 'fullName', required: true, example: 'João Silva' },

  // --- Health: Physical data (columns 4-6) ---
  { csvIndex: 4, csvHeaderEN: 'Weight', csvHeaderPT: 'Peso', targetModel: 'LeadChildHealth', targetField: 'weight', example: '20 kg' },
  { csvIndex: 5, csvHeaderEN: 'Height', csvHeaderPT: 'Altura', targetModel: 'LeadChildHealth', targetField: 'height', example: '1,05 m' },
  { csvIndex: 6, csvHeaderEN: 'Blood type', csvHeaderPT: 'Tipo sanguíneo e fator RH', targetModel: 'LeadChildHealth', targetField: 'bloodType', example: 'O+' },

  // --- Health: Medical conditions (columns 7-8) ---
  { csvIndex: 7, csvHeaderEN: 'Any health concerns or medical problems?', csvHeaderPT: 'Alguma preocupação de saúde ou problema médico?', targetModel: 'LeadChildHealth', targetField: 'medicalConditionsNotes', example: '-' },
  { csvIndex: 8, csvHeaderEN: 'Any Hospitalization/ Surgeries', csvHeaderPT: 'Alguma Hospitalização/ Cirurgias', targetModel: 'LeadChildHealth', targetField: 'hasHospitalizations', transform: 'boolean', example: 'No| Não' },
  { csvIndex: 9, csvHeaderEN: 'If positive, please provide details', csvHeaderPT: 'Caso positivo, favor fornecer detalhes', targetModel: 'LeadChildHealth', targetField: 'hospitalizationsNotes', example: '-' },

  // --- Health: Seizures (columns 10-11) ---
  { csvIndex: 10, csvHeaderEN: 'In the past has the student experienced seizures or faintings?', csvHeaderPT: 'O aluno apresentou anteriormente convulsões ou desmaios?', targetModel: 'LeadChildHealth', targetField: 'hasSeizures', transform: 'boolean', example: 'No| Não' },
  { csvIndex: 11, csvHeaderEN: 'If positive, please provide details', csvHeaderPT: 'Caso positivo, favor fornecer detalhes (2)', targetModel: 'LeadChildHealth', targetField: 'seizuresNotes', example: '-' },

  // --- Health: Allergies (columns 12-13) ---
  { csvIndex: 12, csvHeaderEN: 'The child is allergic to', csvHeaderPT: 'A criança é alérgica a', targetModel: 'LeadChildHealth', targetField: 'allergies', transform: 'list', example: 'Mold| Mofo, Dust| Poeira' },
  { csvIndex: 13, csvHeaderEN: 'In case of any allergies, please provide details below', csvHeaderPT: 'Em caso de alergias, favor detalhar abaixo', targetModel: 'LeadChildHealth', targetField: 'allergiesNotes', example: 'Alergias respiratórias' },

  // --- Health: Medications (columns 14-19) ---
  { csvIndex: 14, csvHeaderEN: 'Authorized medication in case of fever', csvHeaderPT: 'Medicamento autorizado em caso de febre', targetModel: 'LeadChildHealth', targetField: 'feverMedications', transform: 'list', example: 'Dipirona' },
  { csvIndex: 15, csvHeaderEN: 'Other medication (fever)', csvHeaderPT: 'Outro medicamento', targetModel: 'LeadChildHealth', targetField: 'feverMedicationOther', example: 'Alivium, Novalgina' },
  { csvIndex: 16, csvHeaderEN: 'Authorized medication in case of pain', csvHeaderPT: 'Medicamento autorizado em caso de dor', targetModel: 'LeadChildHealth', targetField: 'painMedications', transform: 'list', example: 'Dipirona' },
  { csvIndex: 17, csvHeaderEN: 'Other medication (pain)', csvHeaderPT: 'Outro medicamento (2)', targetModel: 'LeadChildHealth', targetField: 'painMedicationOther', example: 'Alivium, Novalgina' },
  { csvIndex: 18, csvHeaderEN: 'Medication restrictions in case of accidents', csvHeaderPT: 'Restrição a medicamentos em caso de acidentes', targetModel: 'LeadChildHealth', targetField: 'medicationRestrictions', example: 'Não' },
  { csvIndex: 19, csvHeaderEN: 'Regular medications', csvHeaderPT: 'Uso regular de algum medicamento', targetModel: 'LeadChildHealth', targetField: 'regularMedications', example: 'Não' },

  // --- Emergency Contacts (columns 20-25) ---
  { csvIndex: 20, csvHeaderEN: 'Primary Contact (other than parents)', csvHeaderPT: 'Contato Principal (além dos pais)', targetModel: 'LeadEmergencyContact', targetField: 'primaryName', example: 'Maria Silva (Avó)' },
  { csvIndex: 21, csvHeaderEN: 'Mobile', csvHeaderPT: 'Celular', targetModel: 'LeadEmergencyContact', targetField: 'primaryPhone', example: '021 99999-9999' },
  { csvIndex: 22, csvHeaderEN: 'Email', csvHeaderPT: 'E-mail', targetModel: 'LeadEmergencyContact', targetField: 'primaryEmail', example: 'contato@email.com' },
  { csvIndex: 23, csvHeaderEN: 'Secondary Contact (other than parents)', csvHeaderPT: 'Contato Secundário (além dos pais)', targetModel: 'LeadEmergencyContact', targetField: 'secondaryName', example: 'João Silva (Avô)' },
  { csvIndex: 24, csvHeaderEN: 'Mobile (2)', csvHeaderPT: 'Celular (2)', targetModel: 'LeadEmergencyContact', targetField: 'secondaryPhone', example: '021 99999-9999' },
  { csvIndex: 25, csvHeaderEN: 'Email (2)', csvHeaderPT: 'E-mail (2)', targetModel: 'LeadEmergencyContact', targetField: 'secondaryEmail', example: 'contato2@email.com' },

  // --- Health Plan (columns 26-29) ---
  { csvIndex: 26, csvHeaderEN: 'Operator', csvHeaderPT: 'Operadora', targetModel: 'LeadHealthPlan', targetField: 'operator', example: 'Bradesco' },
  { csvIndex: 27, csvHeaderEN: 'Beneficiary code', csvHeaderPT: 'Código do Beneficiário', targetModel: 'LeadHealthPlan', targetField: 'beneficiaryCode', example: '774016006831038' },
  { csvIndex: 28, csvHeaderEN: 'Plan type', csvHeaderPT: 'Tipo do Plano', targetModel: 'LeadHealthPlan', targetField: 'planType', example: 'Saúde top nacional' },
  { csvIndex: 29, csvHeaderEN: 'Preferred hospital', csvHeaderPT: 'Hospital de preferência na Barra da Tijuca', targetModel: 'LeadHealthPlan', targetField: 'preferredHospital', example: 'Hospital Samaritano' },

  // --- Health: Eating disorder (columns 30-32) ---
  { csvIndex: 30, csvHeaderEN: 'Does the student have any eating disorder', csvHeaderPT: 'O aluno tem algum transtorno alimentar?', targetModel: 'LeadChildHealth', targetField: 'hasEatingDisorder', transform: 'boolean', example: 'No| Não' },
  { csvIndex: 31, csvHeaderEN: 'If positive, please provide details', csvHeaderPT: 'Caso positivo, favor fornecer detalhes (3)', targetModel: 'LeadChildHealth', targetField: 'eatingDisorderNotes', example: '-' },
  { csvIndex: 32, csvHeaderEN: 'Additional health information', csvHeaderPT: 'Informações relevantes adicionais sobre saúde', targetModel: 'LeadChildHealth', targetField: 'additionalHealthInfo', example: 'Nada a adicionar.' },

  // --- Transport: Drop-off/Pick-up (columns 33-37) ---
  { csvIndex: 33, csvHeaderEN: 'Who will be involved in drop-off / pick-up', csvHeaderPT: 'Quem estará envolvido neste procedimento?', targetModel: 'LeadChildTransport', targetField: 'dropoffPickupPersons', transform: 'json', example: 'Mother or Father| Mãe ou Pai' },
  { csvIndex: 34, csvHeaderEN: 'If Others, please describe', csvHeaderPT: 'Se outros, favor descrever', targetModel: 'LeadChildTransport', targetField: 'dropoffPickupOther', example: '-' },
  { csvIndex: 35, csvHeaderEN: 'Transport method', csvHeaderPT: 'Meio de transporte', targetModel: 'LeadChildTransport', targetField: 'transportMethod', example: 'By car' },
  { csvIndex: 36, csvHeaderEN: 'If Others, please describe (transport)', csvHeaderPT: 'Se outros, favor descrever', targetModel: 'LeadChildTransport', targetField: 'transportMethodOther', example: '-' },

  // --- Transport: Vehicles section header (column 37) ---
  { csvIndex: 37, csvHeaderEN: 'Vehicle information', csvHeaderPT: 'Informações sobre veículos', targetModel: 'SKIP', targetField: '_vehicleInfoHeader' },

  // --- Transport: Vehicle 1 (columns 38-41) ---
  { csvIndex: 38, csvHeaderEN: '1st Vehicle', csvHeaderPT: '1º Veículo', targetModel: 'SKIP', targetField: '_vehicle1Header' },
  { csvIndex: 39, csvHeaderEN: 'Model', csvHeaderPT: 'Modelo', targetModel: 'LeadChildTransport', targetField: 'vehicle1Model', example: 'Outlander' },
  { csvIndex: 40, csvHeaderEN: 'Colour', csvHeaderPT: 'Cor', targetModel: 'LeadChildTransport', targetField: 'vehicle1Colour', example: 'Cinza metálico' },
  { csvIndex: 41, csvHeaderEN: 'Plate', csvHeaderPT: 'Placa', targetModel: 'LeadChildTransport', targetField: 'vehicle1Plate', example: 'RKQ2F17' },

  // --- Transport: Vehicle 2 (columns 42-45) ---
  { csvIndex: 42, csvHeaderEN: '2nd Vehicle', csvHeaderPT: '2º Veículo', targetModel: 'SKIP', targetField: '_vehicle2Header' },
  { csvIndex: 43, csvHeaderEN: 'Model (2)', csvHeaderPT: 'Modelo (2)', targetModel: 'LeadChildTransport', targetField: 'vehicle2Model', example: '' },
  { csvIndex: 44, csvHeaderEN: 'Colour (2)', csvHeaderPT: 'Cor (2)', targetModel: 'LeadChildTransport', targetField: 'vehicle2Colour', example: '' },
  { csvIndex: 45, csvHeaderEN: 'Plate (2)', csvHeaderPT: 'Placa (2)', targetModel: 'LeadChildTransport', targetField: 'vehicle2Plate', example: '' },

  // --- Transport: Vehicle 3 (columns 46-49) ---
  { csvIndex: 46, csvHeaderEN: '3rd Vehicle', csvHeaderPT: '3º Veículo', targetModel: 'SKIP', targetField: '_vehicle3Header' },
  { csvIndex: 47, csvHeaderEN: 'Model (3)', csvHeaderPT: 'Modelo (3)', targetModel: 'LeadChildTransport', targetField: 'vehicle3Model', example: '' },
  { csvIndex: 48, csvHeaderEN: 'Colour (3)', csvHeaderPT: 'Cor (3)', targetModel: 'LeadChildTransport', targetField: 'vehicle3Colour', example: '' },
  { csvIndex: 49, csvHeaderEN: 'Plate (3)', csvHeaderPT: 'Placa (3)', targetModel: 'LeadChildTransport', targetField: 'vehicle3Plate', example: '' },

  // --- Transport: Leave alone + Athlete (columns 50-57) ---
  { csvIndex: 50, csvHeaderEN: 'Student allowed to leave alone', csvHeaderPT: 'Aluno autorizado a sair sozinho', targetModel: 'LeadChildTransport', targetField: 'canLeaveAlone', transform: 'boolean', example: 'No| Não' },
  { csvIndex: 51, csvHeaderEN: 'Student athlete late/early schedule', csvHeaderPT: 'Aluno atleta entrada/saída', targetModel: 'LeadChildTransport', targetField: 'isAthlete', transform: 'boolean', example: 'No| No' },

  // --- Transport: Athlete schedule (columns 52-57) ---
  { csvIndex: 52, csvHeaderEN: 'Schedule for late drop-off / early pick-up', csvHeaderPT: 'Cronograma de entrada tardia e saída mais cedo', targetModel: 'SKIP', targetField: '_athleteScheduleHeader' },
  { csvIndex: 53, csvHeaderEN: 'Mon', csvHeaderPT: 'Seg', targetModel: 'LeadChildTransport', targetField: 'scheduleMon', example: '' },
  { csvIndex: 54, csvHeaderEN: 'Tue', csvHeaderPT: 'Terça', targetModel: 'LeadChildTransport', targetField: 'scheduleTue', example: '' },
  { csvIndex: 55, csvHeaderEN: 'Wed', csvHeaderPT: 'Quarta', targetModel: 'LeadChildTransport', targetField: 'scheduleWed', example: '' },
  { csvIndex: 56, csvHeaderEN: 'Thu', csvHeaderPT: 'Quinta', targetModel: 'LeadChildTransport', targetField: 'scheduleThu', example: '' },
  { csvIndex: 57, csvHeaderEN: 'Fri', csvHeaderPT: 'Sexta', targetModel: 'LeadChildTransport', targetField: 'scheduleFri', example: '' },

  // --- Transport: School bus (columns 58-62) ---
  { csvIndex: 58, csvHeaderEN: 'School bus company info', csvHeaderPT: 'Informações sobre transporte escolar', targetModel: 'SKIP', targetField: '_schoolBusHeader' },
  { csvIndex: 59, csvHeaderEN: 'Company name', csvHeaderPT: 'Nome da Empresa', targetModel: 'LeadChildTransport', targetField: 'schoolBusCompany', example: '' },
  { csvIndex: 60, csvHeaderEN: 'Name of the responsible person', csvHeaderPT: 'Nome da pessoa responsável', targetModel: 'LeadChildTransport', targetField: 'schoolBusContactName', example: '' },
  { csvIndex: 61, csvHeaderEN: 'Cell phone', csvHeaderPT: 'Celular', targetModel: 'LeadChildTransport', targetField: 'schoolBusContactPhone', example: '' },
  { csvIndex: 62, csvHeaderEN: 'E-mail', csvHeaderPT: 'Email', targetModel: 'LeadChildTransport', targetField: 'schoolBusContactEmail', example: '' },

  // --- Transport: Legal restrictions (columns 63-64) ---
  { csvIndex: 63, csvHeaderEN: 'Legal restrictions on drop-off/pick-up', csvHeaderPT: 'Restrição legal que afete entrada/saída', targetModel: 'LeadChildTransport', targetField: 'hasLegalRestrictions', transform: 'boolean', example: 'No| Não' },
  { csvIndex: 64, csvHeaderEN: 'Third party authorization', csvHeaderPT: 'Terceiros autorizados', targetModel: 'LeadChildTransport', targetField: 'allowThirdPartyPickup', transform: 'boolean', example: 'Yes| Sim' },

  // --- Transport: Authorized persons section header (columns 65-66) ---
  { csvIndex: 65, csvHeaderEN: 'Authorized persons info', csvHeaderPT: 'Pessoas com autorização permanente', targetModel: 'SKIP', targetField: '_authorizedPersonsHeader' },
  { csvIndex: 66, csvHeaderEN: 'Person #1', csvHeaderPT: 'Pessoa #1', targetModel: 'SKIP', targetField: '_person1Header' },

  // --- Transport: Authorized Person 1 (columns 67-75) ---
  { csvIndex: 67, csvHeaderEN: 'Complete name', csvHeaderPT: 'Nome Completo', targetModel: 'LeadChildTransport', targetField: 'person1Name', example: 'Marisa Silva' },
  { csvIndex: 68, csvHeaderEN: 'ID / Passport', csvHeaderPT: 'Identidade / Passaporte', targetModel: 'LeadChildTransport', targetField: 'person1Document', example: '046213022' },
  { csvIndex: 69, csvHeaderEN: 'CPF', csvHeaderPT: 'CPF', targetModel: 'LeadChildTransport', targetField: 'person1Cpf', example: '74463586704' },
  { csvIndex: 70, csvHeaderEN: 'Email', csvHeaderPT: 'Email', targetModel: 'LeadChildTransport', targetField: 'person1Email', example: '' },
  { csvIndex: 71, csvHeaderEN: 'Relationship with the kid', csvHeaderPT: 'Parentesco com a criança', targetModel: 'LeadChildTransport', targetField: 'person1Relationship', example: 'Avó paterna' },
  { csvIndex: 72, csvHeaderEN: 'Vehicle', csvHeaderPT: 'Veículo', targetModel: 'SKIP', targetField: '_person1VehicleHeader' },
  { csvIndex: 73, csvHeaderEN: 'Model (4)', csvHeaderPT: 'Modelo (4)', targetModel: 'LeadChildTransport', targetField: 'person1VehicleModel', example: '' },
  { csvIndex: 74, csvHeaderEN: 'Colour (4)', csvHeaderPT: 'Cor (4)', targetModel: 'LeadChildTransport', targetField: 'person1VehicleColour', example: '' },
  { csvIndex: 75, csvHeaderEN: 'Plate (4)', csvHeaderPT: 'Placa (4)', targetModel: 'LeadChildTransport', targetField: 'person1VehiclePlate', example: '' },

  // --- Transport: Authorized Person 2 (columns 76-85) ---
  { csvIndex: 76, csvHeaderEN: 'Person #2', csvHeaderPT: 'Pessoa #2', targetModel: 'SKIP', targetField: '_person2Header' },
  { csvIndex: 77, csvHeaderEN: 'Complete name (2)', csvHeaderPT: 'Nome Completo (2)', targetModel: 'LeadChildTransport', targetField: 'person2Name', example: '' },
  { csvIndex: 78, csvHeaderEN: 'ID / Passport (2)', csvHeaderPT: 'Identidade / Passaporte', targetModel: 'LeadChildTransport', targetField: 'person2Document', example: '' },
  { csvIndex: 79, csvHeaderEN: 'CPF (2)', csvHeaderPT: 'CPF (2)', targetModel: 'LeadChildTransport', targetField: 'person2Cpf', example: '' },
  { csvIndex: 80, csvHeaderEN: 'Email (2)', csvHeaderPT: 'Email (2)', targetModel: 'LeadChildTransport', targetField: 'person2Email', example: '' },
  { csvIndex: 81, csvHeaderEN: 'Relationship with the kid (2)', csvHeaderPT: 'Parentesco com a criança (2)', targetModel: 'LeadChildTransport', targetField: 'person2Relationship', example: '' },
  { csvIndex: 82, csvHeaderEN: 'Vehicle (2)', csvHeaderPT: 'Veículo (2)', targetModel: 'SKIP', targetField: '_person2VehicleHeader' },
  { csvIndex: 83, csvHeaderEN: 'Model (5)', csvHeaderPT: 'Modelo (5)', targetModel: 'LeadChildTransport', targetField: 'person2VehicleModel', example: '' },
  { csvIndex: 84, csvHeaderEN: 'Colour (5)', csvHeaderPT: 'Cor (5)', targetModel: 'LeadChildTransport', targetField: 'person2VehicleColour', example: '' },
  { csvIndex: 85, csvHeaderEN: 'Plate (5)', csvHeaderPT: 'Placa (5)', targetModel: 'LeadChildTransport', targetField: 'person2VehiclePlate', example: '' },

  // --- Transport: Authorized Person 3 (columns 86-95) ---
  { csvIndex: 86, csvHeaderEN: 'Person #3', csvHeaderPT: 'Pessoa #3', targetModel: 'SKIP', targetField: '_person3Header' },
  { csvIndex: 87, csvHeaderEN: 'Complete name (3)', csvHeaderPT: 'Nome Completo (3)', targetModel: 'LeadChildTransport', targetField: 'person3Name', example: '' },
  { csvIndex: 88, csvHeaderEN: 'ID / Passport (3)', csvHeaderPT: 'Identidade / Passaporte (2)', targetModel: 'LeadChildTransport', targetField: 'person3Document', example: '' },
  { csvIndex: 89, csvHeaderEN: 'CPF (3)', csvHeaderPT: 'CPF (3)', targetModel: 'LeadChildTransport', targetField: 'person3Cpf', example: '' },
  { csvIndex: 90, csvHeaderEN: 'Email (3)', csvHeaderPT: 'Email (3)', targetModel: 'LeadChildTransport', targetField: 'person3Email', example: '' },
  { csvIndex: 91, csvHeaderEN: 'Relationship with the kid (3)', csvHeaderPT: 'Parentesco com a criança (3)', targetModel: 'LeadChildTransport', targetField: 'person3Relationship', example: '' },
  { csvIndex: 92, csvHeaderEN: 'Vehicle (3)', csvHeaderPT: 'Veículo (3)', targetModel: 'SKIP', targetField: '_person3VehicleHeader' },
  { csvIndex: 93, csvHeaderEN: 'Model (6)', csvHeaderPT: 'Modelo (6)', targetModel: 'LeadChildTransport', targetField: 'person3VehicleModel', example: '' },
  { csvIndex: 94, csvHeaderEN: 'Colour (6)', csvHeaderPT: 'Cor (6)', targetModel: 'LeadChildTransport', targetField: 'person3VehicleColour', example: '' },
  { csvIndex: 95, csvHeaderEN: 'Plate (6)', csvHeaderPT: 'Placa (6)', targetModel: 'LeadChildTransport', targetField: 'person3VehiclePlate', example: '' },
];
