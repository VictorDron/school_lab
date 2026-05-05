import type { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import {
  ContractTemplateData,
  FEE_TABLE,
  FOOD_TABLE,
} from '../../../templates/contract-template.js';
import {
  formatAddress,
  formatLeadAddress,
  formatDateBR,
  formatMaritalStatus,
  formatNationality,
  formatCurrency,
  determineGradeLevel,
  currentSchoolYear,
} from './formatters.js';

// ---------------------------------------------------------------------------
// Bridges the persisted contract/lead rows into the shape the contract
// template (HTML + PDF) consumes. Pure data assembly — no rendering, no
// uploads — so a unit test can call buildContractData(contract) and assert
// against the resulting templateData without spinning up pdf-lib.
// ---------------------------------------------------------------------------

type ContractWithRelations = Prisma.ContractGetPayload<{
  include: {
    signers: true;
    payments: true;
    student: true;
    lead: {
      include: {
        parents: true;
        children: true;
        address: true;
        financialResponsible: true;
      };
    };
  };
}>;

type LeadWithRelations = NonNullable<ContractWithRelations['lead']>;
type ParentRow = LeadWithRelations['parents'][number];

type PdfFeeRow = (typeof FEE_TABLE)[number];
type PdfFoodRow = (typeof FOOD_TABLE)[number];

export interface ContractRenderData {
  templateData: ContractTemplateData;
  pdfFeeTable: PdfFeeRow[];
  pdfFoodTable: PdfFoodRow[];
  gradeLevels: string[];
}

// ---------------------------------------------------------------------------
// Fee/food tables — the persisted versions store numeric values; the PDF
// renderer needs pre-formatted pt-BR currency strings, so we project across.
// When no override is configured, fall back to the FEE_TABLE / FOOD_TABLE
// constants shipped with the template.
// ---------------------------------------------------------------------------

function buildPdfFeeTable(dynamicFeeTable: any[] | null): PdfFeeRow[] {
  if (!dynamicFeeTable) return FEE_TABLE;
  return dynamicFeeTable.map((r: any) => ({
    faixa: r.faixa,
    anuidade: Number(r.anuidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    entrada: Number(r.entrada).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    parcela12SemDesc: (Number(r.anuidade) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    parcela12ComDesc: ((Number(r.anuidade) / 12) * 0.8).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  }));
}

function buildPdfFoodTable(dynamicFoodTable: any[] | null): PdfFoodRow[] {
  if (!dynamicFoodTable) return FOOD_TABLE;
  return dynamicFoodTable.map((r: any) => ({
    faixa: r.faixa,
    alimentacaoAnual: Number(r.alimentacaoAnual).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    parcela12Alimentacao: Number(r.parcela12).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  }));
}

// ---------------------------------------------------------------------------
// Financial / academic responsible resolution.
// - When the lead has a LeadFinancialResponsible row marked OTHER, the
//   financial party is a third party and the academic party defaults to the
//   first parent.
// - When the financial responsible points at FATHER or MOTHER, the academic
//   party becomes the OTHER parent.
// - With no explicit financial responsible at all, the legacy default applies:
//   father is financial, mother is academic.
// ---------------------------------------------------------------------------

function resolveResponsibles(lead: LeadWithRelations): {
  financialParent: ParentRow | null;
  academicParent: ParentRow | null;
} {
  const finResp = lead.financialResponsible;

  if (!finResp) {
    const father = lead.parents.find((p) => p.parentType === 'FATHER');
    const mother = lead.parents.find((p) => p.parentType === 'MOTHER');
    return {
      financialParent: father ?? mother ?? lead.parents[0] ?? null,
      academicParent: mother ?? father ?? lead.parents[0] ?? null,
    };
  }

  if (finResp.responsibleType === 'OTHER') {
    // Financial responsible is a third party — synthesise a parent-shaped
    // row from the LeadFinancialResponsible record.
    const financialParent = {
      id: finResp.id,
      leadId: finResp.leadId,
      parentType: 'OTHER',
      fullName: finResp.fullName ?? 'Não informado',
      email: finResp.email ?? null,
      phone: finResp.phone ?? null,
      cpf: finResp.cpf ?? null,
      occupation: null,
      nativeLanguage: null,
      idNumber: null,
      idIssueDate: null,
      idIssuer: null,
      dateOfBirth: null,
      nationality: null,
      maritalStatus: null,
      education: null,
      religion: null,
      zipCode: finResp.zipCode ?? null,
      country: finResp.country ?? null,
      state: finResp.state ?? null,
      city: finResp.city ?? null,
      neighborhood: finResp.neighborhood ?? null,
      street: finResp.street ?? null,
      number: finResp.number ?? null,
      complement: finResp.complement ?? null,
      sameAddressAsOtherParent: false,
      createdAt: finResp.createdAt,
      updatedAt: finResp.updatedAt,
    } as unknown as ParentRow;
    return { financialParent, academicParent: lead.parents[0] ?? null };
  }

  const financialParent =
    lead.parents.find((p) => p.parentType === finResp.responsibleType) ??
    lead.parents[0] ??
    null;
  const academicParent =
    lead.parents.find((p) => p.parentType !== finResp.responsibleType) ?? financialParent;
  return { financialParent, academicParent };
}

function buildResponsibleData(parent: ParentRow | null, fallbackAddress: string) {
  if (!parent) {
    return {
      fullName: 'Não informado',
      nationality: 'Não informado',
      dateOfBirth: 'Não informado',
      maritalStatus: 'Não informado',
      occupation: 'Não informado',
      cpf: 'Não informado',
      idNumber: 'Não informado',
      address: fallbackAddress,
      email: 'Não informado',
    };
  }

  const parentHasAddress = parent.street || parent.city;
  const address = parentHasAddress ? formatAddress(parent) : fallbackAddress;

  return {
    fullName: parent.fullName,
    nationality: formatNationality(parent.nationality),
    dateOfBirth: formatDateBR(parent.dateOfBirth),
    maritalStatus: formatMaritalStatus(parent.maritalStatus),
    occupation: parent.occupation ?? 'Não informado',
    cpf: parent.cpf ?? 'Não informado',
    idNumber: parent.idNumber ?? 'Não informado',
    address,
    email: parent.email ?? 'Não informado',
  };
}

// ---------------------------------------------------------------------------
// Top-level builder. Loads systemSettings for the fee/food tables and
// derives the full ContractRenderData bundle the renderer consumes.
// ---------------------------------------------------------------------------

export async function buildContractData(
  contract: ContractWithRelations,
): Promise<ContractRenderData> {
  if (!contract.lead) {
    throw new Error('Contract has no lead — buildContractData expects a lead-included contract.');
  }
  const lead = contract.lead;

  const settings = await prisma.systemSettings.findFirst();
  const pdfFeeTable = buildPdfFeeTable((settings?.feeTable as any[]) ?? null);
  const pdfFoodTable = buildPdfFoodTable((settings?.foodTable as any[]) ?? null);

  // Determine which children matter for this contract.
  const applicantChildren = lead.children.filter((c) => c.isApplicant);
  const relevantChildren =
    applicantChildren.length > 0
      ? applicantChildren
      : lead.children.length > 0
        ? [lead.children[0]]
        : [];

  // For RENEWAL contracts with a linked student, pin to that specific student
  // rather than enumerating every applicant child (avoids "Ana e Pedro" on
  // multi-child families when the renewal is for one of them).
  const isRenewalWithStudent = contract.enrollmentType === 'RENEWAL' && contract.student;

  const studentName = isRenewalWithStudent
    ? contract.student!.fullName
    : relevantChildren.length > 0
      ? relevantChildren.map((c) => c.fullName).join(' e ')
      : lead.familyName;

  const studentGrade =
    contract.enrollmentType === 'RENEWAL' && contract.studentGrade
      ? contract.studentGrade
      : relevantChildren.length > 0
        ? relevantChildren.map((c) => c.desiredGrade ?? 'Não informado').join(' / ')
        : (lead.desiredGrades?.[0] ?? 'Não informado');

  // gradeLevels powers fee-table row highlighting; multiple children may map
  // into different fee-table rows so we keep the full list.
  const gradeLevels =
    contract.enrollmentType === 'RENEWAL' && contract.studentGrade
      ? [determineGradeLevel(contract.studentGrade)]
      : relevantChildren.map((c) => determineGradeLevel(c.desiredGrade)).filter((g) => g !== '');
  const gradeLevel = gradeLevels[0] ?? determineGradeLevel(studentGrade);

  const { financialParent, academicParent } = resolveResponsibles(lead);
  const leadAddress = formatLeadAddress(lead.address);

  const annualValue = Number(contract.totalAnnualValue ?? 0);
  const enrollFee = Number(contract.enrollmentFee ?? 1400);
  const installments = contract.installments ?? 12;
  const negotiatedFinal = contract.negotiatedFinalValue ? Number(contract.negotiatedFinalValue) : null;
  const effectiveAnnualValue = negotiatedFinal ?? annualValue;
  const installmentValue = installments > 0 ? effectiveAnnualValue / installments : 0;
  const installmentValueDiscount = installmentValue * 0.8;

  const schoolYr = currentSchoolYear();
  const [startYr, endYr] = schoolYr.split('/');
  const contractDate = new Date().toLocaleDateString('pt-BR');

  const witnessSigners = contract.signers
    .filter((s) => s.role === 'WITNESS')
    .map((s) => ({ name: s.name, cpf: s.cpf ?? undefined }));

  const templateData: ContractTemplateData = {
    contractCode: contract.code,
    contractDate,
    schoolYear: schoolYr,
    yearStart: `1o de junho de ${startYr}`,
    yearEnd: `30 de junho de ${endYr}`,
    studentName,
    studentGrade,
    financialResponsible: buildResponsibleData(financialParent, leadAddress),
    academicResponsible: buildResponsibleData(academicParent, leadAddress),
    witnesses: witnessSigners,
    gradeLevel,
    gradeLevels: gradeLevels.length > 0 ? gradeLevels : undefined,
    totalAnnualValue: `R$ ${formatCurrency(annualValue)}`,
    enrollmentFee: formatCurrency(enrollFee),
    installmentValue: formatCurrency(installmentValue),
    installmentValueDiscount: formatCurrency(installmentValueDiscount),
    isRenewal: contract.enrollmentType === 'RENEWAL',
  };

  return { templateData, pdfFeeTable, pdfFoodTable, gradeLevels };
}
