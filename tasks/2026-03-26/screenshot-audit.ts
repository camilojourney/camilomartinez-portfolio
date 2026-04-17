import { chromium } from '@playwright/test';

async function audit() {
  const browser = await chromium.launch();
  const outDir = '/Users/mini/.openclaw/workspace/github/camilomartinez-portfolio/tasks/2026-03-26';

  // Desktop screenshots
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktop = await desktopCtx.newPage();

  await desktop.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await desktop.waitForTimeout(3000);
  await desktop.screenshot({ path: `${outDir}/desktop-home.png`, fullPage: true });
  console.log('Desktop home captured');

  await desktop.goto('http://localhost:3005/about', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await desktop.waitForTimeout(2000);
  await desktop.screenshot({ path: `${outDir}/desktop-about.png`, fullPage: true });
  console.log('Desktop about captured');

  await desktop.goto('http://localhost:3005/contact', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await desktop.waitForTimeout(2000);
  await desktop.screenshot({ path: `${outDir}/desktop-contact.png`, fullPage: true });
  console.log('Desktop contact captured');

  // Mobile screenshots
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobile = await mobileCtx.newPage();

  await mobile.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await mobile.waitForTimeout(3000);
  await mobile.screenshot({ path: `${outDir}/mobile-home.png`, fullPage: true });
  console.log('Mobile home captured');

  await mobile.goto('http://localhost:3005/about', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await mobile.waitForTimeout(2000);
  await mobile.screenshot({ path: `${outDir}/mobile-about.png`, fullPage: true });
  console.log('Mobile about captured');

  await mobile.goto('http://localhost:3005/contact', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await mobile.waitForTimeout(2000);
  await mobile.screenshot({ path: `${outDir}/mobile-contact.png`, fullPage: true });
  console.log('Mobile contact captured');

  // Axe accessibility check on home page
  await desktop.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await desktop.waitForTimeout(2000);

  // Inject axe-core
  try {
    await desktop.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' });
    await desktop.waitForTimeout(1000);

    const results = await desktop.evaluate(async () => {
      // @ts-ignore
      return await axe.run();
    });

    const violations = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));

    console.log('=== AXE VIOLATIONS ===');
    console.log(JSON.stringify(violations, null, 2));
    console.log(`Total violations: ${violations.length}`);
  } catch (e) {
    console.log('Axe-core injection failed, skipping accessibility scan:', e);
  }

  await browser.close();
  console.log('Done');
}

audit().catch(console.error);
