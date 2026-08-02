import { test, expect } from '@playwright/test';

test.describe('Projects Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('AC-001: Invoz card renders', async ({ page }) => {
    await expect(page.getByText('Invoz', { exact: true }).first()).toBeVisible();
    // Tag appears in card, use exact match to avoid matching description text
    await expect(page.getByText('Audio/Speech ML', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /View live app/i }).first()).toBeVisible();
  });

  test('AC-002: Holus content engine card renders', async ({ page }) => {
    await expect(page.getByText('Social Media Automatization', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Publishing API', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Federated publishing API')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try content generator' })).toBeVisible();
  });

  test('AC-003: Holus Observatory card renders', async ({ page }) => {
    await expect(page.getByText('Holus Observatory')).toBeVisible();
    await expect(page.getByText('Observability', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('observability dashboard')).toBeVisible();
    const demoLink = page.getByRole('link', { name: 'Watch agents live' });
    await expect(demoLink).toBeVisible();
    await expect(demoLink).toHaveAttribute('href', /holus-observatory.vercel.app/);
  });

  test('AC-004: Pilaster card renders', async ({ page }) => {
    await expect(page.getByText('Pilaster', { exact: true })).toBeVisible();
  });

  test('AC-005: Genpeli card renders', async ({ page }) => {
    await expect(page.getByText('Genpeli', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Video AI', { exact: true }).first()).toBeVisible();
  });

  test('AC-006: Job Tracker CRM card renders', async ({ page }) => {
    await expect(page.getByText('Job Tracker CRM')).toBeVisible();
  });

  test('AC-007: Holusight card renders', async ({ page }) => {
    await expect(page.getByText('Holusight', { exact: true }).first()).toBeVisible();
  });

  test('AC-008: AI Advisory Board card renders', async ({ page }) => {
    await expect(page.getByText('AI Advisory Board')).toBeVisible();
  });

  test('AC-009: Social Media Pipeline is gone', async ({ page }) => {
    await expect(page.getByText('Social Media Pipeline')).not.toBeVisible();
  });

  test('AC-010: Chatbot reframed as engineering story', async ({ page }) => {
    // Chatbot is tier 3 inside the personal/research section.
    await expect(page.getByText('How I Built This Chatbot')).toBeVisible();
    await expect(page.getByText('LLM-as-judge evaluation')).toBeVisible();
    await expect(page.getByText('Self-Improving AI Chatbot')).not.toBeVisible();
  });
});

test.describe('Projects Page Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('AC-027: Projects page on mobile', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Invoz', { exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
