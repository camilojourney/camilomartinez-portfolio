import { test, expect } from '@playwright/test';

test.describe('External Links', () => {
  test('AC-019: Holus Observatory demo link works', async ({ request }) => {
    const response = await request.get('https://holus-observatory.vercel.app');
    // Vercel Auth may return 401 for API requests — accept any non-server-error
    expect(response.status()).toBeLessThan(500);
  });

  test('AC-020: Invoz link works', async ({ request }) => {
    const response = await request.get('https://invoz.io');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-021: Pilaster link works', async ({ request }) => {
    const response = await request.get('https://pilaster.ai');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-022: Genpeli link works', async ({ request }) => {
    const response = await request.get('https://frontend-six-rho-96.vercel.app');
    expect(response.status()).toBe(200);
  });

  test('AC-023: Holusight link works', async ({ request }) => {
    const response = await request.get('https://holusight.com');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-024: AI Advisor Board link works', async ({ request }) => {
    const response = await request.get('https://ai-advisor-board.vercel.app');
    expect(response.status()).toBe(200);
  });

  test('AC-025: Job Tracker link works', async ({ request }) => {
    const response = await request.get('https://job-tracker-swart-eta.vercel.app');
    expect(response.status()).toBe(200);
  });
});
