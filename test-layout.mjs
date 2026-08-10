import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Go to Discover
  await page.click('button:has-text("Discover")');
  await page.waitForTimeout(1000);

  // Select genres
  await page.click('button:has-text("Select All")');
  await page.waitForTimeout(1000);

  // Add to wishlist
  await page.click('button:has-text("♡")');
  await page.waitForTimeout(500);

  // Go to Wishlist
  await page.click('button:has-text("Wishlist")');
  await page.waitForTimeout(1500);

  // Take screenshot
  await page.screenshot({ path: 'test-results/layout-refresh-top-left.png' });
  console.log('✓ Screenshot saved: refresh button top-left, price moved up');

} finally {
  await browser.close();
}
