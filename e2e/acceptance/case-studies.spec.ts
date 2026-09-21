import { test, expect } from '@playwright/test';

test.describe('Case Study Pages', () => {
  test('AC-011: Holus case study loads', async ({ page }) => {
    await page.goto('/projects/holus');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Holus Content Engine/ })).toBeVisible();
    await expect(page.getByText('Specialized agents').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /holusight\.com/ })).not.toBeVisible();
  });

  test('AC-012: Holus Observatory case study loads', async ({ page }) => {
    await page.goto('/projects/holus-observatory');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Holus Observatory/ })).toBeVisible();
    await expect(page.getByText('Multi-Agent Monitoring Dashboard').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Live App' })).toHaveCount(0);
  });

  test('AC-013: Genpeli case study loads', async ({ page }) => {
    await page.goto('/projects/genpeli');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Genpeli/ })).toBeVisible();
    await expect(page.getByText('AI Video Editing Pipeline').first()).toBeVisible();
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
    await expect(page.locator('a[href*="holusight.com"]')).toHaveCount(0);
  });

  test('AC-016: Social Media Pipeline case study loads', async ({ page }) => {
    const response = await page.goto('/projects/social-media-pipeline');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: 'Social Media Pipeline' })).toBeVisible();
  });

  test('ClaimProof case study explains ownership and the trust boundary', async ({ page }) => {
    await page.goto('/projects/claimproof');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'ClaimProof' })).toBeVisible();
    await expect(page.getByText('Creator and Candidate Experience/Product Lead')).toBeVisible();
    await expect(page.getByText(/does not score facial expression, gaze, emotion, accent, honesty, or appearance/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Personal GitHub copy' })).toHaveAttribute(
      'href',
      'https://github.com/camilojourney/TrustIntheFunnelHackathon-JJCN',
    );
    await expect(page.getByRole('link', { name: 'Team repository' })).toHaveAttribute(
      'href',
      'https://github.com/kireetijosyula41/TrustIntheFunnelHackathon-JJCN',
    );
  });
});
