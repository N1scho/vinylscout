import { test, expect } from '@playwright/test';

test('Diagnose React Maximum Update Depth Exceeded Error', async ({ page }) => {
  // Collect all console messages
  const consoleMessages = {
    errors: [],
    warnings: [],
    logs: [],
  };

  // Listen to all console events
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleMessages.errors.push(text);
    } else if (type === 'warning') {
      consoleMessages.warnings.push(text);
    } else if (type === 'log') {
      consoleMessages.logs.push(text);
    }
  });

  // Also capture uncaught exceptions
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  // Navigate to the app
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  console.log('Page loaded. Waiting 3 seconds to capture any initial errors...');
  await page.waitForTimeout(3000);

  // Get initial DOM state
  const views = await page.locator('[role="tab"], [data-testid*="tab"], button:has-text("Album"), button:has-text("Wishlist"), button:has-text("Discover"), button:has-text("Home")').all();
  console.log(`Found ${views.length} potential navigation buttons/tabs`);

  // Try to find and interact with navigation elements
  let navigationAttempts = [];

  // Look for buttons or tabs that might be navigation
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} total buttons on page`);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const ariaLabel = await btn.getAttribute('aria-label');
    const dataTestId = await btn.getAttribute('data-testid');

    if (text || ariaLabel || dataTestId) {
      console.log(`Button ${i}: text="${text}" aria-label="${ariaLabel}" data-testid="${dataTestId}"`);

      // Click common navigation buttons
      if (text && (text.includes('Album') || text.includes('Wishlist') || text.includes('Discover') || text.includes('Home'))) {
        console.log(`  Attempting to click: ${text}`);
        try {
          await btn.click();
          await page.waitForTimeout(500);
          navigationAttempts.push({
            button: text,
            success: true,
            errorsAfter: consoleMessages.errors.length,
          });
        } catch (e) {
          navigationAttempts.push({
            button: text,
            success: false,
            error: e.message,
          });
        }
      }
    }
  }

  // Try to find and toggle the wishlist filter
  console.log('\nLooking for wishlist toggle or filter...');
  const wishlistToggle = page.locator('button:has-text("Wishlist"), input[type="checkbox"][aria-label*="wishlist"], input[type="checkbox"][aria-label*="Wishlist"]').first();

  if (await wishlistToggle.isVisible()) {
    console.log('Found wishlist toggle, attempting to click...');
    const errorCountBefore = consoleMessages.errors.length;
    try {
      await wishlistToggle.click();
      await page.waitForTimeout(500);
      const errorCountAfter = consoleMessages.errors.length;
      console.log(`Wishlist toggle clicked. Errors before: ${errorCountBefore}, after: ${errorCountAfter}`);
    } catch (e) {
      console.log(`Error clicking wishlist toggle: ${e.message}`);
    }
  } else {
    console.log('Wishlist toggle not found or not visible');
  }

  // Wait a bit more to capture any delayed errors
  console.log('Waiting 2 more seconds for any delayed errors...');
  await page.waitForTimeout(2000);

  // Report findings
  console.log('\n=== FINAL CONSOLE STATE ===');
  console.log(`Total Errors: ${consoleMessages.errors.length}`);
  console.log(`Total Warnings: ${consoleMessages.warnings.length}`);
  console.log(`Total Logs: ${consoleMessages.logs.length}`);
  console.log(`Page Errors (uncaught exceptions): ${pageErrors.length}`);

  // Check for the specific error
  const maxUpdateDepthErrors = consoleMessages.errors.filter(
    (err) => err.includes('Maximum update depth exceeded')
  );
  console.log(`\nMaximum Update Depth Exceeded errors: ${maxUpdateDepthErrors.length}`);
  if (maxUpdateDepthErrors.length > 0) {
    maxUpdateDepthErrors.forEach((err, idx) => {
      console.log(`  Error ${idx + 1}: ${err}`);
    });
  }

  // Show all unique errors
  const uniqueErrors = [...new Set(consoleMessages.errors)];
  console.log(`\nUnique Console Errors (${uniqueErrors.length}):`);
  uniqueErrors.forEach((err, idx) => {
    const count = consoleMessages.errors.filter((e) => e === err).length;
    console.log(`  [${count}x] ${err.substring(0, 150)}${err.length > 150 ? '...' : ''}`);
  });

  // Show all unique warnings
  const uniqueWarnings = [...new Set(consoleMessages.warnings)];
  console.log(`\nUnique Console Warnings (${uniqueWarnings.length}):`);
  uniqueWarnings.slice(0, 10).forEach((warn, idx) => {
    const count = consoleMessages.warnings.filter((w) => w === warn).length;
    console.log(`  [${count}x] ${warn.substring(0, 150)}${warn.length > 150 ? '...' : ''}`);
  });

  // Show page errors
  console.log(`\nPage Errors (uncaught exceptions):`);
  pageErrors.forEach((err, idx) => {
    console.log(`  ${idx + 1}: ${err}`);
  });

  console.log('\n=== NAVIGATION ATTEMPTS ===');
  navigationAttempts.forEach((attempt) => {
    console.log(`  ${attempt.button}: ${attempt.success ? 'SUCCESS' : 'FAILED'}`);
  });

  // Test assertions
  expect(maxUpdateDepthErrors.length).toBe(0);
  expect(pageErrors.length).toBe(0);
});
