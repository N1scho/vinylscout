import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`Page error: ${err.message}`);
  });

  try {
    // Navigate to the app
    await page.goto('http://localhost:5185', { waitUntil: 'networkidle' });

    // Wait a moment for initial render
    await page.waitForTimeout(500);

    // Look for the Discover button/link and click it
    // Try multiple selectors
    let discoverClicked = false;

    // Try to find by text first
    const discoverLink = await page.$('text=Discover');
    if (discoverLink) {
      await discoverLink.click();
      discoverClicked = true;
    } else {
      // Try other selectors
      const buttons = await page.$$('button, a, [role="tab"]');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.toLowerCase().includes('discover')) {
          await btn.click();
          discoverClicked = true;
          break;
        }
      }
    }

    if (discoverClicked) {
      // Wait for the view to load
      await page.waitForTimeout(2000);
    } else {
      consoleErrors.push('Could not find or click Discover button');
    }

  } catch (err) {
    consoleErrors.push(`Navigation/interaction error: ${err.message}`);
  }

  // Report
  console.log('\n=== CONSOLE REPORT ===');
  console.log(`Total console messages: ${consoleLogs.length}`);

  const errorCount = consoleLogs.filter(m => m.type === 'error').length;
  const warningCount = consoleLogs.filter(m => m.type === 'warning').length;

  console.log(`Errors: ${errorCount}`);
  console.log(`Warnings: ${warningCount}`);

  if (consoleErrors.length > 0) {
    console.log('\n=== ERRORS/WARNINGS ===');
    consoleErrors.forEach(err => console.log(err));
  }

  if (errorCount === 0 && consoleErrors.length === 0) {
    console.log('\nStatus: CLEAN');
  } else {
    console.log('\nStatus: BROKEN');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
