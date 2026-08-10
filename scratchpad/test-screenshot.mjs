import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'C:/Users/nikol/vinylscout/scratchpad/app-screenshot.png', fullPage: true });
    console.log('Screenshot saved to: C:/Users/nikol/vinylscout/scratchpad/app-screenshot.png');

    // Get page content
    const content = await page.content();
    const hasSelectAll = content.includes('Select All');
    const hasGenres = content.includes('genres') || content.includes('Genre');

    console.log('Page contains "Select All":', hasSelectAll);
    console.log('Page contains "genres":', hasGenres);

    // List all buttons and links
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: ${text}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
