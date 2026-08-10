import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Navigate to the app
  await page.goto('http://localhost:5185');
  await page.waitForLoadState('networkidle');

  // Wait a bit for initial render
  await page.waitForTimeout(500);

  // Click on Discover tab
  try {
    // Look for a Discover button/tab - it might be in different formats
    const discoverTab = await page.locator('a, button').filter({ hasText: /^Discover$/i }).first();
    if (await discoverTab.isVisible()) {
      await discoverTab.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('Discover tab not found as a/button, trying other selectors...');
      // Try other common patterns
      const tabs = await page.locator('[data-testid*="discover"], [role="tab"], [class*="tab"]').all();
      let found = false;
      for (const tab of tabs) {
        const text = await tab.textContent();
        if (text && text.toLowerCase().includes('discover')) {
          await tab.click();
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('Discover tab still not found');
      }
    }
  } catch (e) {
    console.log('Error clicking Discover tab:', e.message);
  }

  // Wait for any errors to appear
  await page.waitForTimeout(1000);

  // Check for error #310 in console messages
  let hasError310 = false;
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
    if (msg.text.includes('310') || msg.text.includes('Error #310')) {
      hasError310 = true;
    }
  });

  // Also check the page content for error messages
  const pageText = await page.content();
  if (pageText.includes('310')) {
    console.log('\nError #310 found in page content');
    hasError310 = true;
  }

  // Take a screenshot
  await page.screenshot({ path: 'discover-tab-screenshot.png' });
  console.log('\nScreenshot saved to discover-tab-screenshot.png');

  // Report the result
  if (hasError310 || consoleMessages.some(m => m.type === 'error')) {
    console.log('\n=== RESULT: BROKEN ===');
    console.log('Error #310 or console errors detected');
  } else {
    console.log('\n=== RESULT: FIXED ===');
    console.log('No error #310 found, console is clean');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
