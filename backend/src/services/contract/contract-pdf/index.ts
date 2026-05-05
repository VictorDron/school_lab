import { prisma } from '../../../config/database.js';
import { uploadFile } from '../../../config/supabase.js';
import logger from '../../../utils/logger.js';
import { createAppError } from '../../../lib/error-messages.js';
import { generateContractHtml } from '../../../templates/contract-template.js';
import { buildContractData } from './data-builder.js';
import { renderContractPdf, type ContractWitness } from './pdf-renderer.js';

// Re-export the two formatters that are part of the contract module's public
// API so the './contract-pdf.service.js' shim continues to surface them.
export { formatMaritalStatus, formatNationality } from './formatters.js';

// ---------------------------------------------------------------------------
// generateContractDocument — fetches the full contract (with lead, signers,
// payments, student, parents, address, financialResponsible), derives the
// renderable templateData via buildContractData, renders the HTML version
// and the PDF version, uploads both to Supabase Storage and updates the
// contract row with the resulting URLs.
// ---------------------------------------------------------------------------

export async function generateContractDocument(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      signers: true,
      payments: true,
      student: true,
      lead: {
        include: {
          parents: true,
          children: true,
          address: true,
          financialResponsible: true,
        },
      },
    },
  });

  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (!contract.lead) throw createAppError('CONTRACT_LEAD_NOT_FOUND');

  const { templateData, pdfFeeTable, pdfFoodTable, gradeLevels } = await buildContractData(contract);

  // Upload HTML version first so we still have the rendered template even
  // when PDF generation fails downstream.
  const htmlContent = generateContractHtml(templateData);
  const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
  const htmlPath = `contracts/${contractId}/${contract.code}.html`;
  const htmlUrl = await uploadFile(htmlBuffer, htmlPath, 'text/html');

  const witnesses: ContractWitness[] = contract.signers
    .filter((s) => s.role === 'WITNESS')
    .map((s) => ({ name: s.name, cpf: s.cpf ?? null }));

  const pdfBuffer = await renderContractPdf({
    templateData,
    pdfFeeTable,
    pdfFoodTable,
    gradeLevels,
    negotiated: {
      hasDiscount: contract.negotiatedDiscountPercent != null,
      percent:
        contract.negotiatedDiscountPercent != null ? Number(contract.negotiatedDiscountPercent) : 0,
      final: contract.negotiatedFinalValue ? Number(contract.negotiatedFinalValue) : null,
      justification: contract.negotiationJustification ?? null,
    },
    witnesses,
    contractCode: contract.code,
  });

  const storagePath = `contracts/${contractId}/${contract.code}.pdf`;
  const uploadedUrl = await uploadFile(pdfBuffer, storagePath, 'application/pdf');

  if (!uploadedUrl) {
    logger.error(`Failed to upload contract PDF to Supabase: ${contractId}`);
    throw createAppError('CONTRACT_PDF_UPLOAD_FAILED');
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      documentUrl: uploadedUrl,
      templateVersion: 'ICS-CONTRACT-V2',
    },
    include: {
      signers: true,
      payments: true,
      lead: {
        select: { id: true, familyName: true, admissionGateStatus: true },
      },
      legalApprovedBy: {
        select: { id: true, displayName: true },
      },
      financialApprovedBy: {
        select: { id: true, displayName: true },
      },
    },
  });

  logger.info(
    `Contract document generated: ${contract.code} (PDF: ${uploadedUrl}, HTML: ${htmlUrl ?? 'upload failed'})`,
  );

  return updated;
}
