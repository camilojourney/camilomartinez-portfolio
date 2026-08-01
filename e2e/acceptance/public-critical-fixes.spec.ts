import { test, expect } from '@playwright/test';

const auditedRoutes = [
  '/',
  '/projects',
  '/about',
  '/contact',
  '/projects/invoz-ai',
  '/projects/interactive-chatbot',
  '/apps/fitness-dashboard',
];

async function openChat(page: import('@playwright/test').Page) {
  const chatButton = page.getByRole('button', { name: /Chat with AI assistant/i });
  await expect(chatButton).toBeVisible({ timeout: 10000 });
  await chatButton.click();
  await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible();
}

test.describe('public chatbot resilience', () => {
  test('streams mocked split SSE frames into the chat UI', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          const encoder = new TextEncoder();
          return new Response(new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('data: {"content":"Camilo ships '));
              controller.enqueue(encoder.encode('speech ML"}\n\ndata: {"content":" systems."}\n\n'));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    await page.getByPlaceholder(/Ask anything/i).fill('What does Camilo build?');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Camilo ships speech ML systems.')).toBeVisible();
  });

  test('shows safe contact fallback for provider failure and retries successfully', async ({ page }) => {
    await page.addInitScript(() => {
      let attempts = 0;
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          attempts += 1;
          if (attempts === 1) {
            return Response.json({ error: 'assistant_unavailable' }, { status: 503 });
          }
          return new Response('data: {"content":"Back online."}\n\ndata: [DONE]\n\n', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    await page.getByPlaceholder(/Ask anything/i).fill('Can I contact Camilo?');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/assistant is temporarily unavailable/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /juancamilomabe@gmail.com/i })).toHaveAttribute('href', 'mailto:juancamilomabe@gmail.com');

    await page.getByRole('button', { name: 'Retry last question' }).click();
    await expect(page.getByText('Back online.')).toBeVisible();
  });

  test('rejects a truncated stream and offers a retry', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          return new Response('data: {"content":"Partial answer"}\n\n', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    await page.getByPlaceholder(/Ask anything/i).fill('Do not truncate this');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/assistant is temporarily unavailable/i)).toBeVisible();
    await expect(page.getByText('Partial answer')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry last question' })).toBeVisible();
  });

  test('rejects trailing incomplete data after the done frame', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          return new Response(
            'data: {"content":"Looks complete"}\n\ndata: [DONE]\n\ndata: {"content":"unterminated',
            { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
          );
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    await page.getByPlaceholder(/Ask anything/i).fill('Validate the whole stream');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText(/assistant is temporarily unavailable/i)).toBeVisible();
    await expect(page.getByText('Looks complete')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry last question' })).toBeVisible();
  });

  test('shows rate-limit guidance without offering an immediate retry', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          return Response.json(
            { error: 'rate_limited', message: 'Too many chat requests. Please try again in a minute.' },
            { status: 429, headers: { 'Retry-After': '1' } },
          );
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    const input = page.getByPlaceholder(/Ask anything/i);
    await input.fill('One request too many');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Too many chat requests. Please try again in a minute.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry last question' })).toHaveCount(0);
    await expect(input).toBeDisabled();
    await expect(input).toBeEnabled({ timeout: 2_000 });
  });

  test('blocks rapid duplicate sends while a request is in flight', async ({ page }) => {
    await page.addInitScript(() => {
      let chatRequests = 0;
      const originalFetch = window.fetch.bind(window);
      (window as unknown as { chatRequests: number }).chatRequests = 0;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          chatRequests += 1;
          (window as unknown as { chatRequests: number }).chatRequests = chatRequests;
          await new Promise((resolve) => setTimeout(resolve, 300));
          return new Response('data: {"content":"One response."}\n\ndata: [DONE]\n\n', {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          });
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    const input = page.getByPlaceholder(/Ask anything/i);
    await input.fill('Only send once');
    await Promise.all([
      input.press('Enter'),
      input.press('Enter'),
    ]);

    await expect(page.getByText('One response.')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { chatRequests: number }).chatRequests)).toBe(1);
  });

  test('aborts an in-flight chat request when the widget closes', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      (window as unknown as { chatAborted: boolean }).chatAborted = false;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/api/chat')) {
          init?.signal?.addEventListener('abort', () => {
            (window as unknown as { chatAborted: boolean }).chatAborted = true;
          });
          return new Promise<Response>(() => {});
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/');
    await openChat(page);
    await page.getByPlaceholder(/Ask anything/i).fill('Abort this');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.locator('[data-chat-widget] > button[aria-label="Close chat"]').click();

    await expect.poll(() => page.evaluate(() => (window as unknown as { chatAborted: boolean }).chatAborted)).toBe(true);
    await page.getByRole('button', { name: /Chat with AI assistant/i }).click();
    const emptyAssistantMessages = await page.locator('[data-chat-message-role="assistant"]').evaluateAll((messages) => (
      messages.filter((message) => !message.textContent?.trim()).length
    ));
    expect(emptyAssistantMessages).toBe(0);
  });
});

test.describe('public route accessibility and integrity', () => {
  for (const width of [390, 414, 500]) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });

      for (const route of auditedRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const overflow = await page.evaluate(() => (
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth
        ));
        expect.soft(overflow, `${route} overflowed at ${width}px`).toBe(false);
      }
    });
  }

  test('mobile navigation control is named and related to its menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const openButton = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(openButton).toHaveAttribute('aria-expanded', 'false');
    await expect(openButton).toHaveAttribute('aria-controls', 'mobile-navigation-menu');
    await openButton.click();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-navigation-menu')).toBeVisible();
  });

  test('footer links keep mobile touch target height without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const footerLinks = await page.locator('footer a').evaluateAll((links) => links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { text: link.textContent?.trim(), height: rect.height };
    }));
    expect(footerLinks.length).toBeGreaterThan(0);
    for (const link of footerLinks) {
      expect.soft(link.height, `${link.text} touch target height`).toBeGreaterThanOrEqual(44);
    }

    const overflow = await page.evaluate(() => (
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth
    ));
    expect(overflow).toBe(false);
  });

  test('sitemap contains only valid URLs', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.ok()).toBe(true);
    const xml = await page.locator('body').innerText();
    expect(xml).not.toContain('camilomartinez.cohttps');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = new URL(match[1]);
      expect(url.origin).toBe('https://camilomartinez.co');
    }
  });

  test('interactive chatbot case study has no broken image request', async ({ page }) => {
    const badImages: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/_next/image') && response.status() >= 400) {
        badImages.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/projects/interactive-chatbot');
    await page.waitForLoadState('networkidle');

    expect(badImages).toEqual([]);
  });

  test('fitness dashboard has no hydration or console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('/_vercel/')) {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/apps/fitness-dashboard');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });
});
