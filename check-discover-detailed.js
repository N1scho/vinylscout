import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleLogs = [];
  const jsErrors = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    });
    if (msg.type() === 'error') {
      jsErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    jsErrors.push(`Uncaught Error: ${err.message}`);
  });

  page.on('response', (response) => {
    if (!response.ok() && response.status() >= 400) {
      networkErrors.push({
        status: response.status(),
        url: response.url(),
      });
    }
  });

  try {
    await page.goto('http://localhost:5185', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    // Click Discover
    const discoverLink = await page.$('text=Discover');
    if (discoverLink) {
      await discoverLink.click();
      await page.waitForTimeout(2000);
    }

    // Check if page rendered
    const hasAlbumGallery = await page.$('[style*="flex"][style*="column"]');
    const pageTitle = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));

  } catch (err) {
    jsErrors.push(`Navigation error: ${err.message}`);
  }

  // Analysis
  const jsx = jsErrors.filter(e => e.includes('React') || e.includes('Hook') || e.includes('minified'));
  const apiErrors = networkErrors.filter(e => e.url.includes('/api/'));
  const otherNetworkErrors = networkErrors.filter(e => !e.url.includes('/api/'));

  console.log('\n=== CONSOLE STATE ===');
  console.log(`JS Errors: ${jsErrors.length}`);
  console.log(`  - React/Hook errors: ${jsx.length}`);
  console.log(`  - Other JS errors: ${jsErrors.length - jsx.length}`);
  console.log(`Network 4xx/5xx: ${networkErrors.length}`);
  console.log(`  - API endpoint errors: ${apiErrors.length}`);
  console.log(`  - Other network errors: ${otherNetworkErrors.length}`);

  if (jsx.length > 0) {
    console.log('\n=== REACT/HOOK ERRORS ===');
    jsx.forEach(e => console.log(`  ${e}`));
  }

  if (apiErrors.length > 0) {
    console.log('\n=== API ENDPOINT ERRORS (Expected in dev) ===');
    apiErrors.forEach(e => console.log(`  ${e.status} ${e.url}`));
  }

  if (otherNetworkErrors.length > 0) {
    console.log('\n=== OTHER NETWORK ERRORS ===');
    otherNetworkErrors.forEach(e => console.log(`  ${e.status} ${e.url}`));
  }

  // Final verdict
  const hasReactErrors = jsx.length > 0;
  const hasRealErrors = jsErrors.length > 0 || otherNetworkErrors.length > 0;
  const onlyApiErrors = apiErrors.length > 0 && !hasRealErrors;

  console.log('\n=== VERDICT ===');
  if (hasReactErrors) {
    console.log('BROKEN: React/Hook errors detected');
  } else if (otherNetworkErrors.length > 0) {
    console.log('BROKEN: Network errors (non-API) detected');
  } else if (jsErrors.length > 0) {
    console.log('BROKEN: JS errors detected');
  } else if (onlyApiErrors) {
    console.log('CLEAN: Only expected API endpoint errors (dev environment)');
  } else {
    console.log('CLEAN: No errors');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
