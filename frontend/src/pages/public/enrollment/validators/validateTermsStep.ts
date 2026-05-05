import type { ValidatorContext } from './types';

export function validateTermsStep(_ctx: ValidatorContext): boolean {
  // Terms acceptance is gated by the submit button itself.
  return true;
}
