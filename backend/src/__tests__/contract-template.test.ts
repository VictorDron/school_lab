import { describe, it, expect } from 'vitest';
import {
  generateContractHtml,
  buildContractContratadaParagraph,
  type ContractTemplateData,
  type OperatorEntity,
} from '../templates/contract-template.js';

const fullOperator: OperatorEntity = {
  schoolName: 'Acme Academy',
  legalName: 'Acme Educacional Ltda.',
  cnpj: '12.345.678/0001-99',
  legalAddress: 'Av. Paulista, 1000',
  legalCity: 'São Paulo',
  legalRepresentative: 'Sra. Fulana de Tal, Diretora',
  jurisdiction: 'Comarca de São Paulo - SP',
  internationalMaterialFee: 4500,
};

const baseTemplateData: ContractTemplateData = {
  operator: fullOperator,
  contractCode: 'CTR-1',
  contractDate: '03/04/2026',
  schoolYear: '2026/2027',
  yearStart: '1o de junho de 2026',
  yearEnd: '30 de junho de 2027',
  studentName: 'João Silva',
  studentGrade: '5th Grade',
  financialResponsible: {
    fullName: 'Maria Silva',
    nationality: 'Brasileira',
    dateOfBirth: '01/01/1985',
    maritalStatus: 'Casada',
    occupation: 'Engenheira',
    cpf: '123.456.789-00',
    idNumber: 'MG-12.345.678',
    address: 'Rua A, 100',
    email: 'maria@example.com',
  },
  academicResponsible: {
    fullName: 'João Pai',
    nationality: 'Brasileiro',
    dateOfBirth: '02/02/1983',
    maritalStatus: 'Casado',
    occupation: 'Médico',
    cpf: '111.222.333-44',
    idNumber: 'MG-99.999.999',
    address: 'Rua A, 100',
    email: 'joao@example.com',
  },
  witnesses: [],
  gradeLevel: '3o ao 5o ano',
  totalAnnualValue: 'R$ 87.600,00',
  enrollmentFee: '1.400,00',
  installmentValue: '7.300,00',
  installmentValueDiscount: '5.840,00',
};

describe('buildContractContratadaParagraph', () => {
  it('uses every legal-entity field when all are provided', () => {
    const sentence = buildContractContratadaParagraph(fullOperator);
    expect(sentence).toContain('Acme Educacional Ltda.');
    expect(sentence).toContain('CNPJ sob o nº 12.345.678/0001-99');
    expect(sentence).toContain('com sede em Av. Paulista, 1000');
    expect(sentence).toContain('Sra. Fulana de Tal, Diretora');
  });

  it('falls back to schoolName when legalName is null', () => {
    const sentence = buildContractContratadaParagraph({ ...fullOperator, legalName: null });
    expect(sentence).toContain('Acme Academy');
  });

  it('uses Estatuto-Social fallback when legalRepresentative is null', () => {
    const sentence = buildContractContratadaParagraph({ ...fullOperator, legalRepresentative: null });
    expect(sentence).toContain('representada na forma de seu Estatuto Social');
  });

  it('omits the CNPJ clause when cnpj is null', () => {
    const sentence = buildContractContratadaParagraph({ ...fullOperator, cnpj: null });
    expect(sentence).not.toContain('CNPJ');
  });
});

describe('generateContractHtml — multi-tenant rendering', () => {
  it('does NOT leak the original tenant brand for an arbitrary operator', () => {
    const html = generateContractHtml(baseTemplateData);
    expect(html).not.toContain('International Christian School of Rio de Janeiro');
    expect(html).not.toContain('03.555.214/0001-12');
    expect(html).not.toContain('Dulcídio Cardoso');
  });

  it('uses operator.legalName in the signature block', () => {
    const html = generateContractHtml(baseTemplateData);
    expect(html).toContain('Acme Educacional Ltda.');
  });

  it('uses operator.legalCity in the footer date line', () => {
    const html = generateContractHtml(baseTemplateData);
    expect(html).toContain('São Paulo, 03/04/2026');
  });

  it('uses operator.jurisdiction in clause 5.6', () => {
    const html = generateContractHtml(baseTemplateData);
    expect(html).toContain('foro da Comarca de São Paulo - SP');
  });

  it('falls back to "Comarca de <legalCity>" when jurisdiction is null', () => {
    const html = generateContractHtml({
      ...baseTemplateData,
      operator: { ...fullOperator, jurisdiction: null },
    });
    expect(html).toContain('foro da Comarca de São Paulo');
  });

  it('renders clause 3.8 with the configured fee when internationalMaterialFee is set', () => {
    const html = generateContractHtml(baseTemplateData);
    expect(html).toContain('Taxa de material pedagógico internacional');
    expect(html).toContain('R$&nbsp;4.500,00'.replace('&nbsp;', ' '));
  });

  it('omits clause 3.8 entirely when internationalMaterialFee is null', () => {
    const html = generateContractHtml({
      ...baseTemplateData,
      operator: { ...fullOperator, internationalMaterialFee: null },
    });
    expect(html).not.toContain('Taxa de material pedagógico internacional');
    expect(html).not.toContain('material pedagógico internacional');
  });

  it('substitutes schoolName into the foro fallback when both jurisdiction and legalCity are missing', () => {
    const html = generateContractHtml({
      ...baseTemplateData,
      operator: { ...fullOperator, jurisdiction: null, legalCity: null },
    });
    expect(html).toContain('foro da sede da ESCOLA');
  });
});
