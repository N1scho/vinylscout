import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175';

async function debugApp() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[ERROR] ${err}`));

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Click Discover
    console.log('Clicking Discover...');
    await page.click('button:has-text("Discover")');
    await page.waitForTimeout(3000);

    // Get HTML content around Select All
    const html = await page.locator('body').innerHTML();

    if (html.includes('Select All')) {
      console.log('✓ "Select All" found in HTML');
      // Find the section containing Select All
      const index = html.indexOf('Select All');
      console.log('HTML around Select All:');
      console.log(html.substring(Math.max(0, index - 200), Math.min(html.length, index + 200)));
    } else {
      console.log('✗ "Select All" NOT found in HTML');
    }

    // Check for GenreSelector div
    if (html.includes('GenreSelector') || html.includes('genre')) {
      console.log('✓ Genre-related content found');
    } else {
      console.log('✗ No genre-related content found');
    }

    // Save full HTML for inspection
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/nikol/vinylscout/scratchpad/page-debug.html', html);
    console.log('\nFull HTML saved to: scratchpad/page-debug.html');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugApp();
