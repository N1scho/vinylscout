const { chromium } = await import('playwright');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all network requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText
    });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  try {
    console.log('Loading app...');
    await page.goto('http://localhost:5185', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Examine Search buttons
    console.log('\n=== SEARCH BUTTONS ===');
    const searchButtons = await page.locator('button:has-text("Search")').all();
    console.log(`Found ${searchButtons.length} buttons with "Search" text\n`);
    
    for (let i = 0; i < searchButtons.length; i++) {
      const text = await searchButtons[i].textContent();
      const classList = await searchButtons[i].evaluate(el => el.className);
      const disabled = await searchButtons[i].evaluate(el => el.disabled);
      console.log(`Button ${i}: "${text}" | class="${classList}" | disabled=${disabled}`);
    }

    // Try clicking the first nav button that says Search
    console.log('\n=== ATTEMPTING SEARCH CLICK ===');
    try {
      // Use force: true to bypass disabled state check
      await searchButtons[0].click({ force: true, timeout: 5000 });
      console.log('Clicked Search button with force:true');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`Force click failed: ${e.message.split('\n')[0]}`);
    }

    // Check Discover 404
    console.log('\n=== NAVIGATE TO DISCOVER ===');
    const discoverBtn = await page.locator('button:has-text("Discover")').first();
    await discoverBtn.click();
    await page.waitForTimeout(2000);

    console.log('\n=== FAILED REQUESTS ===');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => {
        console.log(`${req.url}`);
        console.log(`  Error: ${req.failure}`);
      });
    } else {
      console.log('No failed requests');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
