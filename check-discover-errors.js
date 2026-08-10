import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const allMessages = [];

  page.on('console', (msg) => {
    allMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  try {
    await page.goto('http://localhost:5185', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const discoverLink = await page.$('text=Discover');
    if (discoverLink) {
      await discoverLink.click();
      await page.waitForTimeout(2000);
    }
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  allMessages.forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    if (msg.location) {
      console.log(`   at ${msg.location.url}:${msg.location.lineNumber}`);
    }
  });

  // Filter
  const errors = allMessages.filter(m => m.type === 'error');
  const warnings = allMessages.filter(m => m.type === 'warning');
  
  console.log(`\nTotal errors: ${errors.length}`);
  console.log(`Total warnings: ${warnings.length}`);
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\nStatus: CLEAN');
  } else {
    console.log('\nStatus: BROKEN');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
