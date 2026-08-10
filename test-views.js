import { chromium } from '@playwright/test';

const PORT = 5178;
const URL = `http://localhost:${PORT}`;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];

  // Collect console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log(`\n=== VinylScout View Check ===\n`);

    // Initial load
    await page.goto(URL, { waitUntil: 'networkidle' });

    // Hard refresh
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(3000);

    console.log(`Page title: ${await page.title()}`);
    console.log(`Current URL: ${page.url()}`);

    // Check for nav elements and routes
    console.log(`\n=== Checking Navigation Elements ===`);

    // Look for any clickable navigation
    const navButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="tab"], [role="button"]'));
      return buttons
        .filter(b => b.textContent && b.textContent.trim())
        .map(b => ({
          text: b.textContent.trim().substring(0, 50),
          tag: b.tagName,
          className: b.className
        }))
        .slice(0, 20);
    });

    console.log('Navigation elements:');
    navButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.tag} - ${btn.text}`);
    });

    // Check for router links
    console.log(`\n=== Checking for Router/Navigation Setup ===`);
    const routeInfo = await page.evaluate(() => {
      // Look for react router setup
      const hashRoutes = Array.from(document.querySelectorAll('a[href*="#"], button[onclick*="#"]')).length;
      const pathRoutes = Array.from(document.querySelectorAll('a[href^="/"]')).length;

      return {
        hashRoutes,
        pathRoutes,
        currentHash: window.location.hash,
        currentPath: window.location.pathname
      };
    });

    console.log(`Hash-based routes found: ${routeInfo.hashRoutes}`);
    console.log(`Path-based routes found: ${routeInfo.pathRoutes}`);
    console.log(`Current location: ${routeInfo.currentPath}${routeInfo.currentHash}`);

    // Try navigating to search directly
    console.log(`\n=== Attempting Search View Navigation ===`);

    // Try different possible search routes
    const searchRoutes = [
      '/#/search',
      '/search',
      '/#search',
      '/?view=search'
    ];

    for (const route of searchRoutes) {
      try {
        console.log(`Trying: ${route}`);
        await page.goto(`${URL}${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const content = await page.textContent('body');
        if (content && content.includes('Search')) {
          console.log(`  ✓ Search content found at ${route}`);
          break;
        } else {
          console.log(`  - No search content at ${route}`);
        }
      } catch (e) {
        console.log(`  - Error navigating to ${route}: ${e.message}`);
      }
    }

    // Final check for errors
    console.log(`\n=== Final Console Check ===`);
    if (consoleErrors.length === 0) {
      console.log('ZERO ERRORS');
    } else {
      console.log(`ERRORS FOUND (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

  } finally {
    await context.close();
    await browser.close();
    console.log('\n=== Test Complete ===\n');
  }
})();
