import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testGlassEffect() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Looking for GenreSelector container...');

    // Try to find GenreSelector by looking for the "Select All" button
    const selectAllButton = page.locator('button:has-text("Select All")');
    const count = await selectAllButton.count();

    if (count === 0) {
      console.log('GenreSelector not found on page');
      // Try navigating to discover
      const navLinks = await page.locator('a, button').all();
      for (const link of navLinks) {
        const text = await link.textContent();
        if (text && text.toLowerCase().includes('discover')) {
          console.log('Found Discover link, clicking...');
          await link.click();
          await page.waitForTimeout(1500);
          break;
        }
      }
    }

    // Now get the GenreSelector container (parent of Select All button)
    const genreSelector = page.locator('button:has-text("Select All")').locator('xpath=ancestor::div[1]');

    console.log('\n=== Checking Initial Styles ===');
    const initialStyle = await genreSelector.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backdropFilter: style.backdropFilter,
        background: style.background,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow.substring(0, 50) // Truncate for readability
      };
    }).catch(() => null);

    if (initialStyle) {
      console.log('GenreSelector styles:', initialStyle);
    } else {
      console.log('Could not retrieve styles');
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testGlassEffect();
