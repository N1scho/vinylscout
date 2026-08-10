import { chromium } from '@playwright/test';

const PORT = 5178;
const URL = `http://localhost:${PORT}`;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];

  // Collect console messages (errors only, not warnings)
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push(`[${type.toUpperCase()}] ${msg.text()}`);
    } else if (type === 'warning') {
      consoleWarnings.push(`[${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  // Also capture JavaScript errors
  page.on('pageerror', error => {
    consoleErrors.push(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log(`\n=== VinylScout Console Check ===\n`);
    console.log(`Loading ${URL}...`);

    // Navigate to the app
    await page.goto(URL, { waitUntil: 'networkidle' });

    console.log(`Page loaded. Performing hard refresh (Ctrl+Shift+R)...`);

    // Clear console errors from initial load
    consoleErrors.length = 0;
    consoleWarnings.length = 0;

    // Hard refresh: Ctrl+Shift+R
    await page.keyboard.press('Control+Shift+R');

    // Wait 3 seconds for page to fully load
    await page.waitForTimeout(3000);

    // Check if page is loaded
    const title = await page.title();
    console.log(`\nPage title: ${title}`);

    // Take a screenshot
    const screenshotPath = '/tmp/vinylscout-console-test.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Check console errors
    console.log(`\n=== Console Analysis ===`);
    if (consoleErrors.length === 0) {
      console.log('ZERO ERRORS');
    } else {
      console.log(`\nERRORS FOUND (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    if (consoleWarnings.length > 0) {
      console.log(`\n(Not counting ${consoleWarnings.length} warnings)`);
    }

    // Check for Search view - try to access it
    console.log(`\n=== Checking Search View ===`);
    try {
      // Look for search button or navigate to search route
      const searchButton = await page.$('button[aria-label*="Search"], a[href*="search"], [data-testid*="search"]');
      if (searchButton) {
        console.log('Search button/view found in DOM');
        await searchButton.click();
        await page.waitForTimeout(1000);
      } else {
        console.log('Search button not found in DOM - attempting direct navigation');
        // Try direct route
        await page.goto(`${URL}/#/search`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
      }

      // Check if search view loaded
      const searchViewContent = await page.locator('[data-testid="search-view"], .search-view').count();
      if (searchViewContent > 0) {
        console.log('Search view successfully loaded');
      } else {
        console.log('Search view element not found - checking page content');
        const bodyText = await page.textContent('body');
        if (bodyText && bodyText.toLowerCase().includes('search')) {
          console.log('Search-related content detected on page');
        }
      }
    } catch (e) {
      console.log(`Search view check error: ${e.message}`);
    }

  } finally {
    await context.close();
    await browser.close();
    console.log('\n=== Test Complete ===\n');
  }
})();
