import { test, expect } from '@playwright/test';

/**
 * Wave 2.5 smoke + happy-path stub for the public admission form.
 *
 * Phase 1 (smoke, always runs): visits /admissions/apply with no token. The
 * AdmissionFormPage's `restrictedAccess` status card must mount — the page
 * does not crash and surfaces an explicit invalid-link state.
 *
 * Phase 2 (happy-path, gated): when the developer exports
 * `E2E_ADMISSION_TOKEN` (e.g. minted by a future seed-e2e-admission.ts
 * script), the spec drives the four-step wizard. The full step-by-step
 * fill is intentionally a TODO so the spec can be lit up incrementally
 * without going red on every contract change.
 */

test.describe('Admission form (public) — wave 2.5', () => {
  test('mounts and renders restricted-access card without a token', async ({ page }) => {
    await page.goto('/admissions/apply');

    const restricted = page.getByText(/acesso restrito|restricted/i);
    const invalid = page.getByText(/link.*inválid|invalid|expirad/i);
    const heading = page.getByRole('heading', { name: /admiss/i });

    await expect(restricted.or(invalid).or(heading).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('happy path with seeded token (skipped when env not set)', async ({ page }) => {
    const token = process.env.E2E_ADMISSION_TOKEN;
    test.skip(!token, 'Set E2E_ADMISSION_TOKEN to run the full flow.');

    await page.goto(`/admissions/apply?token=${token}`);

    await expect(
      page.getByRole('heading', { name: /admiss|inscri/i }),
    ).toBeVisible({ timeout: 15_000 });

    // TODO: drive the four steps and assert the success card appears.
  });
});
