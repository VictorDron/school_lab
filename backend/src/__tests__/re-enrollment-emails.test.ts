import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }) },
  })),
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('sendReEnrollmentFormConfirmationEmail', () => {
  it.todo('sends email with correct subject containing student name');
  it.todo('skips sending when to is empty');
  it.todo('HTML contains confirmation text in pt-BR');
});

describe('sendReEnrollmentContractSentEmail', () => {
  it.todo('sends email with subject mentioning contrato de renovação');
  it.todo('HTML mentions ClickSign and assinatura digital');
});

describe('sendReEnrollmentWelcomeEmail', () => {
  it.todo('sends email with targetYear in subject');
  it.todo('HTML includes new grade when provided');
  it.todo('HTML omits grade section when newGrade is null');
});
