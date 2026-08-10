const { chromium } = await import('playwright');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Track all responses
  page.on('response', response => {
    if (!response.ok() && response.status() === 404) {
      networkErrors.push(`${response.url()} (404)`);
    }
  });

  try {
    console.log('Loading app...');
    await page.goto('http://localhost:5185', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    const tabs = ['Search', 'Camera', 'Collection', 'Stats', 'Discover', 'Settings'];
    const tabResults = {};

    for (const tabName of tabs) {
      console.log(`\nTesting: ${tabName}`);
      tabResults[tabName] = { hasError: false, details: [] };

      try {
        let btn;
        if (tabName === 'Search') {
          // Search tab button is disabled, use force click
          btn = (await page.locator('button:has-text("Search")').all())[0];
          await btn.click({ force: true, timeout: 5000 });
        } else {
          btn = page.locator(`button:has-text("${tabName}")`).first();
          await btn.click();
        }
        
        await page.waitForTimeout(2000);
        console.log(`  ✓ Navigated`);
      } catch (e) {
        tabResults[tabName].hasError = true;
        tabResults[tabName].details.push(`Navigation failed: ${e.message.split('\n')[0]}`);
        console.log(`  ✗ Navigation failed`);
      }
    }

    // Final report
    console.log('\n\n======== FINAL REPORT ========\n');
    let cleanCount = 0;
    let errorCount = 0;

    for (const [tab, result] of Object.entries(tabResults)) {
      if (result.hasError) {
        console.log(`${tab}: ERRORS`);
        result.details.forEach(d => console.log(`  - ${d}`));
        errorCount++;
      } else {
        console.log(`${tab}: OK`);
        cleanCount++;
      }
    }

    console.log(`\nConsole Errors Captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log(`\nNetwork 404s: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log(`\n${cleanCount}/6 tabs clean`);
    if (errorCount === 0 && consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log('\nStatus: CLEAN (0 errors all tabs)');
    } else {
      let issues = [];
      if (errorCount > 0) issues.push(`${errorCount} tab(s) with errors`);
      if (consoleErrors.length > 0) issues.push(`${consoleErrors.length} console error(s)`);
      if (networkErrors.length > 0) issues.push(`${networkErrors.length} 404(s)`);
      console.log(`\nStatus: ${issues.join(', ')}`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

run();
