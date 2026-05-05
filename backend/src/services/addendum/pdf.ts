import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../../config/database.js';
import { uploadFile } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import {
  generateAddendumHtml,
  buildContratadaSentence,
  AddendumTemplateData,
  ADDENDUM_TYPE_LABELS,
  OperatorEntity,
} from '../../templates/addendum-template.js';
import { getOrCreateSettings } from '../settings.service.js';

function formatDateBR(date: Date | string | null): string {
  if (!date) return 'Não informado';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

function formatAddress(parent: any): string {
  const parts = [parent.street, parent.number, parent.neighborhood, parent.city, parent.state, parent.zipCode].filter(Boolean);
  return parts.join(', ') || 'Não informado';
}

export async function generateAddendumPdf(addendumId: string) {
  const addendum = await prisma.contractAddendum.findUnique({
    where: { id: addendumId },
    include: {
      signers: true,
      contract: {
        include: {
          lead: {
            include: {
              parents: true,
              children: true,
              address: true,
            },
          },
          signers: true,
        },
      },
    },
  });

  if (!addendum) {
    throw new Error('ADDENDUM_NOT_FOUND');
  }

  const contract = addendum.contract;
  const lead = contract.lead;

  // Build financial responsible data
  const financialParent = lead.parents[0];
  const financialResp = financialParent
    ? {
        fullName: financialParent.fullName,
        cpf: financialParent.cpf ?? 'Não informado',
        address: formatAddress(financialParent),
        email: financialParent.email ?? 'Não informado',
      }
    : {
        fullName: 'Não informado',
        cpf: 'Não informado',
        address: 'Não informado',
        email: 'Não informado',
      };

  // Student info
  const applicantChildren = lead.children.filter((c: any) => c.isApplicant);
  const relevantChildren = applicantChildren.length > 0 ? applicantChildren : lead.children.length > 0 ? [lead.children[0]] : [];
  const studentName = relevantChildren.length > 0 ? relevantChildren.map((c: any) => c.fullName).join(' e ') : lead.familyName;
  const studentGrade = relevantChildren.length > 0 ? relevantChildren.map((c: any) => c.desiredGrade ?? 'Não informado').join(' / ') : 'Não informado';

  // Witnesses from contract signers
  const witnesses = contract.signers
    .filter((s) => s.role === 'WITNESS')
    .map((s) => ({ name: s.name, cpf: s.cpf ?? undefined }));

  const changedValues = (addendum.changedValues as any[]) ?? [];

  const settings = await getOrCreateSettings();
  const operator: OperatorEntity = {
    schoolName: settings.schoolName,
    legalName: settings.legalName,
    cnpj: settings.cnpj,
    legalAddress: settings.legalAddress,
    legalCity: settings.legalCity,
  };

  const templateData: AddendumTemplateData = {
    operator,
    addendumCode: addendum.code,
    addendumDate: formatDateBR(addendum.createdAt),
    addendumType: ADDENDUM_TYPE_LABELS[addendum.type] ?? addendum.type,
    contractCode: contract.code,
    contractDate: formatDateBR(contract.createdAt),
    studentName,
    studentGrade,
    financialResponsible: financialResp,
    description: addendum.description,
    changedValues,
    witnesses,
  };

  // Generate HTML
  const htmlContent = generateAddendumHtml(templateData);

  // Generate PDF using pdf-lib (same approach as contract.service.ts)
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595;
  const PAGE_H = 842;
  const LEFT_MARGIN = 50;
  const RIGHT_MARGIN = 50;
  const CONTENT_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN;
  const LINE_HEIGHT = 15;
  const FONT_SIZE = 10;
  const TITLE_SIZE = 16;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 60;

  function ensureSpace(needed: number) {
    if (y - needed < 60) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 60;
    }
  }

  function drawText(text: string, options: { size?: number; bold?: boolean; centered?: boolean; indent?: number } = {}) {
    const size = options.size ?? FONT_SIZE;
    const f = options.bold ? boldFont : font;
    const indent = options.indent ?? 0;

    // Word-wrap
    const maxWidth = CONTENT_WIDTH - indent;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = f.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      const x = options.centered ? LEFT_MARGIN + (CONTENT_WIDTH - f.widthOfTextAtSize(line, size)) / 2 : LEFT_MARGIN + indent;
      page.drawText(line, { x, y, size, font: f, color: rgb(0.13, 0.13, 0.13) });
      y -= LINE_HEIGHT;
    }
  }

  function drawSpacer(height = 10) {
    y -= height;
  }

  // Title
  drawText('ADITIVO CONTRATUAL', { size: TITLE_SIZE, bold: true, centered: true });
  drawSpacer(4);
  drawText('Aditivo ao Contrato de Prestação de Serviços Educacionais', { size: 12, centered: true });
  drawSpacer(6);
  drawText(`Referente ao contrato ${templateData.contractCode}, firmado em ${templateData.contractDate}`, { size: 9, centered: true });
  drawText(`Código do aditivo: ${templateData.addendumCode}`, { size: 9, centered: true });
  drawSpacer(16);

  // Parties
  drawText('DAS PARTES', { size: 12, bold: true });
  drawSpacer(6);
  drawText(`CONTRATADA: ${buildContratadaSentence(operator)}`);
  drawSpacer(8);
  drawText(`CONTRATANTE: ${financialResp.fullName}, CPF: ${financialResp.cpf}, residente em ${financialResp.address}, e-mail: ${financialResp.email}.`);
  drawSpacer(8);
  drawText(`Aluno(a): ${studentName} — ${studentGrade}`);
  drawSpacer(12);

  // Type
  drawText(`Tipo de aditivo: ${templateData.addendumType}`, { bold: true });
  drawSpacer(12);

  // Clause 1
  drawText('CLÁUSULA PRIMEIRA — DO OBJETO:', { size: 11, bold: true });
  drawSpacer(4);
  drawText(addendum.description);
  drawSpacer(12);

  // Changed values
  if (changedValues.length > 0) {
    drawText('CLÁUSULA SEGUNDA — DAS ALTERAÇÕES:', { size: 11, bold: true });
    drawSpacer(6);
    // Table header
    ensureSpace(LINE_HEIGHT * 2);
    const colWidths = [CONTENT_WIDTH * 0.4, CONTENT_WIDTH * 0.3, CONTENT_WIDTH * 0.3];
    const headers = ['Condição', 'Valor Anterior', 'Novo Valor'];
    let tableX = LEFT_MARGIN;
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], { x: tableX + 4, y, size: 9, font: boldFont, color: rgb(0.13, 0.13, 0.13) });
      tableX += colWidths[i];
    }
    y -= LINE_HEIGHT;

    for (const cv of changedValues) {
      ensureSpace(LINE_HEIGHT);
      tableX = LEFT_MARGIN;
      const values = [cv.field, cv.oldValue, cv.newValue];
      for (let i = 0; i < values.length; i++) {
        page.drawText(String(values[i] ?? ''), { x: tableX + 4, y, size: 9, font, color: rgb(0.13, 0.13, 0.13) });
        tableX += colWidths[i];
      }
      y -= LINE_HEIGHT;
    }
    drawSpacer(12);
  }

  // General clause
  const generalClauseLabel = changedValues.length > 0 ? 'CLÁUSULA TERCEIRA' : 'CLÁUSULA SEGUNDA';
  drawText(`${generalClauseLabel} — DAS DISPOSIÇÕES GERAIS:`, { size: 11, bold: true });
  drawSpacer(4);
  drawText('As demais cláusulas do contrato original permanecem inalteradas e em pleno vigor, produzindo todos os seus efeitos legais.');
  drawSpacer(6);
  drawText('E por estarem assim justas e contratadas, as partes assinam o presente aditivo em duas vias de igual teor e forma.');
  drawSpacer(30);

  // Signatures
  ensureSpace(80);
  const sigLineWidth = 250;
  const sigLineX = LEFT_MARGIN + (CONTENT_WIDTH - sigLineWidth) / 2;
  page.drawLine({ start: { x: sigLineX, y }, end: { x: sigLineX + sigLineWidth, y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  y -= 12;
  drawText(operator.schoolName, { size: 9, centered: true });
  drawText('CONTRATADA', { size: 8, centered: true });
  drawSpacer(20);

  ensureSpace(60);
  page.drawLine({ start: { x: sigLineX, y }, end: { x: sigLineX + sigLineWidth, y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  y -= 12;
  drawText(financialResp.fullName, { size: 9, centered: true });
  drawText('CONTRATANTE', { size: 8, centered: true });

  // Witnesses
  for (const w of witnesses) {
    drawSpacer(20);
    ensureSpace(50);
    page.drawLine({ start: { x: sigLineX, y }, end: { x: sigLineX + sigLineWidth, y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
    y -= 12;
    drawText(w.name, { size: 9, centered: true });
    if (w.cpf) drawText(`CPF: ${w.cpf}`, { size: 8, centered: true });
    drawText('Testemunha', { size: 8, centered: true });
  }

  // Footer
  drawSpacer(20);
  const footerLocation = operator.legalCity ? `${operator.legalCity}, ` : '';
  drawText(`${footerLocation}${templateData.addendumDate}`, { size: 9, centered: true });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Upload to Supabase
  const pdfPath = `addendums/${addendumId}/aditivo-${addendum.code}.pdf`;
  const pdfUrl = await uploadFile(pdfBuffer, pdfPath, 'application/pdf');

  // Update addendum with document URL
  const updated = await prisma.contractAddendum.update({
    where: { id: addendumId },
    data: { documentUrl: pdfUrl },
    include: { signers: true },
  });

  logger.info(`Addendum PDF generated: ${addendum.code}`);
  return updated;
}
