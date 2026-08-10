import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect errors
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Uncaught: ${error.message}`);
  });

  try {
    console.log('Starting app test...\n');

    // Navigate to home
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    console.log('✓ Home view loaded');

    // Test navigation to each view
    const views = ['search', 'camera', 'collection', 'stats', 'discover', 'settings'];

    for (const view of views) {
      try {
        // Try clicking by href or other selectors
        await page.goto(`http://localhost:5173/${view}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
        console.log(`✓ ${view} view loaded`);
      } catch (e) {
        console.log(`⚠ ${view} - failed to load`);
      }
    }

    // Final report
    console.log('\n=== CONSOLE ERROR REPORT ===');
    if (errors.length === 0) {
      console.log('✅ CLEAN');
    } else {
      console.log(`Found ${errors.length} error(s):\n`);
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}`);
      });
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
