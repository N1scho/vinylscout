import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175';

async function testGlassStyles() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click Discover button
    console.log('Clicking Discover button...');
    await page.click('button:has-text("Discover")');
    await page.waitForTimeout(1500);

    // Find the GenreSelector container (parent of Select All button)
    const selectAllBtn = page.locator('button:has-text("Select All")');
    const count = await selectAllBtn.count();

    if (count === 0) {
      console.log('Select All button not found');
      return;
    }

    console.log('✓ Found Select All button');

    // Get the container div that has the padding and background styling
    const container = await selectAllBtn.evaluate(el => {
      // Find the parent with padding
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
          padding: style.padding,
          background: style.background || style.backgroundColor,
          backdropFilter: style.backdropFilter,
          borderRadius: style.borderRadius,
          border: style.border,
          boxShadow: style.boxShadow.substring(0, 80)
        };
      }
      return null;
    });

    if (!container) {
      console.log('Could not find GenreSelector container');
      return;
    }

    console.log('\n=== GenreSelector Container Styles ===');
    console.log(JSON.stringify(container, null, 2));

    // Check if glass effect is applied
    const hasBackdropFilter = container.backdropFilter && container.backdropFilter !== 'none';
    const hasRoundedCorners = container.borderRadius && container.borderRadius !== '0px';
    const hasGlow = container.boxShadow && container.boxShadow.includes('rgba');

    console.log('\n=== Glass Effect Detection ===');
    console.log(`Backdrop Filter (blur): ${hasBackdropFilter ? '✓ Applied' : '✗ Not Applied'}`);
    console.log(`Rounded Corners: ${hasRoundedCorners ? '✓ Applied' : '✗ Not Applied'}`);
    console.log(`Box Shadow (glow): ${hasGlow ? '✓ Applied' : '✗ Not Applied'}`);

    if (hasBackdropFilter && hasRoundedCorners && hasGlow) {
      console.log('\n✓ Glass effect is FULLY APPLIED');
    } else {
      console.log('\n⚠ Glass effect is PARTIALLY APPLIED or NOT APPLIED');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testGlassStyles();
