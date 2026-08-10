import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175';

async function testThemeSwitching() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click Discover button
    console.log('Navigating to Discover view...');
    await page.click('button:has-text("Discover")');
    await page.waitForTimeout(1500);

    // Get the initial container styles
    const getContainerStyles = async () => {
      const selectAllBtn = page.locator('button:has-text("Select All")');
      return await selectAllBtn.evaluate(el => {
        let parent = el.parentElement;
        while (parent && !parent.style.padding) {
          parent = parent.parentElement;
        }
        if (!parent) {
          parent = el.closest('div[style*="padding"]');
        }
        if (parent) {
          const style = window.getComputedStyle(parent);
          return {
            designTheme: localStorage.getItem('vinyl-settings-storage')?.match(/"designTheme":"([^"]+)"/) ? localStorage.getItem('vinyl-settings-storage').match(/"designTheme":"([^"]+)"/)[1] : 'unknown',
            backdropFilter: style.backdropFilter,
            borderRadius: style.borderRadius,
            background: style.background.substring(0, 50)
          };
        }
        return null;
      });
    };

    console.log('\n=== Initial State (Subtle theme) ===');
    let styles = await getContainerStyles();
    console.log(JSON.stringify(styles, null, 2));

    // Navigate to Settings
    console.log('\nNavigating to Settings...');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1500);

    // Look for design theme options and click Bold
    console.log('Switching to Bold theme...');
    const boldOption = page.locator('button, label', { hasText: /bold/i }).first();
    const boldCount = await boldOption.count();

    if (boldCount > 0) {
      await boldOption.click();
      await page.waitForTimeout(1000);

      // Navigate back to Discover
      console.log('Navigating back to Discover...');
      await page.click('button:has-text("Discover")');
      await page.waitForTimeout(1500);

      console.log('\n=== After Switching to Bold ===');
      styles = await getContainerStyles();
      console.log(JSON.stringify(styles, null, 2));
    } else {
      console.log('Bold theme option not found in Settings');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testThemeSwitching();
