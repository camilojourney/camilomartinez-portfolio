import { test, expect } from '@playwright/test';

// ============================================================
// PORTFOLIO AUDIT -- Acceptance Tests
// Date: 2026-03-26
// Tests: Pages load, links work, responsive, accessibility, chat
// ============================================================

test.describe('Page Loading', () => {
  test('Homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Juan Camilo Martinez|Camilo/i);
  });

  test('About page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toContainText('About Me');
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText('Get in Touch');
  });

  test('Blog page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Latest Thoughts');
  });

  test('Projects page loads (same as home)', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText('Applied AI Engineer');
  });

  test('Bookshelf page loads', async ({ page }) => {
    await page.goto('/bookshelf');
    await expect(page.locator('h1')).toContainText('My Bookshelf');
  });

  test('Tools page loads', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.locator('h1')).toContainText('Resources');
  });
});

test.describe('Navigation Links', () => {
  test('Desktop nav links are visible and correct', async ({ page }) => {
    await page.goto('/');
    // Desktop nav should have work, about, contact
    const desktopNav = page.locator('.hidden.md\\:block nav');
    await expect(desktopNav.locator('a[href="/projects"]')).toBeVisible();
    await expect(desktopNav.locator('a[href="/about"]')).toBeVisible();
    await expect(desktopNav.locator('a[href="/contact"]')).toBeVisible();
  });

  test('Work nav link navigates to projects', async ({ page }) => {
    await page.goto('/about');
    await page.locator('.hidden.md\\:block nav a[href="/projects"]').click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('About nav link works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hidden.md\\:block nav a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('Contact nav link works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hidden.md\\:block nav a[href="/contact"]').click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test('Footer social links have correct hrefs', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="https://github.com/camilojourney"]')).toBeVisible();
    await expect(footer.locator('a[href="https://www.linkedin.com/in/camilomartinez-ai/"]')).toBeVisible();
  });

  test('Footer social links open in new tab', async ({ page }) => {
    await page.goto('/');
    const githubLink = page.locator('footer a[href="https://github.com/camilojourney"]');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('Project Cards', () => {
  test('Featured projects are visible on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Invoz')).toBeVisible();
    await expect(page.locator('text=Holus Observatory')).toBeVisible();
  });

  test('Project case study links work', async ({ page }) => {
    await page.goto('/');
    // Find and click first case study link
    const caseStudyLink = page.locator('a[href="/projects/invoz-ai"]').first();
    await caseStudyLink.click();
    await expect(page).toHaveURL(/\/projects\/invoz-ai/);
  });

  test('Project status badges are visible', async ({ page }) => {
    await page.goto('/');
    const liveBadges = page.locator('text=Live');
    await expect(liveBadges.first()).toBeVisible();
  });

  test('Project tags are displayed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Audio/Speech ML').first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('Mobile nav hamburger appears at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Mobile nav should be visible, desktop nav hidden
    const mobileNav = page.locator('.md\\:hidden nav');
    await expect(mobileNav).toBeVisible();
    // Hamburger button should be present
    const menuButton = mobileNav.locator('button');
    await expect(menuButton).toBeVisible();
  });

  test('Mobile menu opens and shows nav items', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const mobileNav = page.locator('.md\\:hidden nav');
    await mobileNav.locator('button').click();
    // Nav items should appear
    await expect(mobileNav.locator('a[href="/projects"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/about"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/contact"]')).toBeVisible();
  });

  test('Project grid is single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // All project cards should stack vertically
    const projectCards = page.locator('[class*="grid-cols-1"]');
    await expect(projectCards.first()).toBeVisible();
  });

  test('Hero text is readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    // Hero should not overflow viewport width
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('Contact page CTAs are stacked on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contact');
    // Both CTA buttons should be visible
    await expect(page.locator('text=Send Email').first()).toBeVisible();
    await expect(page.locator('text=Connect on LinkedIn').first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('Page has lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('All images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} missing alt text`).toBeTruthy();
    }
  });

  test('Heading hierarchy is valid on about page', async ({ page }) => {
    await page.goto('/about');
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    // h2s should exist
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('Interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/');
    // Tab to first nav link
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    // Should focus on a link or button
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    // Check that focus-visible styles exist in CSS
    const hasCustomFocus = await page.evaluate(() => {
      const sheets = document.styleSheets;
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSStyleRule && rule.selectorText?.includes('focus-visible')) {
              return true;
            }
          }
        } catch { /* cross-origin */ }
      }
      return false;
    });
    expect(hasCustomFocus).toBe(true);
  });

  test('Color scheme is set to dark', async ({ page }) => {
    await page.goto('/');
    const colorScheme = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).colorScheme;
    });
    expect(colorScheme).toContain('dark');
  });
});

test.describe('Chat Widget', () => {
  test('Chat trigger button is visible', async ({ page }) => {
    await page.goto('/');
    const chatButton = page.locator('button[aria-label="Chat with AI assistant"]');
    await expect(chatButton).toBeVisible();
  });

  test('Chat widget opens on button click', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Chat with AI assistant"]').click();
    // Chat panel should appear
    const chatPanel = page.locator('text=AI Assistant');
    await expect(chatPanel.first()).toBeVisible();
  });

  test('Chat widget has suggested questions', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Chat with AI assistant"]').click();
    await expect(page.locator("text=What's your speech ML pipeline?")).toBeVisible();
  });

  test('Chat widget close button works', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Chat with AI assistant"]').click();
    await page.locator('button[aria-label="Close chat"]').click();
    // Chat panel should be gone
    await expect(page.locator('button[aria-label="Close chat"]')).not.toBeVisible();
  });

  test('Chat input is focusable', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Chat with AI assistant"]').click();
    const input = page.locator('input[placeholder="Ask anything..."]');
    await expect(input).toBeVisible();
    await input.focus();
    await expect(input).toBeFocused();
  });
});

test.describe('SEO & Metadata', () => {
  test('Meta description exists', async ({ page }) => {
    await page.goto('/');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).toContain('AI');
  });

  test('Open Graph tags exist', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
  });

  test('Twitter card tags exist', async ({ page }) => {
    await page.goto('/');
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
  });

  test('Canonical URL exists', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /.+/);
  });

  test('Schema.org structured data exists', async ({ page }) => {
    await page.goto('/');
    const schemaScript = page.locator('script[type="application/ld+json"]');
    const content = await schemaScript.textContent();
    expect(content).toContain('Person');
    expect(content).toContain('Applied AI Engineer');
  });
});
