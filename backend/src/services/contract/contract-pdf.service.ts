// Thin re-export shim — preserves the './contract-pdf.service.js' import
// path that contract-approval, contract-webhook, and the contract barrel
// already use. The real implementation lives in ./contract-pdf/index.ts and
// its sibling modules.

export {
  generateContractDocument,
  formatMaritalStatus,
  formatNationality,
} from './contract-pdf/index.js';
