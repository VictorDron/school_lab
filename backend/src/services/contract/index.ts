// Contract service barrel — re-exports all public API

export {
  createContract,
  createRenewalContract,
  getContractPrerequisites,
  findByLeadId,
  findById,
  addSigner,
  updateSigner,
  removeSigner,
  BATCH_SIZE,
} from './contract-core.service.js';

export {
  generateContractDocument,
  formatMaritalStatus,
  formatNationality,
} from './contract-pdf.service.js';

export {
  submitLegalApproval,
  submitFinancialApproval,
} from './contract-approval.service.js';

export {
  handleWebhookEvent,
  sendForSignature,
} from './contract-webhook.service.js';

export {
  createBatchRenewalContracts,
} from './contract-batch.service.js';
