import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

const logs = [];
page.on('console', msg => {
  if (msg.type() === 'error' && !msg.text().includes('404')) {
    logs.push(`ERROR: ${msg.text()}`);
  }
});

try {
  await page.setViewportSize({ width: 375, height: 667 });
  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  console.log('✓ Page loaded');

  // Wait and observe for flicker
  console.log('Waiting 3 seconds to observe for flicker...');
  await page.waitForTimeout(3000);

  const content = await page.textContent('body');
  if (content.includes('VINYLSCOUT')) {
    console.log('✓ App content stable');
  } else {
    console.log('⚠ No app content found');
  }

  // Try Discover
  console.log('Clicking Discover...');
  await page.click('button:has-text("Discover")');
  await page.waitForTimeout(2000);

  const discoverContent = await page.textContent('body');
  if (discoverContent.includes('Select All') || discoverContent.includes('genre')) {
    console.log('✓ Discover loaded');
  } else {
    console.log('⚠ Discover not showing expected content');
  }

  // Screenshot
  await page.screenshot({ path: 'test-results/flicker-check.png' });

  if (logs.length > 0) {
    console.log('\n⚠ Errors detected:');
    logs.forEach(log => console.log(`  ${log}`));
  } else {
    console.log('\n✓ No console errors');
  }

} finally {
  await browser.close();
}
