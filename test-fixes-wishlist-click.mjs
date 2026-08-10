import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

// Capture console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`⚠ Console error: ${msg.text()}`);
  }
});

try {
  // Set viewport for mobile testing
  await page.setViewportSize({ width: 375, height: 667 });

  // Navigate to app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log('✓ App loaded');
  await page.waitForTimeout(2000);

  // Screenshot initial (Search) view
  await page.screenshot({ path: 'test-results/1-initial.png' });
  console.log('✓ Initial screenshot');

  // Click Discover tab by finding and clicking the button
  const discoverButton = await page.locator('button:has-text("Discover")').or(page.locator('a:has-text("Discover")')).first();
  const exists = await discoverButton.isVisible();
  console.log(`✓ Discover button visible: ${exists}`);

  if (exists) {
    await discoverButton.click();
    await page.waitForTimeout(1500);
    console.log('✓ Clicked Discover button');

    await page.screenshot({ path: 'test-results/2-discover-clicked.png' });

    // Check if Discover loaded with any content
    const genreSelector = await page.locator('text=/genre|select/i').count();
    const albumGallery = await page.locator('[role="button"]:has-text("Add to Wishlist"), text=/artist|album/i').count();
    console.log(`✓ Genre selector refs: ${genreSelector}, Album elements: ${albumGallery}`);
  }

  // Now navigate to Wishlist
  const wishlistButton = await page.locator('button:has-text("Wishlist")').or(page.locator('a:has-text("Wishlist")')).first();
  const wishlistExists = await wishlistButton.isVisible();
  console.log(`✓ Wishlist button visible: ${wishlistExists}`);

  if (wishlistExists) {
    await wishlistButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Clicked Wishlist button');

    await page.screenshot({ path: 'test-results/3-wishlist-clicked.png' });

    // Check wishlist state
    const emptyMessage = await page.locator('text=/empty|no items/i').count();
    const items = await page.locator('[role="button"]:has-text("Add to Collection")').count();
    console.log(`✓ Empty state: ${emptyMessage}, Items with "Add to Collection": ${items}`);
  }

  // Hard reload while on Wishlist
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Hard reload while on Wishlist');

  await page.screenshot({ path: 'test-results/4-wishlist-after-reload.png' });

  // Navigate back to Discover
  const discoverButton2 = await page.locator('button:has-text("Discover")').or(page.locator('a:has-text("Discover")')).first();
  if (await discoverButton2.isVisible()) {
    await discoverButton2.click();
    await page.waitForTimeout(1500);
    console.log('✓ Navigated back to Discover');

    await page.screenshot({ path: 'test-results/5-discover-after-reload.png' });
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('\n✓✓✓ No console errors detected');
  }

} catch (error) {
  console.error('❌ Test error:', error.message);
  await page.screenshot({ path: 'test-results/error.png' });
} finally {
  await browser.close();
}
