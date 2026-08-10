import { test, expect } from '@playwright/test';

const allErrors = [];

test.describe('VinylScout - Console Error Capture', () => {
  const baseURL = 'http://localhost:5173';
  const views = [
    { name: 'Search', path: '/search' },
    { name: 'Camera', path: '/camera' },
    { name: 'Collection', path: '/collection' },
    { name: 'Discover', path: '/discover' },
    { name: 'Stats', path: '/stats' },
    { name: 'Settings', path: '/settings' },
  ];

  views.forEach((view) => {
    test(`Capture errors in ${view.name} view`, async ({ page, context }) => {
      const pageErrors = [];
      const pageWarnings = [];
      const pageConsoleMessages = [];

      // Capture console messages
      page.on('console', (msg) => {
        const entry = {
          type: msg.type(),
          message: msg.text(),
          location: msg.location(),
          args: msg.args().length,
          timestamp: new Date().toISOString(),
          view: view.name,
        };
        pageConsoleMessages.push(entry);

        if (msg.type() === 'error') {
          pageErrors.push(entry);
        } else if (msg.type() === 'warn') {
          pageWarnings.push(entry);
        }
      });

      // Capture page errors
      page.on('pageerror', (error) => {
        const entry = {
          type: 'page-error',
          message: error.toString(),
          stack: error.stack,
          timestamp: new Date().toISOString(),
          view: view.name,
        };
        pageErrors.push(entry);
      });

      // Navigate to the view
      const url = `${baseURL}${view.path}`;
      console.log(`\n=== Testing ${view.name} (${url}) ===`);

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
        if (response) {
          console.log(`Response status: ${response.status()}`);
        }
      } catch (e) {
        pageErrors.push({
          type: 'navigation-error',
          message: e.message,
          stack: e.stack,
          timestamp: new Date().toISOString(),
          view: view.name,
        });
      }

      // Wait for initial render
      await page.waitForTimeout(1000);

      // Perform view-specific interactions
      if (view.name === 'Collection') {
        console.log('Performing Collection interactions...');
        try {
          const wishlistButtons = await page.locator('button:has-text("Wishlist"), [aria-label*="Wishlist"], [data-testid*="wishlist"]').all();
          if (wishlistButtons.length > 0) {
            console.log(`Found ${wishlistButtons.length} wishlist button(s)`);
            await wishlistButtons[0].click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Wishlist interaction failed: ${e.message}`);
        }
      }

      if (view.name === 'Discover') {
        console.log('Performing Discover interactions...');

        try {
          const genreButtons = await page.locator('button[data-genre], button:has-text("Genre")').all();
          if (genreButtons.length > 0) {
            console.log(`Found ${genreButtons.length} genre button(s)`);
            await genreButtons[0].click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Genre click failed: ${e.message}`);
        }

        try {
          const clearButtons = await page.locator('button:has-text("Clear"), button[aria-label*="Clear"]').all();
          if (clearButtons.length > 0) {
            console.log(`Found ${clearButtons.length} clear button(s)`);
            await clearButtons[0].click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Clear interaction failed: ${e.message}`);
        }

        try {
          const tabs = await page.locator('[role="tab"], .tab-button, [data-testid*="tab"]').all();
          if (tabs.length > 1) {
            console.log(`Found ${tabs.length} tab(s), switching...`);
            await tabs[1].click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Tab switch failed: ${e.message}`);
        }
      }

      // Try to toggle theme
      console.log('Attempting theme toggle...');
      try {
        const themeButtons = await page.locator(
          'button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], button[data-testid*="theme"], [data-testid*="dark-mode"]'
        ).all();

        if (themeButtons.length > 0) {
          console.log(`Found ${themeButtons.length} theme button(s)`);
          await themeButtons[0].click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log(`Theme toggle failed: ${e.message}`);
      }

      allErrors.push({
        view: view.name,
        path: view.path,
        errorCount: pageErrors.length,
        warningCount: pageWarnings.length,
        consoleMessageCount: pageConsoleMessages.length,
        errors: pageErrors,
        warnings: pageWarnings,
        consoleMessages: pageConsoleMessages,
      });

      console.log(`Summary for ${view.name}:`);
      console.log(`  - Errors: ${pageErrors.length}`);
      console.log(`  - Warnings: ${pageWarnings.length}`);
      console.log(`  - Total console messages: ${pageConsoleMessages.length}`);

      if (pageErrors.length > 0) {
        console.log(`  First error: ${pageErrors[0].message.substring(0, 100)}`);
      }
    });
  });

  test('Generate error report', async () => {
    console.log('\n\n=== FINAL ERROR REPORT ===\n');

    const report = [];
    let errorId = 1;

    for (const viewData of allErrors) {
      if (viewData.errors.length === 0 && viewData.warnings.length === 0) {
        console.log(`${viewData.view}: No errors or warnings`);
        continue;
      }

      console.log(`\n${viewData.view} (${viewData.path}):`);
      console.log('-'.repeat(80));

      for (const error of viewData.errors) {
        const errorCode = `E${errorId++}`;
        const stackLines = (error.stack || '').split('\n');
        const stackTrace = stackLines[0] ? stackLines[0].substring(0, 60) : 'N/A';

        console.log(`[${errorCode}] ${error.type}: ${error.message.substring(0, 80)}`);
        if (error.location) {
          console.log(`     Location: ${error.location.url}:${error.location.lineNumber}:${error.location.columnNumber}`);
        }
        if (error.stack) {
          console.log(`     Stack: ${stackTrace}`);
        }

        report.push({
          code: errorCode,
          view: viewData.view,
          type: error.type,
          message: error.message.substring(0, 100),
          location: error.location ? `${error.location.url}:${error.location.lineNumber}` : 'N/A',
          stack: stackTrace,
          trigger: 'initial-load',
        });
      }

      for (const warning of viewData.warnings) {
        const errorCode = `W${errorId++}`;
        const stackLines = (warning.stack || '').split('\n');
        const stackTrace = stackLines[0] ? stackLines[0].substring(0, 60) : 'N/A';

        console.log(`[${errorCode}] warning: ${warning.message.substring(0, 80)}`);
        if (warning.location) {
          console.log(`     Location: ${warning.location.url}:${warning.location.lineNumber}:${warning.location.columnNumber}`);
        }

        report.push({
          code: errorCode,
          view: viewData.view,
          type: 'warning',
          message: warning.message.substring(0, 100),
          location: warning.location ? `${warning.location.url}:${warning.location.lineNumber}` : 'N/A',
          stack: stackTrace,
          trigger: 'initial-load',
        });
      }
    }

    console.log('\n\n=== ERROR TABLE ===\n');
    console.log('| Code | View | Type | Message | Location | Stack Trace | Trigger |');
    console.log('|------|------|------|---------|----------|-------------|---------|');

    for (const row of report) {
      const message = row.message.replace(/\|/g, '\\|').substring(0, 50);
      const location = row.location.substring(0, 40);
      const stack = row.stack.substring(0, 35);
      console.log(
        `| ${row.code} | ${row.view} | ${row.type} | ${message} | ${location} | ${stack} | ${row.trigger} |`
      );
    }

    console.log('\n\n=== SUMMARY STATISTICS ===\n');
    const totalErrors = allErrors.reduce((sum, v) => sum + v.errorCount, 0);
    const totalWarnings = allErrors.reduce((sum, v) => sum + v.warningCount, 0);
    const viewsWithErrors = allErrors.filter((v) => v.errorCount > 0).length;

    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    console.log(`Views with Errors: ${viewsWithErrors}/${allErrors.length}`);
    console.log(`\nErrors by View:`);
    for (const view of allErrors) {
      console.log(`  ${view.view}: ${view.errorCount} errors, ${view.warningCount} warnings`);
    }
  });
});
