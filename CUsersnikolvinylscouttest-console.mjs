import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  const allMessages = [];
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    allMessages.push({ type, text, location });
    
    if (type === 'error') {
      errors.push({ text, location });
    } else if (type === 'warn') {
      warnings.push({ text, location });
    }
  });
  
  // Capture uncaught exceptions
  page.on('pageerror', err => {
    errors.push({ text: `UNCAUGHT: ${err.message}`, stack: err.stack });
  });
  
  try {
    console.log('Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Page loaded');
    
    // Wait for React to fully initialize
    await page.waitForTimeout(2000);
    
    // Take initial screenshot to see what we're working with
    const bodyText = await page.innerText('body');
    
    // Look for navigation links or buttons
    const links = await page.locator('a, button').all();
    console.log(`\nTotal interactive elements found: ${links.length}`);
    
    // Get all text to find view names
    const viewNames = [];
    const textContent = await page.innerText('html');
    
    // Try to extract visible links/buttons text
    for (let link of links) {
      try {
        const text = await link.innerText();
        if (text && text.length < 50) {
          viewNames.push(text.trim());
        }
      } catch (e) {}
    }
    
    const uniqueViews = [...new Set(viewNames)].filter(v => v.length > 0 && v.length < 30);
    console.log(`\nNavigation items found:`);
    uniqueViews.slice(0, 10).forEach(v => console.log(`  - ${v}`));
    
    // Try clicking on navigation items to test functionality
    console.log('\nTesting navigation:');
    const testedViews = [];
    
    for (let i = 0; i < Math.min(5, links.length); i++) {
      try {
        const text = await links[i].innerText();
        if (text && text.length > 0 && text.length < 30) {
          const isVisible = await links[i].isVisible();
          if (isVisible) {
            await links[i].click({ timeout: 1000 });
            await page.waitForTimeout(500);
            testedViews.push(text.trim());
            console.log(`  ✓ Clicked: ${text.trim()}`);
          }
        }
      } catch (e) {
        // Silent continue
      }
    }
    
  } catch (err) {
    console.log(`Navigation error: ${err.message}`);
  }
  
  // Report findings
  console.log('\n\n=== CONSOLE ERROR SUMMARY ===');
  console.log(`Total React/JS Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nError details:');
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.text}`);
      if (err.location) {
        console.log(`   at ${err.location.url}:${err.location.lineNumber}`);
      }
    });
  } else {
    console.log('No React errors detected!');
  }
  
  console.log(`\nTotal Console Messages Captured: ${allMessages.length}`);
  
  if (allMessages.length > 0) {
    console.log('\nAll console output (last 15 messages):');
    allMessages.slice(-15).forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text.substring(0, 100)}`);
    });
  }
  
  // Check React DevTools
  const reactVersion = await page.evaluate(() => {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      return 'React detected';
    }
    return 'React not detected';
  });
  console.log(`\nReact Status: ${reactVersion}`);
  
  await browser.close();
  
  // Exit with error count as code
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(2);
});
