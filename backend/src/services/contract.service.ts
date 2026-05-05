// Shim: preserves import path for all consumers
// Actual implementation in ./contract/ directory
export * from './contract/index.js';

// Re-export types for backward compatibility
export type { CreateContractData, PrerequisiteItem } from '../types/contract.types.js';
