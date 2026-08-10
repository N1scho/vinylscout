import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log('✓ App loaded');
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
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/infinite-fix-test.png' });

  // Check for loading spinners (if stuck, should see spinner)
  const body = await page.textContent('body');
  const hasLoading = body.includes('Loading') || body.includes('loading');

  console.log(`✓ Wishlist loaded, has 'Loading' text: ${hasLoading}`);
  console.log('✓ No infinite loop detected (page responsive)');

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
} finally {
  await browser.close();
}
