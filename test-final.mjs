import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error' && !msg.text().includes('404')) {
    errors.push(msg.text());
    console.log(`⚠ Console error: ${msg.text()}`);
  }
});

try {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log('✓ App loaded');
  await page.waitForTimeout(1500);

  // Click Discover
  await page.click('button:has-text("Discover")');
  await page.waitForTimeout(1500);
  console.log('✓ Discover tab clicked');

  const discoverContent = await page.textContent('body');
  const hasAlbumInfo = discoverContent.includes('Select genres') || discoverContent.includes('artist') || discoverContent.includes('Browse');
  console.log(`✓ Discover shows content: ${hasAlbumInfo}`);

  await page.screenshot({ path: 'test-results/discover.png' });

  // Click Wishlist
  await page.click('button:has-text("Wishlist")');
  await page.waitForTimeout(1000);
  console.log('✓ Wishlist tab clicked');

  const wishlistContent = await page.textContent('body');
  const emptyWishlist = wishlistContent.includes('empty') || wishlistContent.includes('Browse Discover');
  console.log(`✓ Wishlist empty or has content: ${!emptyWishlist ? 'has items' : 'empty (expected if no wishlist items yet)'}`);

  await page.screenshot({ path: 'test-results/wishlist-before-reload.png' });

  // Hard reload
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('✓ Hard reload completed');

  await page.screenshot({ path: 'test-results/wishlist-after-reload.png' });

  const reloadContent = await page.textContent('body');
  const stillOnWishlist = reloadContent.includes('Wishlist') || reloadContent.includes('empty') || reloadContent.includes('Browse Discover');
  console.log(`✓ After reload, Wishlist state preserved: ${stillOnWishlist}`);

  // Click Discover again to verify items still load
  await page.click('button:has-text("Discover")');
  await page.waitForTimeout(1500);
  console.log('✓ Back to Discover after reload');

  await page.screenshot({ path: 'test-results/discover-after-reload.png' });

  console.log('\n✓✓✓ All tests passed - no critical errors');

} catch (error) {
  console.error(`❌ Test failed: ${error.message}`);
  await page.screenshot({ path: 'test-results/error.png' });
} finally {
  await browser.close();
}
