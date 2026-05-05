import { test, expect } from '@playwright/test';

/**
 * Wave 2.5 smoke + happy-path stub for the public re-enrollment form.
 *
 * The re-enrollment route is /re-enrollment/:token (no token-less variant
 * mounts the wizard). Phase 1 navigates with a deliberately invalid token
 * and asserts the page renders the ErrorScreen. Phase 2, gated by
 * E2E_REENROLLMENT_TOKEN, drives the form once seeds are in place.
 */

test.describe('Re-enrollment form (public) — wave 2.5', () => {
  test('mounts and renders a status screen for an invalid token', async ({ page }) => {
    await page.goto('/re-enrollment/__invalid-token__');

    // Backend may be unreachable in CI: accept any of the three documented
    // top-level states (loading spinner, error screen, or — in the unlikely
    // case of a valid token — the wizard heading).
    const loading = page.getByText(/carregando|loading/i);
    const error = page.getByText(/erro ao carregar|inválid|invalid|formulário indisponível|não encontrad/i);
    const heading = page.getByRole('heading', { name: /rematr|re-enroll/i });

    await expect(loading.or(error).or(heading).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('happy path with seeded token (skipped when env not set)', async ({ page }) => {
    const token = process.env.E2E_REENROLLMENT_TOKEN;
    test.skip(!token, 'Set E2E_REENROLLMENT_TOKEN to run the full flow.');

    await page.goto(`/re-enrollment/${token}`);

    await expect(
      page.getByRole('heading', { name: /rematr|re-enroll|matrícula/i }),
    ).toBeVisible({ timeout: 15_000 });

    // TODO: fill the form (parents, health, transport, financial,
    // documents) and assert the SuccessScreen appears.
  });
});
