export { canDepartmentApprove } from './authorization.js';
export { getApprovalMatrix, getFullPipelineStatus, getGateConfig } from './queries.js';
export {
  createApprovalsForGate,
  submitDepartmentApproval,
  checkAndAdvanceGate,
} from './lifecycle.js';
