const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Hard refresh
    await page.keyboard.press('Control+Shift+R');

    // Wait for page to reload and stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for the specific error
    const hasMaxUpdateError = consoleMessages.some(msg =>
      msg.text.includes('Maximum update depth exceeded')
    );

    console.log('===== CONSOLE OUTPUT =====');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });

    console.log('\n===== RESULT =====');
    if (hasMaxUpdateError) {
      console.log('STILL BROKEN - Found "Maximum update depth exceeded" error');
    } else {
      console.log('FIXED - No "Maximum update depth exceeded" errors found');
    }
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Error messages: ${errors.length}`);

  } catch (err) {
    console.error('Failed to check console:', err.message);
  }

  await browser.close();
})();
