const { chromium } = await import('playwright');

const tabs = ['Search', 'Camera', 'Collection', 'Stats', 'Discover', 'Settings'];
const results = {};
let allErrors = [];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      allErrors.push(`[Console] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    allErrors.push(`[Page] ${error.toString()}`);
  });

  try {
    console.log('Loading http://localhost:5185...');
    await page.goto('http://localhost:5185', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    for (const tab of tabs) {
      const errorsBefore = allErrors.length;
      console.log(`\nTesting tab: ${tab}`);
      results[tab] = {};
      
      try {
        // Click the tab
        await page.click(`button:has-text("${tab}")`);
        console.log(`  ✓ Clicked`);
        await page.waitForTimeout(1500);
      } catch (e) {
        results[tab].clickError = e.message;
        console.log(`  ✗ Failed to click: ${e.message}`);
      }

      const errorsAfter = allErrors.length;
      if (errorsAfter > errorsBefore) {
        results[tab].errors = allErrors.slice(errorsBefore, errorsAfter);
      } else {
        results[tab].errors = [];
      }
    }

    // Final report
    console.log('\n\n=== TEST RESULTS ===\n');
    let cleanCount = 0;
    let errorCount = 0;
    
    for (const [tab, result] of Object.entries(results)) {
      if ((result.errors && result.errors.length > 0) || result.clickError) {
        console.log(`${tab}: ERRORS`);
        if (result.clickError) {
          console.log(`  Click: ${result.clickError}`);
        }
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(e => console.log(`  ${e}`));
        }
        errorCount++;
      } else {
        console.log(`${tab}: OK`);
        cleanCount++;
      }
    }

    console.log(`\n${cleanCount}/6 tabs clean`);
    if (errorCount === 0) {
      console.log('Status: CLEAN (0 errors all tabs)');
    } else {
      console.log(`Status: ${errorCount} tab(s) with errors`);
    }

  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    await browser.close();
  }
}

run();
