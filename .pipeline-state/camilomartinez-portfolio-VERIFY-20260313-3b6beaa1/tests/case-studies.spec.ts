import { test, expect } from '@playwright/test';

test.describe('Case Study Pages', () => {
  test('AC-011: Holus case study loads', async ({ page }) => {
    await page.goto('/projects/holus');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Holus.*AI Marketing Strategist/ })).toBeVisible();
    await expect(page.getByText('32 specialized agents').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /holusight\.com/ })).not.toBeVisible();
  });

  test('AC-012: Holus Observatory case study loads', async ({ page }) => {
    await page.goto('/projects/holus-observatory');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Holus Observatory/ })).toBeVisible();
    await expect(page.getByText('Multi-Agent Monitoring Dashboard').first()).toBeVisible();
    // Link text is "View Live App" — check href points to holus-observatory
    await expect(page.locator('a[href*="holus-observatory.vercel.app"]').first()).toBeVisible();
  });

  test('AC-013: Genpeli case study loads', async ({ page }) => {
    await page.goto('/projects/genpeli');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Genpeli/ })).toBeVisible();
    await expect(page.getByText('AI Video Pipeline').first()).toBeVisible();
  });

  test('AC-014: Invoz case study loads', async ({ page }) => {
    await page.goto('/projects/invoz-ai');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Invoz/ })).toBeVisible();
  });

  test('AC-015: Holusight case study loads', async ({ page }) => {
    await page.goto('/projects/holusight');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Holusight/ })).toBeVisible();
    await expect(page.locator('a[href*="holusight.com"]')).toBeVisible();
  });

  test('AC-016: Social Media Pipeline case study returns 404', async ({ page }) => {
    const response = await page.goto('/projects/social-media-pipeline');
    if (response) {
        expect(response.status() === 404 || (await page.getByText(/not found/i).isVisible())).toBe(true);
    }
  });
});
