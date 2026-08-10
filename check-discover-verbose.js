import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    };
    consoleLogs.push(logEntry);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`Page error: ${err.message}\n${err.stack}`);
  });

  page.on('response', (response) => {
    if (!response.ok() && response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:5185...');
    await page.goto('http://localhost:5185', { waitUntil: 'networkidle' });
    console.log('Page loaded.');

    // Wait a moment for initial render
    await page.waitForTimeout(500);

    // Look for the Discover button/link and click it
    let discoverClicked = false;
    console.log('Looking for Discover button...');

    // Try to find by text first
    const discoverLink = await page.$('text=Discover');
    if (discoverLink) {
      console.log('Found Discover via text selector');
      await discoverLink.click();
      discoverClicked = true;
    } else {
      // Try other selectors
      const buttons = await page.$$('button, a, [role="tab"]');
      console.log(`Found ${buttons.length} potential clickables`);
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.toLowerCase().includes('discover')) {
          console.log(`Clicking: ${text}`);
          await btn.click();
          discoverClicked = true;
          break;
        }
      }
    }

    if (discoverClicked) {
      console.log('Waiting for Discover view to load...');
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
  console.log(`Network 4xx/5xx: ${networkErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (networkErrors.length > 0) {
    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (errorCount === 0 && consoleErrors.length === 0 && networkErrors.length === 0) {
    console.log('\n✓ Status: CLEAN');
  } else {
    console.log('\n✗ Status: BROKEN');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
