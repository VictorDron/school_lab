// Enrollment form constants

export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'NAO_SEI', label: 'Não sei' },
];

export const MEDICAL_CONDITIONS = [
  { value: 'NONE', labelPt: 'Nenhuma', labelEn: 'None' },
  { value: 'NEUROLOGICAL', labelPt: 'Neurológicas', labelEn: 'Neurological' },
  { value: 'CARDIAC', labelPt: 'Cardíacas', labelEn: 'Cardiac' },
  { value: 'RESPIRATORY', labelPt: 'Respiratórias', labelEn: 'Respiratory' },
  { value: 'VISUAL', labelPt: 'Visuais', labelEn: 'Visual' },
  { value: 'HEARING', labelPt: 'Auditivas', labelEn: 'Hearing' },
  { value: 'MOTOR', labelPt: 'Motoras', labelEn: 'Motor' },
  { value: 'LEARNING', labelPt: 'Aprendizado', labelEn: 'Learning' },
  { value: 'PSYCHIATRIC', labelPt: 'Psiquiátricas', labelEn: 'Psychiatric' },
  { value: 'METABOLIC', labelPt: 'Metabólicas', labelEn: 'Metabolic' },
  { value: 'OTHER', labelPt: 'Outras', labelEn: 'Other' },
];

export const ALLERGY_TYPES = [
  { value: 'NONE', labelPt: 'Nenhuma', labelEn: 'None' },
  { value: 'MOLD', labelPt: 'Mofo', labelEn: 'Mold' },
  { value: 'DUST', labelPt: 'Poeira', labelEn: 'Dust' },
  { value: 'ANIMAL_HAIR', labelPt: 'Pelos de animais', labelEn: 'Animal hair' },
  { value: 'INSECTS', labelPt: 'Insetos', labelEn: 'Insects' },
  { value: 'FOOD', labelPt: 'Alimentos', labelEn: 'Food' },
  { value: 'MEDICINE', labelPt: 'Medicamentos', labelEn: 'Medicine' },
  { value: 'CHEMICALS', labelPt: 'Produtos químicos', labelEn: 'Chemicals' },
  { value: 'LATEX', labelPt: 'Látex', labelEn: 'Latex' },
  { value: 'POLLEN', labelPt: 'Pólen', labelEn: 'Pollen' },
  { value: 'OTHER', labelPt: 'Outras', labelEn: 'Other' },
];

export const FEVER_MEDICATIONS = [
  { value: 'PARACETAMOL', labelPt: 'Paracetamol', labelEn: 'Paracetamol' },
  { value: 'DIPIRONA', labelPt: 'Dipirona', labelEn: 'Dipyrone' },
  { value: 'IBUPROFEN', labelPt: 'Ibuprofeno', labelEn: 'Ibuprofen' },
  { value: 'NONE', labelPt: 'Nenhum', labelEn: 'None' },
  { value: 'OTHER', labelPt: 'Outro', labelEn: 'Other' },
];

export const PAIN_MEDICATIONS = [
  { value: 'PARACETAMOL', labelPt: 'Paracetamol', labelEn: 'Paracetamol' },
  { value: 'DIPIRONA', labelPt: 'Dipirona', labelEn: 'Dipyrone' },
  { value: 'IBUPROFEN', labelPt: 'Ibuprofeno', labelEn: 'Ibuprofen' },
  { value: 'SIMETHICONE', labelPt: 'Simeticona (cólica)', labelEn: 'Simethicone (colic)' },
  { value: 'NONE', labelPt: 'Nenhum', labelEn: 'None' },
  { value: 'OTHER', labelPt: 'Outro', labelEn: 'Other' },
];

export const DROPOFF_PICKUP_OPTIONS = [
  { value: 'FATHER', labelPt: 'Pai', labelEn: 'Father' },
  { value: 'MOTHER', labelPt: 'Mãe', labelEn: 'Mother' },
  { value: 'THIRD_PARTY', labelPt: 'Terceiro', labelEn: 'Third party' },
];

export const TRANSPORT_METHODS = [
  { value: 'CAR', labelPt: 'Carro particular', labelEn: 'Private car' },
  { value: 'WALK', labelPt: 'A pé', labelEn: 'Walk' },
  { value: 'PUBLIC', labelPt: 'Transporte público', labelEn: 'Public transport' },
  { value: 'BICYCLE', labelPt: 'Bicicleta', labelEn: 'Bicycle' },
  { value: 'OTHER', labelPt: 'Outro', labelEn: 'Other' },
];

export const RELATIONSHIP_OPTIONS = [
  { value: 'GRANDPARENT', labelPt: 'Avô/Avó', labelEn: 'Grandparent' },
  { value: 'UNCLE_AUNT', labelPt: 'Tio/Tia', labelEn: 'Uncle/Aunt' },
  { value: 'SIBLING', labelPt: 'Irmão/Irmã', labelEn: 'Sibling' },
  { value: 'NANNY', labelPt: 'Babá', labelEn: 'Nanny' },
  { value: 'DRIVER', labelPt: 'Motorista', labelEn: 'Driver' },
  { value: 'NEIGHBOR', labelPt: 'Vizinho', labelEn: 'Neighbor' },
  { value: 'FRIEND', labelPt: 'Amigo da família', labelEn: 'Family friend' },
  { value: 'OTHER', labelPt: 'Outro', labelEn: 'Other' },
];

export const FINANCIAL_RELATIONSHIP_OPTIONS = [
  { value: 'GRANDPARENT', labelPt: 'Avô/Avó', labelEn: 'Grandparent' },
  { value: 'UNCLE_AUNT', labelPt: 'Tio/Tia', labelEn: 'Uncle/Aunt' },
  { value: 'SIBLING', labelPt: 'Irmão/Irmã', labelEn: 'Sibling' },
  { value: 'FRIEND', labelPt: 'Amigo da família', labelEn: 'Family friend' },
];

export const PERSON_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', labelPt: 'Pessoa Física', labelEn: 'Individual' },
  { value: 'INDIVIDUAL_ABROAD', labelPt: 'Pessoa Física Exterior', labelEn: 'Individual (Abroad)' },
];

export const FINANCIAL_PERSON_TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', labelPt: 'Pessoa Física', labelEn: 'Individual' },
  { value: 'COMPANY', labelPt: 'Pessoa Jurídica', labelEn: 'Company' },
];

// ID Issuing Authority options (Órgãos Emissores de RG no Brasil)
export const ID_ISSUER_OPTIONS = [
  { value: 'SSP', label: 'SSP - Secretaria de Segurança Pública' },
  { value: 'PM', label: 'PM - Polícia Militar' },
  { value: 'PC', label: 'PC - Polícia Civil' },
  { value: 'CNT', label: 'CNT - Carteira Nacional de Habilitação' },
  { value: 'DIC', label: 'DIC - Diretoria de Identificação Civil' },
  { value: 'CTPS', label: 'CTPS - Carteira de Trabalho e Previdência Social' },
  { value: 'FGTS', label: 'FGTS - Fundo de Garantia do Tempo de Serviço' },
  { value: 'IFP', label: 'IFP - Instituto Félix Pacheco' },
  { value: 'IPF', label: 'IPF - Instituto Pereira Faustino' },
  { value: 'IML', label: 'IML - Instituto Médico Legal' },
  { value: 'MTE', label: 'MTE - Ministério do Trabalho e Emprego' },
  { value: 'MMA', label: 'MMA - Ministério da Marinha' },
  { value: 'MAE', label: 'MAE - Ministério da Aeronáutica' },
  { value: 'MEX', label: 'MEX - Ministério do Exército' },
  { value: 'POF', label: 'POF - Polícia Federal' },
  { value: 'POM', label: 'POM - Polícia Militar' },
  { value: 'SDS', label: 'SDS - Secretaria de Defesa Social' },
  { value: 'SJS', label: 'SJS - Secretaria da Justiça e Segurança' },
  { value: 'SJTS', label: 'SJTS - Secretaria da Justiça do Trabalho e Segurança' },
  { value: 'SES', label: 'SES - Secretaria de Estado da Segurança' },
  { value: 'SESP', label: 'SESP - Secretaria de Estado de Segurança Pública' },
  { value: 'DETRAN', label: 'DETRAN - Departamento de Trânsito' },
  { value: 'OAB', label: 'OAB - Ordem dos Advogados do Brasil' },
  { value: 'CRM', label: 'CRM - Conselho Regional de Medicina' },
  { value: 'CRO', label: 'CRO - Conselho Regional de Odontologia' },
  { value: 'CRA', label: 'CRA - Conselho Regional de Administração' },
  { value: 'CRC', label: 'CRC - Conselho Regional de Contabilidade' },
  { value: 'CREA', label: 'CREA - Conselho Regional de Engenharia e Agronomia' },
  { value: 'CRF', label: 'CRF - Conselho Regional de Farmácia' },
  { value: 'COREN', label: 'COREN - Conselho Regional de Enfermagem' },
  { value: 'OUTROS', label: 'Outros' },
];
