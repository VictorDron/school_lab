import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmitFooter } from '../sections/SubmitFooter';

const baseProps = {
  validationErrors: {},
  lgpdConsent: true,
  isSubmitting: false,
  submitCooldown: false,
  onSubmit: vi.fn(),
};

describe('SubmitFooter', () => {
  it('hides the validation banner when there are no errors', () => {
    render(<SubmitFooter {...baseProps} onSubmit={vi.fn()} />);
    expect(screen.queryByText(/campos obrigatórios/i)).not.toBeInTheDocument();
  });

  it('shows the validation banner when at least one error key exists', () => {
    render(
      <SubmitFooter {...baseProps} onSubmit={vi.fn()} validationErrors={{ 'health.weight': 'Obrigatório' }} />
    );
    expect(screen.getByText(/campos obrigatórios que precisam ser preenchidos/i)).toBeInTheDocument();
  });

  it('disables the submit button until LGPD consent is checked', () => {
    render(<SubmitFooter {...baseProps} onSubmit={vi.fn()} lgpdConsent={false} />);
    expect(screen.getByRole('button', { name: /confirmar rematrícula/i })).toBeDisabled();
  });

  it('disables the submit button while a request is in flight', () => {
    render(<SubmitFooter {...baseProps} onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
  });

  it('disables the submit button during the post-error cooldown', () => {
    render(<SubmitFooter {...baseProps} onSubmit={vi.fn()} submitCooldown={true} />);
    expect(screen.getByRole('button', { name: /confirmar rematrícula/i })).toBeDisabled();
  });

  it('invokes onSubmit when the button is clicked and enabled', () => {
    const onSubmit = vi.fn();
    render(<SubmitFooter {...baseProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /confirmar rematrícula/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders the spinner label while submitting', () => {
    render(<SubmitFooter {...baseProps} onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /enviando/i })).toBeInTheDocument();
  });
});
