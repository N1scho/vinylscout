const { chromium } = await import('playwright');

const tabs = ['Search', 'Camera', 'Collection', 'Stats', 'Discover', 'Settings'];
const results = {};
let consoleErrors = [];
let pageErrors = [];

async function run() {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    pageErrors.push(error.toString());
  });

  try {
    await page.goto('http://localhost:5185', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    for (const tab of tabs) {
      console.log(`Testing ${tab}...`);
      results[tab] = { errors: [] };
      
      // Find and click the tab button
      const buttons = await page.locator('button').all();
      let found = false;
      
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.includes(tab)) {
          await btn.click();
          found = true;
          console.log(`  Clicked ${tab}`);
          break;
        }
      }

      if (!found) {
        results[tab].errors.push(`Could not find tab button`);
      }

      await page.waitForTimeout(1000);
      
      // Check for new errors
      if (consoleErrors.length > 0) {
        results[tab].errors = [...consoleErrors];
        consoleErrors = [];
      }
    }

    // Final report
    console.log('\n=== RESULTS ===\n');
    let hasErrors = false;
    
    for (const [tab, result] of Object.entries(results)) {
      if (result.errors.length > 0) {
        console.log(`${tab}: ERRORS`);
        result.errors.forEach(e => console.log(`  - ${e}`));
        hasErrors = true;
      } else {
        console.log(`${tab}: OK`);
      }
    }

    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(e => console.log(`  - ${e}`));
      hasErrors = true;
    }

    console.log(`\n${hasErrors ? 'ERRORS FOUND' : 'CLEAN (0 errors)'}`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

run();
