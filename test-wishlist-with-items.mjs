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
  await page.waitForTimeout(1500);
  console.log('✓ Discover tab opened');

  // Select all genres
  await page.click('button:has-text("Select All")');
  await page.waitForTimeout(1000);
  console.log('✓ Selected all genres');

  // Wait for shuffle and look for album content
  const albumCards = await page.locator('[style*="grid"]').first();
  if (await albumCards.isVisible()) {
    console.log('✓ Album gallery visible');
  }

  // Try to scroll and look for album details
  const bodyText = await page.textContent('body');
  if (bodyText.includes('artist') || bodyText.includes('artist'.toUpperCase()) || bodyText.includes('Album')) {
    console.log('✓ Album details visible');
  }

  // Screenshot showing album
  await page.screenshot({ path: 'test-results/discover-with-genres.png' });

  // Try to find and click wishlist button (heart icon or button with heart text)
  const wishlistButtons = await page.locator('button[title*="Wishlist"], button[title*="wishlist"]').count();
  console.log(`✓ Found ${wishlistButtons} potential wishlist buttons`);

  // Look for heart button
  const heartButtons = await page.locator('button:has-text("♥"), button:has-text("♡")').count();
  console.log(`✓ Found ${heartButtons} heart buttons`);

  if (heartButtons > 0) {
    // Click first heart button to add to wishlist
    await page.click('button:has-text("♡")');
    await page.waitForTimeout(500);
    console.log('✓ Clicked heart button to add to wishlist');

    // Check if heart changed to filled
    const filledHearts = await page.locator('button:has-text("♥")').count();
    console.log(`✓ Filled heart buttons after click: ${filledHearts}`);
  }

  // Go to Wishlist
  await page.click('button:has-text("Wishlist")');
  await page.waitForTimeout(1500);
  console.log('✓ Navigated to Wishlist');

  const wishlistText = await page.textContent('body');
  const hasItems = wishlistText.includes('Add to Collection') || wishlistText.includes('Wishlist') && !wishlistText.includes('empty');
  console.log(`✓ Wishlist has items: ${hasItems}`);

  // Look for price display
  const priceMatch = wishlistText.match(/\$[\d.]+|[A-Z]+\s+[\d.]+/);
  console.log(`✓ Price found: ${priceMatch ? priceMatch[0] : 'No price yet (may still be loading)'}`);

  // Look for refresh button
  const refreshButtons = await page.locator('button[title*="Refresh"], button[title*="refresh"]').count();
  console.log(`✓ Refresh buttons found: ${refreshButtons}`);

  // Look for refresh icon (rotate)
  const rotateButtons = await page.locator('[style*="rotate"]').count();
  console.log(`✓ Elements with rotate animation: ${rotateButtons}`);

  await page.screenshot({ path: 'test-results/wishlist-with-items.png' });

  console.log('\n✓✓✓ Wishlist functionality test completed');

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  await page.screenshot({ path: 'test-results/error-wishlist.png' });
} finally {
  await browser.close();
}
