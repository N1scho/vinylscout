import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testDiscoverView() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Discover button
    console.log('Clicking Discover button...');
    const discoverBtn = await page.locator('button:has-text("Discover")');
    await discoverBtn.click();
    await page.waitForTimeout(2000);

    // Check if GenreSelector is now present
    const selectAllBtn = page.locator('button:has-text("Select All")');
    const count = await selectAllBtn.count();
    console.log(`Found ${count} "Select All" button(s)`);

    if (count > 0) {
      console.log('\n=== GenreSelector Found ===');

      // Get the container that holds the Select All button
      const container = selectAllBtn.locator('xpath=ancestor::div[contains(@style, "padding")]').first();

      // Get computed styles
      const styles = await container.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          padding: style.padding,
          background: style.background,
          backdropFilter: style.backdropFilter,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow.substring(0, 60) + '...',
          border: style.border
        };
      }).catch(() => null);

      if (styles) {
        console.log('Container computed styles:');
        console.log(JSON.stringify(styles, null, 2));

        // Check if glass effect is applied
        const hasGlass = styles.backdropFilter !== 'none' && styles.backdropFilter !== '';
        const hasRoundCorners = styles.borderRadius !== '0px';
        console.log(`\nGlass effect applied: ${hasGlass}`);
        console.log(`Rounded corners applied: ${hasRoundCorners}`);
      }

      // Take screenshot
      await page.screenshot({ path: 'C:/Users/nikol/vinylscout/scratchpad/discover-view.png' });
      console.log('\nScreenshot saved: C:/Users/nikol/vinylscout/scratchpad/discover-view.png');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testDiscoverView();
