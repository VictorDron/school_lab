// ==================== ADDENDUM TEMPLATE ====================
// Generates the full HTML for a contract addendum
// "Aditivo Contratual ao Contrato de Prestação de Serviços Educacionais"
//
// The operator's legal identity (legalName / CNPJ / address / city) is
// passed in as `operator`, sourced from SystemSettings, so the same
// template renders correct paperwork for any tenant.

export interface OperatorEntity {
  schoolName: string; // Display name (used in signature blocks)
  legalName: string | null; // Razão social (used in CONTRATADA clause)
  cnpj: string | null; // Already-formatted (e.g. "00.000.000/0000-00")
  legalAddress: string | null;
  legalCity: string | null;
}

export interface AddendumTemplateData {
  operator: OperatorEntity;
  addendumCode: string;
  addendumDate: string; // DD/MM/YYYY
  addendumType: string; // pt-BR label
  contractCode: string;
  contractDate: string;
  studentName: string;
  studentGrade: string;
  financialResponsible: {
    fullName: string;
    cpf: string;
    address: string;
    email: string;
  };
  description: string;
  changedValues: Array<{ field: string; oldValue: string; newValue: string }>;
  witnesses: Array<{ name: string; cpf?: string }>;
}

export const ADDENDUM_TYPE_LABELS: Record<string, string> = {
  DISCOUNT: 'Desconto',
  SPECIAL_CONDITION: 'Condição especial',
  GRADE_CHANGE: 'Alteração de série',
  OTHER: 'Outro',
};

/**
 * Build the "CONTRATADA: ..." sentence for a contract / addendum from the
 * operator's legal-entity fields. Skips clauses for fields that are null
 * so an under-configured tenant doesn't end up with "CNPJ sob o nº ."
 * dangling in the document.
 *
 * Falls back to schoolName when legalName isn't filled in yet.
 */
export function buildContratadaSentence(operator: OperatorEntity): string {
  const name = operator.legalName?.trim() || operator.schoolName;
  const parts: string[] = [name, 'pessoa jurídica de direito privado'];
  if (operator.cnpj?.trim()) {
    parts.push(`inscrita no CNPJ sob o nº ${operator.cnpj.trim()}`);
  }
  const seat = operator.legalAddress?.trim() || operator.legalCity?.trim();
  if (seat) {
    parts.push(`com sede em ${seat}`);
  }
  return parts.join(', ') + '.';
}

export function generateAddendumHtml(data: AddendumTemplateData): string {
  const changedValuesHtml =
    data.changedValues.length > 0
      ? `
    <h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 13px;">CLÁUSULA SEGUNDA — DAS ALTERAÇÕES:</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 11px;">Condição</th>
          <th style="border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 11px;">Valor Anterior</th>
          <th style="border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 11px;">Novo Valor</th>
        </tr>
      </thead>
      <tbody>
        ${data.changedValues
          .map(
            (cv) => `
          <tr>
            <td style="border: 1px solid #ccc; padding: 6px 10px; font-size: 11px;">${cv.field}</td>
            <td style="border: 1px solid #ccc; padding: 6px 10px; font-size: 11px;">${cv.oldValue}</td>
            <td style="border: 1px solid #ccc; padding: 6px 10px; font-size: 11px;">${cv.newValue}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>`
      : '';

  const witnessesHtml = data.witnesses
    .map(
      (w) => `
    <div style="margin-top: 30px; text-align: center;">
      <div style="border-top: 1px solid #333; width: 300px; margin: 0 auto; padding-top: 4px;">
        <p style="font-size: 11px; margin: 0;">${w.name}</p>
        ${w.cpf ? `<p style="font-size: 10px; margin: 0; color: #666;">CPF: ${w.cpf}</p>` : ''}
        <p style="font-size: 10px; margin: 0; color: #666;">Testemunha</p>
      </div>
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    h2 { font-size: 14px; text-align: center; margin-top: 0; color: #555; }
    h3 { font-size: 13px; margin-top: 16px; }
    p { margin: 8px 0; text-align: justify; }
    .reference { text-align: center; font-size: 11px; color: #666; margin-bottom: 20px; }
    .section { margin-top: 20px; }
    .parties { margin: 16px 0; padding: 12px; background-color: #f9f9f9; border-left: 3px solid #1a3366; }
    .signature-block { margin-top: 50px; text-align: center; }
    .signature-line { border-top: 1px solid #333; width: 300px; margin: 40px auto 4px; padding-top: 4px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <h1>ADITIVO CONTRATUAL</h1>
  <h2>Aditivo ao Contrato de Prestação de Serviços Educacionais</h2>
  <p class="reference">Referente ao contrato <strong>${data.contractCode}</strong>, firmado em ${data.contractDate}</p>
  <p class="reference">Código do aditivo: <strong>${data.addendumCode}</strong></p>

  <div class="section">
    <h3>DAS PARTES</h3>
    <div class="parties">
      <p><strong>CONTRATADA:</strong> ${buildContratadaSentence(data.operator)}</p>
    </div>
    <div class="parties">
      <p><strong>CONTRATANTE:</strong> ${data.financialResponsible.fullName}, inscrito(a) no CPF sob o nº ${data.financialResponsible.cpf}, residente em ${data.financialResponsible.address}, e-mail: ${data.financialResponsible.email}.</p>
    </div>
    <p><strong>Aluno(a):</strong> ${data.studentName} — ${data.studentGrade}</p>
  </div>

  <div class="section">
    <p><strong>Tipo de aditivo:</strong> ${data.addendumType}</p>
  </div>

  <div class="section">
    <h3>CLÁUSULA PRIMEIRA — DO OBJETO:</h3>
    <p>${data.description}</p>
  </div>

  ${changedValuesHtml}

  <div class="section">
    <h3>${data.changedValues.length > 0 ? 'CLÁUSULA TERCEIRA' : 'CLÁUSULA SEGUNDA'} — DAS DISPOSIÇÕES GERAIS:</h3>
    <p>As demais cláusulas do contrato original permanecem inalteradas e em pleno vigor, produzindo todos os seus efeitos legais.</p>
    <p>E por estarem assim justas e contratadas, as partes assinam o presente aditivo em duas vias de igual teor e forma.</p>
  </div>

  <div class="signature-block">
    <div class="signature-line">
      <p style="font-size: 11px; margin: 0;">${data.operator.schoolName}</p>
      <p style="font-size: 10px; margin: 0; color: #666;">CONTRATADA</p>
    </div>

    <div class="signature-line">
      <p style="font-size: 11px; margin: 0;">${data.financialResponsible.fullName}</p>
      <p style="font-size: 10px; margin: 0; color: #666;">CONTRATANTE</p>
    </div>

    ${witnessesHtml}
  </div>

  <p class="footer">${data.operator.legalCity ? `${data.operator.legalCity}, ` : ''}${data.addendumDate}</p>
</body>
</html>`;
}
