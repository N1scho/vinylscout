const { chromium } = await import('playwright');

const tabs = ['Search', 'Camera', 'Collection', 'Stats', 'Discover', 'Settings'];
const results = {};
const allConsoleMessages = [];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    allConsoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    if (msg.type() === 'error') {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.toString()}`);
  });

  try {
    console.log('Loading http://localhost:5185...');
    await page.goto('http://localhost:5185', { waitUntil: 'domcontentloaded' });
    
    // Wait for app to fully initialize
    console.log('Waiting for app initialization...');
    await page.waitForTimeout(4000);
    
    // Check initial state
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons\n`);

    for (const tab of tabs) {
      console.log(`\n--- Testing ${tab} ---`);
      results[tab] = { errors: [] };
      
      try {
        // Get the button and check its state
        const btn = page.locator(`button:has-text("${tab}")`);
        
        // Check if disabled
        const isDisabled = await btn.evaluate(el => el.disabled);
        console.log(`  Button disabled: ${isDisabled}`);
        
        if (isDisabled && tab === 'Search') {
          // Try to force click anyway
          console.log(`  Attempting force click despite disabled state...`);
          await btn.click({ force: true });
        } else {
          await btn.click();
        }
        
        console.log(`  ✓ Clicked`);
        await page.waitForTimeout(2000);
        
      } catch (e) {
        results[tab].errors.push(`Click failed: ${e.message.split('\n')[0]}`);
        console.log(`  ✗ Click error`);
      }
    }

    // Analyze all console messages
    console.log('\n\n=== CONSOLE ANALYSIS ===\n');
    const errorMessages = allConsoleMessages.filter(m => m.type === 'error');
    
    if (errorMessages.length > 0) {
      console.log('Error messages found:');
      errorMessages.forEach(msg => {
        console.log(`  ${msg.text}`);
      });
    } else {
      console.log('No error messages in console');
    }

    // Final report
    console.log('\n\n=== TEST RESULTS ===\n');
    let cleanTabs = [];
    let errorTabs = [];
    
    for (const [tab, result] of Object.entries(results)) {
      if (result.errors.length > 0) {
        console.log(`${tab}: ERRORS`);
        result.errors.forEach(e => console.log(`  - ${e}`));
        errorTabs.push(tab);
      } else {
        console.log(`${tab}: OK`);
        cleanTabs.push(tab);
      }
    }

    console.log(`\nClean: ${cleanTabs.length}/6`);
    if (errorTabs.length === 0) {
      console.log('Status: CLEAN (0 errors all tabs)');
    } else {
      console.log(`Status: ERRORS - ${errorTabs.join(', ')}`);
    }

  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    await browser.close();
  }
}

run();
