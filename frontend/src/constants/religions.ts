export interface Religion {
  value: string;
  label: string;
}

export const religions: Religion[] = [
  { value: 'CATOLICA', label: 'Católica' },
  { value: 'EVANGELICA', label: 'Evangélica' },
  { value: 'ESPIRITA', label: 'Espírita' },
  { value: 'UMBANDA_CANDOMBLE', label: 'Umbanda/Candomblé' },
  { value: 'JUDAICA', label: 'Judaica' },
  { value: 'ISLAMICA', label: 'Islâmica' },
  { value: 'BUDISTA', label: 'Budista' },
  { value: 'HINDUISTA', label: 'Hinduísta' },
  { value: 'ATEU_AGNOSTICO', label: 'Ateu/Agnóstico' },
  { value: 'OUTRA', label: 'Outra' },
  { value: 'PREFERE_NAO_INFORMAR', label: 'Prefere não informar' },
];
