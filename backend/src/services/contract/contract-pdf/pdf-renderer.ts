import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import logger from '../../../utils/logger.js';
import {
  ContractTemplateData,
  FEE_TABLE,
  FOOD_TABLE,
  OperatorEntity,
  buildContractContratadaParagraph,
} from '../../../templates/contract-template.js';
import { PdfRenderContext } from '../../../types/contract.types.js';
import {
  ensureSpace,
  drawLine,
  drawParagraph,
  drawLabeledParagraph,
  drawTable,
  drawSignatureLine,
} from './pdf-helpers.js';
import { formatCurrency } from './formatters.js';

// ---------------------------------------------------------------------------
// Renders the full ICS contract PDF using pdf-lib. Pure rendering — does not
// fetch data, does not upload, does not write to the database. Returns the
// raw PDF byte buffer so the caller can decide what to do with it.
// ---------------------------------------------------------------------------

export interface NegotiatedDiscount {
  hasDiscount: boolean;
  percent: number;
  final: number | null;
  justification: string | null;
}

export interface ContractWitness {
  name: string;
  cpf: string | null;
}

export interface RenderContractPdfArgs {
  templateData: ContractTemplateData;
  pdfFeeTable: typeof FEE_TABLE;
  pdfFoodTable: typeof FOOD_TABLE;
  gradeLevels: string[];
  negotiated: NegotiatedDiscount;
  witnesses: ContractWitness[];
  contractCode: string;
}

const PAGE_W = 595; // A4
const PAGE_H = 842;

export async function renderContractPdf(args: RenderContractPdfArgs): Promise<Buffer> {
  const { templateData, pdfFeeTable, pdfFoodTable, gradeLevels, negotiated, witnesses, contractCode } = args;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const firstPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const ctx: PdfRenderContext = {
    pdfDoc,
    font,
    boldFont,
    currentPage: firstPage,
    y: PAGE_H - 60,
    leftMargin: 50,
    rightMargin: 50,
    pageWidth: PAGE_W,
    pageHeight: PAGE_H,
    lineHeight: 15,
  };

  const operator = templateData.operator;

  await renderHeader(ctx, templateData);
  renderParties(ctx, templateData);
  renderClause1(ctx, operator);
  renderClause2(ctx, operator);
  renderClause3(ctx, templateData, pdfFeeTable, pdfFoodTable, gradeLevels, negotiated);
  renderClause4(ctx, operator);
  renderClause5(ctx, operator);
  renderSignaturesAndFooter(ctx, templateData, witnesses, contractCode);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ---------------------------------------------------------------------------
// Page 1 header — blue-bordered title bar with optional school logo. The
// logo is loaded from a few candidate paths (dev with tsx vs compiled dist
// vs production assets folder). When none of them are available the title
// gets the full bar width.
// ---------------------------------------------------------------------------

async function renderHeader(ctx: PdfRenderContext, templateData: ContractTemplateData): Promise<void> {
  const logoImage = await loadSchoolLogo(ctx.pdfDoc);

  const headerBoxX = 50;
  const headerBoxY = ctx.y - 55;
  const headerBoxW = PAGE_W - 100;
  const headerBoxH = 60;
  const darkBlue = rgb(0.1, 0.2, 0.4);

  ctx.currentPage.drawRectangle({
    x: headerBoxX,
    y: headerBoxY,
    width: headerBoxW,
    height: headerBoxH,
    borderColor: darkBlue,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  });

  const title = 'Contrato de Prestação de Serviços';
  const titleSize = 16;
  const titleWidth = ctx.boldFont.widthOfTextAtSize(title, titleSize);
  const logoAreaWidth = logoImage ? 55 : 0;
  const titleX = headerBoxX + (headerBoxW - logoAreaWidth - titleWidth) / 2;
  ctx.currentPage.drawText(title, {
    x: titleX,
    y: headerBoxY + (headerBoxH - titleSize) / 2 + 2,
    size: titleSize,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });

  if (logoImage) {
    const logoSize = 45;
    const logoX = headerBoxX + headerBoxW - logoSize - 10;
    const logoY = headerBoxY + (headerBoxH - logoSize) / 2;
    ctx.currentPage.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize,
    });
  }

  ctx.y = headerBoxY - 15;

  const yearText = `ANO LETIVO ${templateData.schoolYear}`;
  const gradeText = `Ano/Série: ${templateData.studentGrade}`;
  ctx.currentPage.drawText(yearText, {
    x: ctx.leftMargin,
    y: ctx.y,
    size: 11,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });
  const gradeWidth = ctx.font.widthOfTextAtSize(gradeText, 10);
  ctx.currentPage.drawText(gradeText, {
    x: PAGE_W - ctx.rightMargin - gradeWidth,
    y: ctx.y,
    size: 10,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });
  ctx.y -= 20;
}

async function loadSchoolLogo(pdfDoc: PDFDocument) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const candidates = [
      path.join(process.cwd(), 'src', 'assets', 'logo_ris.png'),
      path.join(process.cwd(), 'dist', 'assets', 'logo_ris.png'),
      path.join(process.cwd(), 'assets', 'logo_ris.png'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return await pdfDoc.embedPng(fs.readFileSync(candidate));
      }
    }
    return null;
  } catch {
    logger.warn('Could not embed school logo in contract PDF');
    return null;
  }
}

// ---------------------------------------------------------------------------
// "DAS PARTES" — school identity + financial responsible block + academic
// responsible block + the connecting paragraph that introduces the clauses.
// ---------------------------------------------------------------------------

function renderParties(ctx: PdfRenderContext, templateData: ContractTemplateData): void {
  drawLine(ctx, 'DAS PARTES', 12, true);
  ctx.y -= 4;

  // The HTML helper returns markup wrapped in <strong>; strip those tags
  // because pdf-lib renders plain text. The structural CONTRATADA suffix
  // is rebuilt as plain text here.
  const contratada = buildContractContratadaParagraph(templateData.operator)
    .replace(/<\/?strong>/g, '');
  drawLabeledParagraph(ctx, '1. ', contratada);
  ctx.y -= 4;

  drawLine(ctx, '2. CONTRATANTE (RESPONSÁVEL FINANCEIRO)', 11, true);
  drawResponsibleBlock(ctx, templateData.financialResponsible);
  ctx.y -= 4;

  drawLine(ctx, '3. CONTRATANTE (RESPONSÁVEL ACADÊMICO)', 11, true);
  drawResponsibleBlock(ctx, templateData.academicResponsible);
  ctx.y -= 6;

  drawParagraph(
    ctx,
    `Sendo o Contratante (Responsável Financeiro) e o Contratante (Responsável Acadêmico), conjuntamente quando representados por pessoas distintas, denominados simplesmente como CONTRATANTE(S). para o Ano Letivo compreendido por período consubstanciado de ${templateData.yearStart} a ${templateData.yearEnd} (doravante denominado "ANO LETIVO") o presente Contrato de Prestação de Serviços Educacionais para o(a) ALUNO(A) ${templateData.studentName}, nas seguintes cláusulas e condições:`,
  );
  ctx.y -= 8;
}

function drawResponsibleBlock(
  ctx: PdfRenderContext,
  resp: ContractTemplateData['financialResponsible'],
): void {
  drawLabeledParagraph(ctx, 'Nome completo: ', resp.fullName, 11, 10);
  drawParagraph(
    ctx,
    `Nacionalidade: ${resp.nationality} | Data de nascimento: ${resp.dateOfBirth} | Estado civil: ${resp.maritalStatus}`,
    10,
    false,
    10,
  );
  drawParagraph(ctx, `Profissão: ${resp.occupation}`, 10, false, 10);
  drawParagraph(
    ctx,
    `CPF: ${resp.cpf} | RG/Passaporte: ${resp.idNumber}`,
    10,
    false,
    10,
  );
  drawParagraph(ctx, `Endereço: ${resp.address}`, 10, false, 10);
  drawParagraph(ctx, `E-mail: ${resp.email}`, 10, false, 10);
}

// ---------------------------------------------------------------------------
// Clauses 1, 2, 4, 5 — static paragraph lists. Clause 3 (financial) needs
// dynamic data so it gets its own dedicated function below.
// ---------------------------------------------------------------------------

function renderClauseList(ctx: PdfRenderContext, title: string, items: string[]): void {
  ctx.y -= 6;
  drawLine(ctx, title, 12, true);
  ctx.y -= 4;
  for (const item of items) {
    drawParagraph(ctx, item);
    ctx.y -= 3;
  }
}

function clause1Items(operator: OperatorEntity): string[] {
  const school = operator.schoolName;
  return [
    `1.1 Nos termos dos artigos 5º, inciso II, 173, §4º, 206, incisos II e III, e 209, todos da Constituição Federal; do artigo 389, do Código Civil; do Código de Defesa do Consumidor; do Estatuto da Criança e do Adolescente; e da Lei nº 9.870/99; e do Regimento Interno da ${school}: a CONTRATADA se compromete a prestar, durante o ANO LETIVO, serviços educacionais ao(à) ALUNO(A), correspondentes à série ou ao período do curso indicado como "Ano / Série" no Cabeçalho do presente instrumento.`,
    '1.2 É obrigação da CONTRATADA oferecer instalações adequadas, equipamentos e material de uso coletivo para o bom desempenho das atividades educacionais, conforme os termos do presente instrumento e do seu Regimento Interno que, assim como documento "Application for Admission", constitui parte integrante e indissolúvel deste contrato.',
    '1.3 As aulas serão ministradas na sede da CONTRATADA ou em locais que a escola indicar, tendo em vista a natureza dos conteúdos disponibilizados e ministrados, assim como das técnicas pedagógicas que se fizerem necessárias.',
    '1.4 É de exclusiva competência e responsabilidade da CONTRATATA a orientação e aplicação técnica e pedagógica inerente à prestação dos serviços educacionais, bem como a definição, implementação e exercício das atribuições, dos poderes e dos procedimentos educacionais, acadêmicos e disciplinares dentro das dependências da CONTRATADA ou no âmbito das atividades relacionadas aos serviços prestados.',
    '1.5 A critério da CONTRATADA, poderá ocorrer a extinção ou o agrupamento de turmas, com a devida adequação dos horários de aula ou do calendário escolar para a melhor conveniência da comunidade escolar, bem como outras medidas que se tornem necessárias por razões de ordem pedagógica, administrativa ou econômico-financeira.',
    '1.6 A CONTRATADA poderá disponibilizar ao(à) ALUNO(A) aulas extracurriculares, especiais e facultativas, podendo ser realizadas fora de sua sede ou via internet, que poderão ser cobradas adicionalmente aos valores do presente Contrato.',
    '1.7 O(s) CONTRATANTE(S) compromete(m)-se a manter atualizada toda a documentação com informações sobre o(a) ALUNO(A) e sobre o(s) CONTRATANTE(S), incluindo, mas não limitando-se: os dados cadastrais do(a) ALUNO(A) e de seus responsáveis em plataformas e sistemas da CONTRATADA; aos formulários com informações acerca da saúde do(a) ALUNO(A); telefone e endereço eletrônico (e-mail) para contato do(s) CONTRATANTE(S), dos responsáveis acadêmicos e financeiros do aluno; e demais documentos que vierem a ser requeridos, confirmando e atestando a veracidade das informações repassadas;',
    `1.8 As partes se comprometem a observar as disposições do Regimento Interno da ${school}, desde o momento da matrícula - documento que é mantido à disposição do(s) CONTRATANTE(S) e cujas determinações são parte integrante do presente Contrato, incluindo no que se refere à sua aplicação subsidiária em casos omissos ao presente instrumento, sendo certo que o dito Regimento poderá ser modificado unilateralmente pela CONTRATADA a qualquer tempo.`,
    '1.9 O(s) CONTRATANTE(S) se comprometem a ressarcir a CONTRATADA dos danos e prejuízos que eventualmente vierem a ser causados pelo(a) ALUNO(A) ou ainda pelo(s) próprio(s) CONTRATATNTE(S) ou por pessoas sob sua responsabilidade, propositalmente ou não, ao patrimônio da escola;',
    `1.10 O(s) CONTRATANTE(S) se comprometem a fazer com que o(a) ALUNO(A) frequente a ${school} devidamente uniformizado e observando os horários de entrada e saída definidos pela CONTRATADA, em conformidade com os padrões e requerimentos determinados pela ${school} e dos termos e requisitos do seu Regimento Interno, sob pena de cobrança de multas e valores adicionais em caso de permanência do aluno antes ou após o horário especificado, ou ainda do(a) ALUNO(A) não poder participar das atividades escolares, caso em que não haverá qualquer ressarcimento, nem poderá vir a configurar qualquer forma de descumprimento contratual por parte da CONTRATADA.`,
    `1.11 Excepcionalmente, por motivos alheios à vontade da ${school}, que caracterizem eventos de força maior, as aulas poderão ser, integral ou parcialmente, ministradas sob a forma não presencial, ou seja, via internet (online). Nesses casos, caso ocorram, a CONTRATADA não estará obrigada a conceder quaisquer desconto ou abatimentos no valor das parcelas da anuidade escolar relativas ao período em que as aulas forem ministradas remotamente.`,
  ];
}

function renderClause1(ctx: PdfRenderContext, operator: OperatorEntity): void {
  renderClauseList(ctx, 'CLÁUSULA 1ª - DO OBJETO E NATUREZA DO CONTRATO', clause1Items(operator));
}

function clause2Items(operator: OperatorEntity): string[] {
  const school = operator.schoolName;
  // The cross-reference to clause 3.8 only makes sense when 3.8 is actually
  // rendered; otherwise we drop the "taxa material pedagógico internacional"
  // fragment so 2.2 doesn't dangle a reference into nothing.
  const materialFeeRef = operator.internationalMaterialFee != null
    ? ', e o montante pago a título de taxa de material pedagógico internacional anual, descrito no caput da cláusula 3.8'
    : '';
  return [
    `2.1 O presente Contrato terá duração até o final do ANO LETIVO contratado e não será renovado automaticamente, devendo o(s) CONTRATANTE(S) solicitar(em) a renovação da matrícula do(a) ALUNO(A) para o ano letivo subsequente, pelos meios que vierem a ser estabelecidos pela CONTRATADA, até a data a ser informada pela ${school}.`,
    'Parágrafo Único. Ambas as partes, a seu exclusivo critério, se reservam no direito de não renovar, unilateralmente, o presente contrato após o término do ANO LETIVO para o período letivo subsequente, fato de ciência e aceite tanto pelo(s) CONTRATANTE(S), quanto pela CONTRATADA. A CONTRATADA também poderá, a seu exclusivo critério, não renovar termos comerciais relacionados a descontos, bolsas de estudo, permutas ou outras condições excepcionais, caso existam no período letivo em curso, assim como poderá atualizar os preços conforme julgar necessário e entender ser suficiente ao equilíbrio econômico-financeiro na continuidade da prestação de serviços educacionais.',
    `2.2 O valor correspondente à entrada, discorrido na cláusula 3.3, assim como o valor de reembolso de alimentação para cobertura de custos da nutrição do(a) ALUNO(A), prevista no parágrafo primeiro da cláusula 3.7, bem como os valores correspondentes aos encargos de capital ("Capital Fee") que houverem sido pagos anteriormente pelo(s) CONTRATANTE(S) até 31 de dezembro de 2021, como disposto nos parágrafos quarto e quinto da cláusula 3.8${materialFeeRef}, não são passíveis de devolução, restituição, ressarcimento ou reembolso, no todo ou em parte, sob qualquer alegação ou justificativa, no caso de não renovação do presente contrato ou em virtude de interrupção na prestação de serviços educacionais no período letivo em curso, por decisão unilateral do(s) CONTRATANTE(S).`,
    `2.3 O presente Contrato poderá ser rescindido antes do término do ANO LETIVO, nas hipóteses descritas a seguir: 1. por iniciativa da CONTRATADA: por motivo disciplinar previsto no Regimento Interno da ${school}; ou ainda por incompatibilidade, promoção de desarmonia, ou recusa de conformidade pelo(a) ALUNO(A) e/ou pelos(s) CONTRATANTE(S) para com as normas, regimentos, decisões educacionais ou administrativas, linha de ensino ou filosofia pedagógica do estabelecimento de ensino. 2. por iniciativa do(s) CONTRATANTE(S): por decisão quanto à transferência unilateral do(a) ALUNO(A) para outra instituição de ensino, ou de cancelamento da matrícula, que devem ser requeridos por escrito com antecedência de 30 (trinta) dias, mediante preenchimento de documento próprio no formato que vier a ser especificado pela ${school}.`,
    '2.4 Em qualquer caso de rescisão, o(s) CONTRATANTE(S) deverá(ão) estar em dia com suas obrigações financeiras até o mês da efetiva execução da rescisão, inclusive. Caso o(s) CONTRATANTE(S) já tenha(m) eventualmente efetuado o pagamento antecipado parcial ou integral da anuidade escolar, ou ainda de adiantamento de parcelas vincendas, ensejará(ão) direito à restituição do saldo porventura existente, com vencimento de até 60 (sessenta) dias corridos contados a partir da data da solicitação da rescisão e após descontados os valores das parcelas vencidas e demais valores eventualmente devidos até a efetivação da rescisão contratual.',
  ];
}

function renderClause2(ctx: PdfRenderContext, operator: OperatorEntity): void {
  renderClauseList(ctx, 'CLÁUSULA 2ª - DA DURAÇÃO DO CONTRATO', clause2Items(operator));
}

// ---------------------------------------------------------------------------
// Clause 3 — fee table (with per-grade row highlighting), payment paragraphs,
// optional negotiated discount block, food table, and the trailing items.
// ---------------------------------------------------------------------------

function clause3TrailingItems(operator: OperatorEntity): string[] {
  const items = [
    '3.3. A alimentação é um serviço obrigatório para todos os alunos da Educação Infantil (Nursery ao Pre-K4) e opcional para os demais segmentos. O valor será cobrado separadamente da anuidade escolar, nas mesmas condições de vencimento e penalidades por atraso.',
    '3.4. Os valores previstos neste contrato poderão ser reajustados anualmente, com base no IPCA/IBGE acumulado nos últimos 12 (doze) meses, ou por outro índice que o substitua, acrescido de até 5% (cinco por cento) a título de recomposição de custos operacionais, mediante comunicação prévia de 45 (quarenta e cinco) dias.',
    '3.5. Eventuais bolsas ou descontos concedidos pela ESCOLA terão caráter temporário e não se incorporam ao contrato, podendo ser revogados em caso de inadimplência ou descumprimento das condições estabelecidas.',
    '3.6. A ESCOLA poderá cobrar taxas adicionais para serviços específicos, tais como: emissão de segunda via de documentos, provas de recuperação extraordinárias, certificados especiais e outros serviços administrativos, mediante tabela de preços previamente divulgada.',
    '3.7. Em caso de transferência do(a) aluno(a) durante o ano letivo, os valores serão calculados pro rata temporis, considerando-se os meses letivos efetivamente cursados, sendo devida a restituição de eventuais valores pagos antecipadamente, descontadas as parcelas vencidas e eventuais multas contratuais.',
  ];
  // Optional clause 3.8 — only emitted when the tenant has configured an
  // international/pedagogical material fee. Format the value at render time
  // so the user-facing wording stays in pt-BR ("R$ 3.900,00").
  if (operator.internationalMaterialFee != null) {
    const formatted = operator.internationalMaterialFee.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
    items.push(
      `3.8. Taxa de material pedagógico internacional: Além da anuidade escolar, será cobrada uma taxa anual de ${formatted} referente ao material pedagógico internacional utilizado no currículo bilíngue da ESCOLA. Esta taxa será cobrada em parcela única no ato da matrícula ou pode ser parcelada em até 3 (três) vezes, conforme acordo com a Secretaria.`,
    );
  }
  items.push(
    '3.9. O(A) RESPONSÁVEL FINANCEIRO declara estar ciente de que o não pagamento de qualquer parcela não exime a obrigação de pagamento das parcelas subsequentes, permanecendo a dívida integral até sua completa quitação.',
  );
  return items;
}

function renderClause3(
  ctx: PdfRenderContext,
  templateData: ContractTemplateData,
  pdfFeeTable: typeof FEE_TABLE,
  pdfFoodTable: typeof FOOD_TABLE,
  gradeLevels: string[],
  negotiated: NegotiatedDiscount,
): void {
  ctx.y -= 6;
  drawLine(ctx, 'CLÁUSULA 3ª - DOS VALORES', 12, true);
  ctx.y -= 4;

  drawParagraph(
    ctx,
    `3.1. Os valores da anuidade escolar para o ano letivo de ${templateData.schoolYear} são os seguintes:`,
  );
  ctx.y -= 4;

  // Highlight every fee-table row that matches a child's grade level.
  const highlightIndices = new Set(
    gradeLevels.map((gl) => pdfFeeTable.findIndex((r) => r.faixa === gl)).filter((i) => i >= 0),
  );
  drawTable(
    ctx,
    ['Faixa', 'Anuidade (R$)', 'Entrada (R$)', '12x s/ desc (R$)', '12x c/ desc (R$)'],
    pdfFeeTable.map((r) => [
      r.faixa,
      `R$ ${r.anuidade}`,
      `R$ ${r.entrada}`,
      `R$ ${r.parcela12SemDesc}`,
      `R$ ${r.parcela12ComDesc}`,
    ]),
    [110, 95, 80, 105, 105],
    undefined,
    highlightIndices.size > 0 ? highlightIndices : undefined,
  );
  ctx.y -= 4;

  const paymentParagraphs = [
    'Parágrafo 1º. O desconto de 20% (vinte por cento) sobre o valor das parcelas mensais será concedido exclusivamente para pagamentos realizados até a data de vencimento de cada parcela, conforme boleto bancário emitido pela ESCOLA.',
    `Parágrafo 2º. O pagamento da entrada no valor de R$ ${templateData.enrollmentFee} deverá ser realizado no ato da matrícula e não será restituível em caso de desistência após a efetivação da matrícula.`,
    'Parágrafo 3º. As parcelas mensais vencerão no dia 10 (dez) de cada mês, de julho a junho do ano letivo correspondente, devendo ser pagas mediante boleto bancário emitido pela ESCOLA ou por meio de transferência bancária para a conta indicada.',
    'Parágrafo 4º. Em caso de atraso no pagamento, incidirão sobre o valor devido: (i) multa de 2% (dois por cento); (ii) juros de mora de 1% (um por cento) ao mês, pro rata die; e (iii) correção monetária pelo IPCA/IBGE.',
    'Parágrafo 5º. A inadimplência superior a 90 (noventa) dias poderá acarretar a inscrição do devedor nos órgãos de proteção ao crédito (SPC/SERASA), além da cobrança judicial, ficando o devedor responsável por todos os custos e honorários advocatícios, fixados desde já em 20% (vinte por cento) sobre o valor total do débito.',
  ];
  for (const p of paymentParagraphs) {
    drawParagraph(ctx, p);
    ctx.y -= 3;
  }

  if (negotiated.hasDiscount) {
    ctx.y -= 4;
    const finalPart = negotiated.final
      ? `, resultando no valor final de R$ ${formatCurrency(negotiated.final)}`
      : '';
    const justificationPart = negotiated.justification
      ? `. Justificativa: ${negotiated.justification}`
      : '';
    drawParagraph(
      ctx,
      `DESCONTO NEGOCIADO: Foi concedido desconto negociado de ${negotiated.percent.toFixed(1)}% sobre o valor da anuidade${finalPart}${justificationPart}.`,
    );
    ctx.y -= 3;
  }

  ctx.y -= 3;

  drawParagraph(
    ctx,
    `3.2. Os valores da alimentação escolar para o ano letivo de ${templateData.schoolYear} são os seguintes:`,
  );
  ctx.y -= 4;

  drawTable(
    ctx,
    ['Faixa', 'Alimentação Anual (R$)', '12 parcelas (R$)'],
    pdfFoodTable.map((r) => [
      r.faixa,
      `R$ ${r.alimentacaoAnual}`,
      `R$ ${r.parcela12Alimentacao}`,
    ]),
    [160, 170, 165],
  );
  ctx.y -= 4;

  for (const item of clause3TrailingItems(templateData.operator)) {
    drawParagraph(ctx, item);
    ctx.y -= 3;
  }
}

function clause4Items(operator: OperatorEntity): string[] {
  // Clause 4.7 names the LGPD/data-protection contact. When the tenant
  // hasn't filled in lgpdContactEmail, drop the email pointer fragment
  // (titulares can still exercise their rights — they just contact the
  // school directly, the wording remains valid).
  const emailFragment = operator.lgpdContactEmail?.trim()
    ? `, pelo e-mail ${operator.lgpdContactEmail.trim()}`
    : '';
  return [
    '4.1. As partes reconhecem e concordam que o tratamento de dados pessoais realizado no âmbito deste contrato está sujeito à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).',
    '4.2. A ESCOLA, na qualidade de controladora de dados, coletará e tratará os dados pessoais do(a) aluno(a), do(a) RESPONSÁVEL FINANCEIRO e do(a) RESPONSÁVEL ACADÊMICO estritamente necessários para: (i) execução deste contrato; (ii) cumprimento de obrigações legais e regulatórias; (iii) exercício regular de direitos em processos judiciais, administrativos ou arbitrais; (iv) proteção da vida e da incolumidade física do(a) aluno(a).',
    '4.3. Os dados pessoais tratados incluem, sem limitação: dados cadastrais (nome, CPF, RG, endereço, e-mail, telefone), dados acadêmicos (notas, frequência, histórico escolar), dados de saúde (informações médicas necessárias para o atendimento do aluno), dados financeiros (dados bancários, histórico de pagamentos) e dados sensíveis estritamente necessários.',
    '4.4. A ESCOLA adotará medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.',
    '4.5. Os dados pessoais poderão ser compartilhados com: (i) órgãos governamentais (MEC, Secretarias de Educação) em cumprimento de obrigações legais; (ii) prestadores de serviço da ESCOLA (sistemas de gestão escolar, plataformas digitais educacionais) mediante contratos que garantam a proteção adequada; (iii) parceiros pedagógicos internacionais para fins de certificação e intercâmbio.',
    '4.6. O(A) RESPONSÁVEL FINANCEIRO e o(a) RESPONSÁVEL ACADÊMICO, na qualidade de representantes legais do(a) aluno(a) menor de idade, consentem com o tratamento dos dados nos termos deste contrato e da Política de Privacidade da ESCOLA.',
    `4.7. Os titulares dos dados poderão exercer seus direitos previstos na LGPD (acesso, correção, eliminação, portabilidade, entre outros) mediante solicitação formal ao Encarregado de Proteção de Dados da ESCOLA${emailFragment}.`,
    '4.8. Os dados pessoais serão mantidos pela ESCOLA pelo prazo necessário ao cumprimento das finalidades descritas neste contrato e, após o término da relação contratual, pelo prazo exigido por lei ou regulamento aplicável.',
  ];
}

function renderClause4(ctx: PdfRenderContext, operator: OperatorEntity): void {
  renderClauseList(ctx, 'CLÁUSULA 4ª - DA PROTEÇÃO E TRATAMENTO DE DADOS', clause4Items(operator));
}

function clause5Items(operator: OperatorEntity): string[] {
  const venue = operator.jurisdiction?.trim()
    || (operator.legalCity ? `Comarca de ${operator.legalCity}` : 'sede da ESCOLA');
  return [
    '5.1. O presente contrato obriga as partes e seus sucessores a qualquer título.',
    '5.2. A tolerância de qualquer das partes quanto ao descumprimento de cláusula ou condição deste contrato não implicará novação, renúncia ou alteração do pactuado, podendo a parte prejudicada exigir o cumprimento integral a qualquer tempo.',
    '5.3. Qualquer alteração ou aditamento a este contrato somente será válido se formalizado por escrito e assinado por ambas as partes.',
    '5.4. Caso qualquer cláusula ou disposição deste contrato venha a ser declarada nula ou inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.',
    '5.5. As comunicações entre as partes deverão ser realizadas por escrito, preferencialmente por e-mail, para os endereços eletrônicos indicados neste contrato, considerando-se válida a comunicação enviada ao último endereço informado.',
    `5.6. As partes elegem o foro da ${venue} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
    '5.7. E por estarem assim justas e contratadas, as partes firmam o presente instrumento em meio eletrônico, por meio de assinatura digital com validade jurídica, em conformidade com a Medida Provisória 2.200-2/2001 e demais normas aplicáveis.',
  ];
}

function renderClause5(ctx: PdfRenderContext, operator: OperatorEntity): void {
  renderClauseList(ctx, 'CLÁUSULA 5ª - DAS DISPOSIÇÕES FINAIS', clause5Items(operator));
}

// ---------------------------------------------------------------------------
// Date line + school + financial responsible signature lines + the two
// witness blocks (whose name/CPF fields are pre-filled when actual signers
// are attached, blank otherwise) + the centered footer with contract code.
// ---------------------------------------------------------------------------

function renderSignaturesAndFooter(
  ctx: PdfRenderContext,
  templateData: ContractTemplateData,
  witnesses: ContractWitness[],
  contractCode: string,
): void {
  ctx.y -= 10;
  ensureSpace(ctx, 250);

  const operator = templateData.operator;
  const cityPrefix = operator.legalCity ? `${operator.legalCity}, ` : '';
  const dateLine = `${cityPrefix}${templateData.contractDate}`;
  const dateWidth = ctx.font.widthOfTextAtSize(dateLine, 11);
  ctx.currentPage.drawText(dateLine, {
    x: (PAGE_W - dateWidth) / 2,
    y: ctx.y,
    size: 11,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });
  ctx.y -= 20;

  drawSignatureLine(ctx, operator.legalName?.trim() || operator.schoolName, 'CONTRATADA');
  drawSignatureLine(ctx, templateData.financialResponsible.fullName, 'RESPONSÁVEL FINANCEIRO - CONTRATANTE');

  const witness1 = witnesses[0] ?? null;
  const witness2 = witnesses[1] ?? null;

  ensureSpace(ctx, 80);
  ctx.y -= 20;

  const witnessY = ctx.y;
  drawWitnessBlock(ctx, 60, 250, witnessY, 'Testemunha 1', witness1);
  drawWitnessBlock(ctx, 340, 530, witnessY, 'Testemunha 2', witness2);

  ctx.y -= 75;

  const footerText = `Contrato ${contractCode} - Gerado eletronicamente em ${templateData.contractDate}`;
  const footerWidth = ctx.font.widthOfTextAtSize(footerText, 8);
  ctx.currentPage.drawText(footerText, {
    x: (PAGE_W - footerWidth) / 2,
    y: ctx.y,
    size: 8,
    font: ctx.font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

function drawWitnessBlock(
  ctx: PdfRenderContext,
  x: number,
  endX: number,
  yPos: number,
  label: string,
  witness: ContractWitness | null,
): void {
  ctx.currentPage.drawLine({
    start: { x, y: yPos },
    end: { x: endX, y: yPos },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
  ctx.currentPage.drawText(label, {
    x,
    y: yPos - 14,
    size: 9,
    font: ctx.boldFont,
    color: rgb(0, 0, 0),
  });
  ctx.currentPage.drawText(`Nome: ${witness?.name ?? '____________________________'}`, {
    x,
    y: yPos - 28,
    size: 9,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });
  ctx.currentPage.drawText(`RG: ${witness ? '___________________' : '______________________________'}`, {
    x,
    y: yPos - 42,
    size: 9,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });
  ctx.currentPage.drawText(`CPF: ${witness?.cpf ?? '____________________________'}`, {
    x,
    y: yPos - 56,
    size: 9,
    font: ctx.font,
    color: rgb(0, 0, 0),
  });
}
