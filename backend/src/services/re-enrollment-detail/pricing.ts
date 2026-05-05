import { calculateProposedValue, getFinancialStatus } from '../period-pricing.service.js';
import { toNum } from './utils.js';

interface PriceTableEntry {
  baseAnnualValue: unknown;
  enrollmentFee: unknown;
  discountPercent: unknown;
}

interface ExceptionRecord {
  id: string;
  overrideAnnualValue: unknown;
  overrideDiscountPercent: unknown;
  justification: string | null;
  approvalStatus: string;
  approvedById: string | null;
  approvalDecidedAt: Date | null;
  approvalNotes: string | null;
}

interface PreResponseRecord {
  id: string;
  status: string;
  communicatedAnnualValue: unknown;
  communicatedAdjustmentPercent: unknown;
  disagreementReason: string | null;
  negotiatedDiscountPercent: unknown;
  negotiatedFinalValue: unknown;
  negotiationJustification: string | null;
  respondedAt: Date | null;
  emailSentAt: Date | null;
  emailTo: string | null;
}

export interface PricingInputs {
  periodAdjustmentPercent: unknown;
  priceTableEntry: PriceTableEntry | null;
  exception: ExceptionRecord | null;
  preResponse: PreResponseRecord | null;
  contractPayments: Array<{ status: string }> | null;
}

export function buildPricingBlock(inputs: PricingInputs) {
  const { periodAdjustmentPercent, priceTableEntry, exception, preResponse, contractPayments } = inputs;

  const baseAnnualValue = toNum(priceTableEntry?.baseAnnualValue);
  const adjustmentPercent = toNum(periodAdjustmentPercent) ?? 0;
  const exceptionForCalc =
    exception && exception.approvalStatus === 'APPROVED'
      ? {
          overrideAnnualValue: toNum(exception.overrideAnnualValue),
          overrideDiscountPercent: toNum(exception.overrideDiscountPercent),
        }
      : undefined;

  const computed =
    baseAnnualValue != null
      ? calculateProposedValue({ baseAnnualValue, adjustmentPercent, exception: exceptionForCalc })
      : { proposedValue: null, finalValue: null, monthlyValue: null };

  const financialStatus = contractPayments
    ? getFinancialStatus(contractPayments.map((p) => ({ status: p.status })))
    : ('SEM_CONTRATO' as const);

  return {
    priceTableEntry: priceTableEntry
      ? {
          baseAnnualValue: toNum(priceTableEntry.baseAnnualValue),
          enrollmentFee: toNum(priceTableEntry.enrollmentFee),
          discountPercent: toNum(priceTableEntry.discountPercent),
        }
      : null,
    exception: exception
      ? {
          id: exception.id,
          overrideAnnualValue: toNum(exception.overrideAnnualValue),
          overrideDiscountPercent: toNum(exception.overrideDiscountPercent),
          justification: exception.justification,
          approvalStatus: exception.approvalStatus,
          approvedById: exception.approvedById,
          approvalDecidedAt: exception.approvalDecidedAt,
          approvalNotes: exception.approvalNotes,
        }
      : null,
    preResponse: preResponse
      ? {
          id: preResponse.id,
          status: preResponse.status,
          communicatedAnnualValue: toNum(preResponse.communicatedAnnualValue),
          communicatedAdjustmentPercent: toNum(preResponse.communicatedAdjustmentPercent),
          disagreementReason: preResponse.disagreementReason,
          negotiatedDiscountPercent: toNum(preResponse.negotiatedDiscountPercent),
          negotiatedFinalValue: toNum(preResponse.negotiatedFinalValue),
          negotiationJustification: preResponse.negotiationJustification,
          respondedAt: preResponse.respondedAt,
          emailSentAt: preResponse.emailSentAt,
          emailTo: preResponse.emailTo,
        }
      : null,
    computed: {
      adjustmentPercent,
      proposedValue: computed.proposedValue,
      finalValue: computed.finalValue,
      monthlyValue: computed.monthlyValue,
    },
    financialStatus,
  };
}
