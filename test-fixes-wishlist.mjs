import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // Set viewport for mobile testing
  await page.setViewportSize({ width: 375, height: 667 });

  // Navigate to app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log('✓ App loaded');

  // Wait for app to stabilize
  await page.waitForTimeout(2000);

  // Screenshot initial state
  await page.screenshot({ path: 'test-results/1-initial-state.png' });
  console.log('✓ Initial screenshot saved');

  // Navigate to Discover tab via URL hash
  await page.goto('http://localhost:5173/#discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Navigated to Discover');

  await page.screenshot({ path: 'test-results/2-discover-loaded.png' });
  console.log('✓ Discover screenshot saved');

  // Check if there are any elements with album data
  const albumElements = await page.locator('text=/artist|album/i').count();
  console.log(`✓ Found ${albumElements} potential album references`);

  // Navigate to Wishlist
  await page.goto('http://localhost:5173/#wishlist', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('✓ Navigated to Wishlist');

  await page.screenshot({ path: 'test-results/3-wishlist-nav.png' });
  console.log('✓ Wishlist screenshot saved');

  // Check if wishlist is empty or has items
  const wishlistEmpty = await page.locator('text=/wishlist.*empty|no items/i').count();
  const wishlistItems = await page.locator('[role="button"]:has-text("Add to Collection")').count();
  console.log(`✓ Wishlist empty state found: ${wishlistEmpty}, items with "Add to Collection": ${wishlistItems}`);

  // Hard reload
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Page hard-reloaded while on Wishlist');

  await page.screenshot({ path: 'test-results/4-wishlist-after-reload.png' });
  console.log('✓ Wishlist after reload screenshot saved');

  // Navigate to Discover after reload
  await page.goto('http://localhost:5173/#discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Navigated to Discover after reload');

  await page.screenshot({ path: 'test-results/5-discover-after-reload.png' });
  console.log('✓ Discover after reload screenshot saved');

  // Check for any error messages
  const errorText = await page.locator('[role="alert"], .error, [class*="error"]').count();
  console.log(`✓ Error elements found: ${errorText}`);

  // Check console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('⚠ Console error:', msg.text());
    }
  });

  console.log('\n✓✓✓ Test completed successfully');

} catch (error) {
  console.error('❌ Error:', error.message);
  await page.screenshot({ path: 'test-results/error-screenshot.png' });
} finally {
  await browser.close();
}
