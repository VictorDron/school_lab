// ==================== CONTRACT TEMPLATE ====================
// Generates the full HTML for a school contract
// "Contrato de Prestação de Serviços Educacionais"
//
// The operator's legal identity (legalName / CNPJ / sede / representative
// / jurisdiction / optional material fee) is sourced from SystemSettings
// and threaded in as `operator`, so the same template renders correct
// paperwork for any tenant.

import type { OperatorEntity } from './addendum-template.js';
export type { OperatorEntity } from './addendum-template.js';

/**
 * Build the rich CONTRATADA paragraph that opens "DAS PARTES". Falls
 * back gracefully when fields are null:
 *  - no legalName → uses schoolName
 *  - no cnpj → CNPJ clause omitted
 *  - no legalRepresentative → "neste ato representada na forma de seu Estatuto Social"
 *  - no legalAddress AND no legalCity → seat clause omitted
 */
export function buildContractContratadaParagraph(operator: OperatorEntity): string {
  const name = operator.legalName?.trim() || operator.schoolName;
  const parts: string[] = [name, 'pessoa jurídica de direito privado'];
  if (operator.cnpj?.trim()) {
    parts.push(`inscrita no CNPJ sob o nº ${operator.cnpj.trim()}`);
  }
  const seat = operator.legalAddress?.trim() || operator.legalCity?.trim();
  if (seat) {
    parts.push(`com sede em ${seat}`);
  }
  if (operator.legalRepresentative?.trim()) {
    parts.push(`neste ato representada por ${operator.legalRepresentative.trim()}`);
  } else {
    parts.push('neste ato representada na forma de seu Estatuto Social');
  }
  return parts.join(', ') + ', doravante denominada simplesmente <strong>ESCOLA</strong>.';
}

/**
 * Format a numeric fee as a Brazilian currency string ("R$ 3.900,00").
 */
function formatBRLFee(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export interface ContractTemplateData {
  operator: OperatorEntity;

  // Contract
  contractCode: string;
  contractDate: string; // formatted DD/MM/YYYY

  // School year
  schoolYear: string; // e.g. "2025/2026"
  yearStart: string; // "1o de junho de 2025"
  yearEnd: string; // "30 de junho de 2026"

  // Student(s) — may contain multiple children separated by " e " (names) or " / " (grades)
  studentName: string;
  studentGrade: string; // e.g. "10th Grade - Sophomore (1a Serie)" or "Kinder / 6th Grade"

  // Financial Responsible (CONTRATANTE - RESPONSAVEL FINANCEIRO)
  financialResponsible: {
    fullName: string;
    nationality: string;
    dateOfBirth: string;
    maritalStatus: string;
    occupation: string;
    cpf: string;
    idNumber: string;
    address: string; // full formatted address
    email: string;
  };

  // Academic Responsible (CONTRATANTE - RESPONSAVEL ACADEMICO)
  academicResponsible: {
    fullName: string;
    nationality: string;
    dateOfBirth: string;
    maritalStatus: string;
    occupation: string;
    cpf: string;
    idNumber: string;
    address: string;
    email: string;
  };

  // Witnesses
  witnesses: Array<{
    name: string;
    cpf?: string;
  }>;

  // Financial
  gradeLevel: string; // used to determine which row in the fee table to highlight (first child's grade)
  gradeLevels?: string[]; // all children's grade levels for multi-child contracts
  totalAnnualValue: string; // formatted R$ XX.XXX,XX
  enrollmentFee: string;
  installmentValue: string; // monthly without discount
  installmentValueDiscount: string; // monthly with 20% discount
  isRenewal?: boolean; // When true, uses renewal title and clause
}

// ==================== FEE TABLE DATA ====================

export const FEE_TABLE = [
  {
    faixa: 'Nursery ao Pre-K4',
    anuidade: '69.600,00',
    entrada: '1.400,00',
    parcela12SemDesc: '5.800,00',
    parcela12ComDesc: '4.640,00',
  },
  {
    faixa: 'Kinder',
    anuidade: '75.600,00',
    entrada: '1.400,00',
    parcela12SemDesc: '6.300,00',
    parcela12ComDesc: '5.040,00',
  },
  {
    faixa: '1o ao 2o ano',
    anuidade: '82.800,00',
    entrada: '1.400,00',
    parcela12SemDesc: '6.900,00',
    parcela12ComDesc: '5.520,00',
  },
  {
    faixa: '3o ao 5o ano',
    anuidade: '87.600,00',
    entrada: '1.400,00',
    parcela12SemDesc: '7.300,00',
    parcela12ComDesc: '5.840,00',
  },
  {
    faixa: '6o ano',
    anuidade: '93.600,00',
    entrada: '1.400,00',
    parcela12SemDesc: '7.800,00',
    parcela12ComDesc: '6.240,00',
  },
  {
    faixa: '7o ao 8o',
    anuidade: '100.800,00',
    entrada: '1.400,00',
    parcela12SemDesc: '8.400,00',
    parcela12ComDesc: '6.720,00',
  },
  {
    faixa: '9o ao 11o ano',
    anuidade: '106.800,00',
    entrada: '1.400,00',
    parcela12SemDesc: '8.900,00',
    parcela12ComDesc: '7.120,00',
  },
  {
    faixa: '12o ano',
    anuidade: '106.800,00',
    entrada: '1.400,00',
    parcela12SemDesc: '8.900,00',
    parcela12ComDesc: '7.120,00',
  },
];

export const FOOD_TABLE = [
  {
    faixa: 'Nursery ao Pre-K4',
    alimentacaoAnual: '8.568,00',
    parcela12Alimentacao: '714,00',
  },
  {
    faixa: 'Kinder ao 5o ano',
    alimentacaoAnual: '9.241,20',
    parcela12Alimentacao: '770,10',
  },
  {
    faixa: '6o ao 12o ano',
    alimentacaoAnual: '9.914,40',
    parcela12Alimentacao: '826,20',
  },
];

// ==================== HTML GENERATION ====================

export function generateContractHtml(data: ContractTemplateData): string {
  // Renewal-aware title and clause
  const contractTitle = data.isRenewal
    ? 'Contrato de Renovação de Prestação de Serviços Educacionais'
    : 'Contrato de Prestação de Serviços Educacionais';

  const renewalClause = data.isRenewal
    ? `<p style="margin-top: 12px; margin-bottom: 12px;"><strong>CLÁUSULA DE RENOVAÇÃO:</strong> O presente contrato constitui renovação do vínculo educacional já existente entre as partes, mantendo-se as condições pedagógicas e os termos do contrato original, com atualização dos valores conforme tabela vigente para o ano letivo em referência.</p>`
    : '';

  // Highlight rows for all children's grade levels
  const allGradeLevels = data.gradeLevels && data.gradeLevels.length > 0
    ? new Set(data.gradeLevels)
    : new Set(data.gradeLevel ? [data.gradeLevel] : []);
  const feeTableRows = FEE_TABLE.map((row) => {
    const isHighlighted = allGradeLevels.has(row.faixa);
    const style = isHighlighted
      ? 'background-color: #e6f3ff; font-weight: bold;'
      : '';
    return `
      <tr style="${style}">
        <td>${row.faixa}</td>
        <td style="text-align: right;">R$ ${row.anuidade}</td>
        <td style="text-align: right;">R$ ${row.entrada}</td>
        <td style="text-align: right;">R$ ${row.parcela12SemDesc}</td>
        <td style="text-align: right;">R$ ${row.parcela12ComDesc}</td>
      </tr>`;
  }).join('\n');

  const foodTableRows = FOOD_TABLE.map((row) => {
    return `
      <tr>
        <td>${row.faixa}</td>
        <td style="text-align: right;">R$ ${row.alimentacaoAnual}</td>
        <td style="text-align: right;">R$ ${row.parcela12Alimentacao}</td>
      </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${contractTitle} - ${data.contractCode}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      padding: 2cm;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header h2 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .year-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 16px;
      border-bottom: 1px solid #000;
      padding-bottom: 6px;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .clause-title {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 6px;
    }
    .item {
      margin-bottom: 6px;
      text-align: justify;
    }
    .item-number {
      font-weight: bold;
    }
    .indent {
      margin-left: 20px;
    }
    table.fee-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    table.fee-table th,
    table.fee-table td {
      border: 1px solid #333;
      padding: 4px 6px;
    }
    table.fee-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    .signature-area {
      margin-top: 40px;
    }
    .signature-line {
      margin-top: 50px;
      text-align: center;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      width: 300px;
      margin: 0 auto;
      padding-top: 4px;
    }
    .witnesses {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .witness-box {
      width: 45%;
    }
    .witness-box .line {
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 30px;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- ==================== HEADER ==================== -->
  <div class="header" style="border: 1.5px solid #1a3366; padding: 15px 20px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 20px;">
    <h1 style="font-size: 18pt; margin: 0;">${contractTitle}</h1>
  </div>

  <!-- ==================== ANO LETIVO ==================== -->
  <div class="year-line">
    <span>ANO LETIVO ${data.schoolYear}</span>
    <span>Ano/Série: ${data.studentGrade}</span>
  </div>

  <!-- ==================== DAS PARTES ==================== -->
  <div class="section-title">DAS PARTES</div>

  <div class="item">
    <span class="item-number">1.</span> <strong>CONTRATADA:</strong> ${buildContractContratadaParagraph(data.operator)}
  </div>

  <div class="item">
    <span class="item-number">2.</span> <strong>CONTRATANTE - RESPONSÁVEL FINANCEIRO:</strong><br/>
    Nome completo: <strong>${data.financialResponsible.fullName}</strong><br/>
    Nacionalidade: ${data.financialResponsible.nationality} |
    Data de nascimento: ${data.financialResponsible.dateOfBirth} |
    Estado civil: ${data.financialResponsible.maritalStatus}<br/>
    Profissão: ${data.financialResponsible.occupation}<br/>
    CPF: ${data.financialResponsible.cpf} |
    RG/Passaporte: ${data.financialResponsible.idNumber}<br/>
    Endereço: ${data.financialResponsible.address}<br/>
    E-mail: ${data.financialResponsible.email}<br/>
    Doravante denominado(a) simplesmente <strong>RESPONSÁVEL FINANCEIRO</strong>.
  </div>

  <div class="item">
    <span class="item-number">3.</span> <strong>CONTRATANTE - RESPONSÁVEL ACADÊMICO:</strong><br/>
    Nome completo: <strong>${data.academicResponsible.fullName}</strong><br/>
    Nacionalidade: ${data.academicResponsible.nationality} |
    Data de nascimento: ${data.academicResponsible.dateOfBirth} |
    Estado civil: ${data.academicResponsible.maritalStatus}<br/>
    Profissão: ${data.academicResponsible.occupation}<br/>
    CPF: ${data.academicResponsible.cpf} |
    RG/Passaporte: ${data.academicResponsible.idNumber}<br/>
    Endereço: ${data.academicResponsible.address}<br/>
    E-mail: ${data.academicResponsible.email}<br/>
    Doravante denominado(a) simplesmente <strong>RESPONSÁVEL ACADÊMICO</strong>.
  </div>

  <div class="item" style="margin-top: 12px;">
    As partes acima qualificadas celebram o presente Contrato de Prestação de Serviços Educacionais em benefício do(a)(s) aluno(a)(s) <strong>${data.studentName}</strong>, matriculado(a)(s) na série <strong>${data.studentGrade}</strong>, nos termos e condições a seguir estipulados.
  </div>

  ${renewalClause}

  <!-- ==================== CLAUSULA 1a ==================== -->
  <div class="clause-title">CLÁUSULA 1ª - DO OBJETO E NATUREZA DO CONTRATO</div>

  <div class="item">
    <span class="item-number">1.1.</span> O presente contrato tem como objeto a prestação de serviços educacionais pela <strong>ESCOLA</strong> ao(a) aluno(a) indicado(a), compreendendo o ensino regular conforme o currículo da instituição, para o ano letivo de <strong>${data.schoolYear}</strong>.
  </div>

  <div class="item">
    <span class="item-number">1.2.</span> A <strong>ESCOLA</strong> adota currículo próprio bilíngue (português e inglês), em conformidade com as diretrizes educacionais brasileiras e internacionais, incluindo atividades pedagógicas, avaliativas e extracurriculares que integram seu projeto pedagógico.
  </div>

  <div class="item">
    <span class="item-number">1.3.</span> A prestação de serviços educacionais inclui: aulas regulares do currículo, uso das instalações escolares durante o período letivo, acompanhamento pedagógico, atividades avaliativas, reuniões de pais programadas e acesso ao portal acadêmico.
  </div>

  <div class="item">
    <span class="item-number">1.4.</span> Não estão incluídos nos serviços contratados: transporte escolar, alimentação (salvo quando expressamente contratada), atividades extracurriculares opcionais, material didático internacional, uniformes, viagens pedagógicas e quaisquer outros serviços não previstos neste contrato.
  </div>

  <div class="item">
    <span class="item-number">1.5.</span> A <strong>ESCOLA</strong> reserva-se o direito de organizar suas turmas, definir horários, selecionar seu corpo docente e estabelecer seus métodos pedagógicos, conforme seu projeto pedagógico e regimento interno.
  </div>

  <div class="item">
    <span class="item-number">1.6.</span> O(A) aluno(a) deverá cumprir as normas do Regimento Interno da <strong>ESCOLA</strong>, o qual é parte integrante deste contrato, declarando o(a) <strong>RESPONSÁVEL FINANCEIRO</strong> e o(a) <strong>RESPONSÁVEL ACADÊMICO</strong> terem conhecimento de seu inteiro teor.
  </div>

  <div class="item">
    <span class="item-number">1.7.</span> A <strong>ESCOLA</strong> poderá, a seu exclusivo critério, suspender ou cancelar a matrícula do(a) aluno(a) em caso de inadimplência, conforme previsto neste contrato e na legislação vigente, resguardado o direito de conclusão do bimestre letivo em curso.
  </div>

  <div class="item">
    <span class="item-number">1.8.</span> O(A) <strong>RESPONSÁVEL FINANCEIRO</strong> e o(a) <strong>RESPONSÁVEL ACADÊMICO</strong> declaram estar cientes de que a <strong>ESCOLA</strong> poderá efetuar registros fotográficos e de vídeo do(a) aluno(a) para fins pedagógicos e institucionais, respeitada a Lei Geral de Proteção de Dados (LGPD).
  </div>

  <div class="item">
    <span class="item-number">1.9.</span> A <strong>ESCOLA</strong> manterá seguro de acidentes pessoais coletivo para os alunos durante o período em que estiverem nas dependências da instituição, nos termos da apólice vigente.
  </div>

  <div class="item">
    <span class="item-number">1.10.</span> A vaga é pessoal e intransferível, não podendo ser cedida a terceiros sem autorização expressa da <strong>ESCOLA</strong>.
  </div>

  <div class="item">
    <span class="item-number">1.11.</span> As partes reconhecem que este contrato é regido pela legislação brasileira, em especial pelo Código de Defesa do Consumidor (Lei 8.078/90), pela Lei de Diretrizes e Bases da Educação Nacional (Lei 9.394/96) e pelo Código Civil (Lei 10.406/2002).
  </div>

  <!-- ==================== CLAUSULA 2a ==================== -->
  <div class="clause-title">CLÁUSULA 2ª - DA DURAÇÃO DO CONTRATO</div>

  <div class="item">
    <span class="item-number">2.1.</span> O presente contrato tem vigência para o ano letivo de <strong>${data.schoolYear}</strong>, com início em <strong>${data.yearStart}</strong> e término em <strong>${data.yearEnd}</strong>, podendo ser renovado mediante novo instrumento contratual.
  </div>

  <div class="item">
    <span class="item-number">2.2.</span> A renovação da matrícula para o ano letivo seguinte está condicionada à manifestação de interesse do(a) <strong>RESPONSÁVEL FINANCEIRO</strong>, à regularidade financeira e à aprovação pela <strong>ESCOLA</strong>, conforme critérios acadêmicos e disciplinares.
  </div>

  <div class="item">
    <span class="item-number">2.3.</span> Em caso de desistência, o(a) <strong>RESPONSÁVEL FINANCEIRO</strong> deverá comunicar a <strong>ESCOLA</strong> por escrito com antecedência mínima de 30 (trinta) dias, ficando responsável pelo pagamento das parcelas vencidas até a data da efetiva comunicação, acrescidas de multa de 10% (dez por cento) sobre o saldo remanescente do contrato.
  </div>

  <div class="item">
    <span class="item-number">2.4.</span> A <strong>ESCOLA</strong> poderá rescindir unilateralmente este contrato em caso de descumprimento grave do Regimento Interno pelo(a) aluno(a) ou pelo(a) <strong>RESPONSÁVEL FINANCEIRO</strong>/<strong>RESPONSÁVEL ACADÊMICO</strong>, garantido o contraditório e a ampla defesa.
  </div>

  <!-- ==================== CLAUSULA 3a ==================== -->
  <div class="page-break"></div>
  <div class="clause-title">CLÁUSULA 3ª - DOS VALORES</div>

  <div class="item">
    <span class="item-number">3.1.</span> Os valores da anuidade escolar para o ano letivo de <strong>${data.schoolYear}</strong> são os seguintes:
  </div>

  <table class="fee-table">
    <thead>
      <tr>
        <th>Faixa</th>
        <th>Anuidade (R$)</th>
        <th>Entrada (R$)</th>
        <th>12 parcelas s/ desconto (R$)</th>
        <th>12 parcelas c/ 20% desconto (R$)</th>
      </tr>
    </thead>
    <tbody>
      ${feeTableRows}
    </tbody>
  </table>

  <div class="item" style="margin-top: 10px;">
    <span class="item-number">Parágrafo 1º.</span> O desconto de 20% (vinte por cento) sobre o valor das parcelas mensais será concedido exclusivamente para pagamentos realizados até a data de vencimento de cada parcela, conforme boleto bancário emitido pela <strong>ESCOLA</strong>.
  </div>

  <div class="item">
    <span class="item-number">Parágrafo 2º.</span> O pagamento da entrada no valor de <strong>R$ ${data.enrollmentFee}</strong> deverá ser realizado no ato da matrícula e não será restituível em caso de desistência após a efetivação da matrícula.
  </div>

  <div class="item">
    <span class="item-number">Parágrafo 3º.</span> As parcelas mensais vencerão no dia 10 (dez) de cada mês, de julho a junho do ano letivo correspondente, devendo ser pagas mediante boleto bancário emitido pela <strong>ESCOLA</strong> ou por meio de transferência bancária para a conta indicada.
  </div>

  <div class="item">
    <span class="item-number">Parágrafo 4º.</span> Em caso de atraso no pagamento, incidirão sobre o valor devido: (i) multa de 2% (dois por cento); (ii) juros de mora de 1% (um por cento) ao mês, pro rata die; e (iii) correção monetária pelo IPCA/IBGE.
  </div>

  <div class="item">
    <span class="item-number">Parágrafo 5º.</span> A inadimplência superior a 90 (noventa) dias poderá acarretar a inscrição do devedor nos órgãos de proteção ao crédito (SPC/SERASA), além da cobrança judicial, ficando o devedor responsável por todos os custos e honorários advocatícios, fixados desde já em 20% (vinte por cento) sobre o valor total do débito.
  </div>

  <div class="item">
    <span class="item-number">3.2.</span> Os valores da alimentação escolar para o ano letivo de <strong>${data.schoolYear}</strong> são os seguintes:
  </div>

  <table class="fee-table">
    <thead>
      <tr>
        <th>Faixa</th>
        <th>Alimentação Anual (R$)</th>
        <th>12 parcelas Alimentação (R$)</th>
      </tr>
    </thead>
    <tbody>
      ${foodTableRows}
    </tbody>
  </table>

  <div class="item">
    <span class="item-number">3.3.</span> A alimentação é um serviço obrigatório para todos os alunos da Educação Infantil (Nursery ao Pre-K4) e opcional para os demais segmentos. O valor será cobrado separadamente da anuidade escolar, nas mesmas condições de vencimento e penalidades por atraso.
  </div>

  <div class="item">
    <span class="item-number">3.4.</span> Os valores previstos neste contrato poderão ser reajustados anualmente, com base no IPCA/IBGE acumulado nos últimos 12 (doze) meses, ou por outro índice que o substitua, acrescido de até 5% (cinco por cento) a título de recomposição de custos operacionais, mediante comunicação prévia de 45 (quarenta e cinco) dias.
  </div>

  <div class="item">
    <span class="item-number">3.5.</span> Eventuais bolsas ou descontos concedidos pela <strong>ESCOLA</strong> terão caráter temporário e não se incorporam ao contrato, podendo ser revogados em caso de inadimplência ou descumprimento das condições estabelecidas.
  </div>

  <div class="item">
    <span class="item-number">3.6.</span> A <strong>ESCOLA</strong> poderá cobrar taxas adicionais para serviços específicos, tais como: emissão de segunda via de documentos, provas de recuperação extraordinárias, certificados especiais e outros serviços administrativos, mediante tabela de preços previamente divulgada.
  </div>

  <div class="item">
    <span class="item-number">3.7.</span> Em caso de transferência do(a) aluno(a) durante o ano letivo, os valores serão calculados pro rata temporis, considerando-se os meses letivos efetivamente cursados, sendo devida a restituição de eventuais valores pagos antecipadamente, descontadas as parcelas vencidas e eventuais multas contratuais.
  </div>

  <div class="item">
    ${data.operator.internationalMaterialFee != null ? `<span class="item-number">3.8.</span> <strong>Taxa de material pedagógico internacional:</strong> Além da anuidade escolar, será cobrada uma taxa anual de <strong>${formatBRLFee(data.operator.internationalMaterialFee)}</strong> referente ao material pedagógico internacional utilizado no currículo bilíngue da <strong>ESCOLA</strong>. Esta taxa será cobrada em parcela única no ato da matrícula ou pode ser parcelada em até 3 (três) vezes, conforme acordo com a Secretaria.` : ''}
  </div>

  <div class="item">
    <span class="item-number">3.9.</span> O(A) <strong>RESPONSÁVEL FINANCEIRO</strong> declara estar ciente de que o não pagamento de qualquer parcela não exime a obrigação de pagamento das parcelas subsequentes, permanecendo a dívida integral até sua completa quitação.
  </div>

  <!-- ==================== CLAUSULA 4a ==================== -->
  <div class="page-break"></div>
  <div class="clause-title">CLÁUSULA 4ª - DA PROTEÇÃO E TRATAMENTO DE DADOS</div>

  <div class="item">
    <span class="item-number">4.1.</span> As partes reconhecem e concordam que o tratamento de dados pessoais realizado no âmbito deste contrato está sujeito à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
  </div>

  <div class="item">
    <span class="item-number">4.2.</span> A <strong>ESCOLA</strong>, na qualidade de controladora de dados, coletará e tratará os dados pessoais do(a) aluno(a), do(a) <strong>RESPONSÁVEL FINANCEIRO</strong> e do(a) <strong>RESPONSÁVEL ACADÊMICO</strong> estritamente necessários para: (i) execução deste contrato; (ii) cumprimento de obrigações legais e regulatórias; (iii) exercício regular de direitos em processos judiciais, administrativos ou arbitrais; (iv) proteção da vida e da incolumidade física do(a) aluno(a).
  </div>

  <div class="item">
    <span class="item-number">4.3.</span> Os dados pessoais tratados incluem, sem limitação: dados cadastrais (nome, CPF, RG, endereço, e-mail, telefone), dados acadêmicos (notas, frequência, histórico escolar), dados de saúde (informações médicas necessárias para o atendimento do aluno), dados financeiros (dados bancários, histórico de pagamentos) e dados sensíveis estritamente necessários.
  </div>

  <div class="item">
    <span class="item-number">4.4.</span> A <strong>ESCOLA</strong> adotará medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.
  </div>

  <div class="item">
    <span class="item-number">4.5.</span> Os dados pessoais poderão ser compartilhados com: (i) órgãos governamentais (MEC, Secretarias de Educação) em cumprimento de obrigações legais; (ii) prestadores de serviço da <strong>ESCOLA</strong> (sistemas de gestão escolar, plataformas digitais educacionais) mediante contratos que garantam a proteção adequada; (iii) parceiros pedagógicos internacionais para fins de certificação e intercâmbio.
  </div>

  <div class="item">
    <span class="item-number">4.6.</span> O(A) <strong>RESPONSÁVEL FINANCEIRO</strong> e o(a) <strong>RESPONSÁVEL ACADÊMICO</strong>, na qualidade de representantes legais do(a) aluno(a) menor de idade, consentem com o tratamento dos dados nos termos deste contrato e da Política de Privacidade da <strong>ESCOLA</strong>.
  </div>

  <div class="item">
    <span class="item-number">4.7.</span> Os titulares dos dados poderão exercer seus direitos previstos na LGPD (acesso, correção, eliminação, portabilidade, entre outros) mediante solicitação formal ao Encarregado de Proteção de Dados da <strong>ESCOLA</strong>${data.operator.lgpdContactEmail ? `, pelo e-mail ${data.operator.lgpdContactEmail}` : ''}.
  </div>

  <div class="item">
    <span class="item-number">4.8.</span> Os dados pessoais serão mantidos pela <strong>ESCOLA</strong> pelo prazo necessário ao cumprimento das finalidades descritas neste contrato e, após o término da relação contratual, pelo prazo exigido por lei ou regulamento aplicável.
  </div>

  <!-- ==================== CLAUSULA 5a ==================== -->
  <div class="clause-title">CLÁUSULA 5ª - DAS DISPOSIÇÕES FINAIS</div>

  <div class="item">
    <span class="item-number">5.1.</span> O presente contrato obriga as partes e seus sucessores a qualquer título.
  </div>

  <div class="item">
    <span class="item-number">5.2.</span> A tolerância de qualquer das partes quanto ao descumprimento de cláusula ou condição deste contrato não implicará novação, renúncia ou alteração do pactuado, podendo a parte prejudicada exigir o cumprimento integral a qualquer tempo.
  </div>

  <div class="item">
    <span class="item-number">5.3.</span> Qualquer alteração ou aditamento a este contrato somente será válido se formalizado por escrito e assinado por ambas as partes.
  </div>

  <div class="item">
    <span class="item-number">5.4.</span> Caso qualquer cláusula ou disposição deste contrato venha a ser declarada nula ou inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.
  </div>

  <div class="item">
    <span class="item-number">5.5.</span> As comunicações entre as partes deverão ser realizadas por escrito, preferencialmente por e-mail, para os endereços eletrônicos indicados neste contrato, considerando-se válida a comunicação enviada ao último endereço informado.
  </div>

  <div class="item">
    <span class="item-number">5.6.</span> As partes elegem o foro da ${data.operator.jurisdiction?.trim() || (data.operator.legalCity ? `Comarca de ${data.operator.legalCity}` : 'sede da ESCOLA')} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
  </div>

  <div class="item">
    <span class="item-number">5.7.</span> E por estarem assim justas e contratadas, as partes firmam o presente instrumento em meio eletrônico, por meio de assinatura digital com validade jurídica, em conformidade com a Medida Provisória 2.200-2/2001 e demais normas aplicáveis.
  </div>

  <!-- ==================== SIGNATURES ==================== -->
  <div class="signature-area">
    <div class="item" style="text-align: center; margin-top: 30px;">
      ${data.operator.legalCity ? `${data.operator.legalCity}, ` : ''}${data.contractDate}
    </div>

    <div class="signature-line" style="margin-top: 60px;">
      <div class="line">
        <strong>${data.operator.legalName?.trim() || data.operator.schoolName}</strong><br/>
        CONTRATADA
      </div>
    </div>

    <div class="signature-line" style="margin-top: 50px;">
      <div class="line">
        <strong>${data.financialResponsible.fullName}</strong><br/>
        RESPONSÁVEL FINANCEIRO - CONTRATANTE
      </div>
    </div>

    <div style="margin-top: 40px;">
      <strong>Testemunhas:</strong>
    </div>
    <div class="witnesses" style="margin-top: 10px;">
      <div class="witness-box">
        <div class="line">
          Nome: ${data.witnesses[0]?.name ?? '____________________________'}<br/>
          RG: ______________________________<br/>
          CPF: ${data.witnesses[0]?.cpf ?? '____________________________'}
        </div>
      </div>
      <div class="witness-box">
        <div class="line">
          Nome: ${data.witnesses[1]?.name ?? '____________________________'}<br/>
          RG: ______________________________<br/>
          CPF: ${data.witnesses[1]?.cpf ?? '____________________________'}
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 9pt; color: #666;">
      Contrato ${data.contractCode} - Gerado eletronicamente em ${data.contractDate}
    </div>
  </div>

</body>
</html>`;
}
