# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diagnose-react-error.spec.js >> Diagnose React Maximum Update Depth Exceeded Error
- Location: tests\diagnose-react-error.spec.js:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 2
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: ⚠️
    - heading "Something went wrong" [level=1] [ref=e6]
    - paragraph [ref=e7]:
      - text: We're sorry, but something unexpected happened.
      - generic [ref=e8]: "Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
    - generic [ref=e9]:
      - button "Try Again" [ref=e10] [cursor=pointer]
      - button "Reload App" [ref=e11] [cursor=pointer]
    - group [ref=e17]:
      - generic "Error Details (Development)" [ref=e18] [cursor=pointer]
  - paragraph [ref=e19]: If this problem persists, please contact support
```

# Test source

```ts
  48  |   for (let i = 0; i < Math.min(buttons.length, 10); i++) {
  49  |     const btn = buttons[i];
  50  |     const text = await btn.textContent();
  51  |     const ariaLabel = await btn.getAttribute('aria-label');
  52  |     const dataTestId = await btn.getAttribute('data-testid');
  53  | 
  54  |     if (text || ariaLabel || dataTestId) {
  55  |       console.log(`Button ${i}: text="${text}" aria-label="${ariaLabel}" data-testid="${dataTestId}"`);
  56  | 
  57  |       // Click common navigation buttons
  58  |       if (text && (text.includes('Album') || text.includes('Wishlist') || text.includes('Discover') || text.includes('Home'))) {
  59  |         console.log(`  Attempting to click: ${text}`);
  60  |         try {
  61  |           await btn.click();
  62  |           await page.waitForTimeout(500);
  63  |           navigationAttempts.push({
  64  |             button: text,
  65  |             success: true,
  66  |             errorsAfter: consoleMessages.errors.length,
  67  |           });
  68  |         } catch (e) {
  69  |           navigationAttempts.push({
  70  |             button: text,
  71  |             success: false,
  72  |             error: e.message,
  73  |           });
  74  |         }
  75  |       }
  76  |     }
  77  |   }
  78  | 
  79  |   // Try to find and toggle the wishlist filter
  80  |   console.log('\nLooking for wishlist toggle or filter...');
  81  |   const wishlistToggle = page.locator('button:has-text("Wishlist"), input[type="checkbox"][aria-label*="wishlist"], input[type="checkbox"][aria-label*="Wishlist"]').first();
  82  | 
  83  |   if (await wishlistToggle.isVisible()) {
  84  |     console.log('Found wishlist toggle, attempting to click...');
  85  |     const errorCountBefore = consoleMessages.errors.length;
  86  |     try {
  87  |       await wishlistToggle.click();
  88  |       await page.waitForTimeout(500);
  89  |       const errorCountAfter = consoleMessages.errors.length;
  90  |       console.log(`Wishlist toggle clicked. Errors before: ${errorCountBefore}, after: ${errorCountAfter}`);
  91  |     } catch (e) {
  92  |       console.log(`Error clicking wishlist toggle: ${e.message}`);
  93  |     }
  94  |   } else {
  95  |     console.log('Wishlist toggle not found or not visible');
  96  |   }
  97  | 
  98  |   // Wait a bit more to capture any delayed errors
  99  |   console.log('Waiting 2 more seconds for any delayed errors...');
  100 |   await page.waitForTimeout(2000);
  101 | 
  102 |   // Report findings
  103 |   console.log('\n=== FINAL CONSOLE STATE ===');
  104 |   console.log(`Total Errors: ${consoleMessages.errors.length}`);
  105 |   console.log(`Total Warnings: ${consoleMessages.warnings.length}`);
  106 |   console.log(`Total Logs: ${consoleMessages.logs.length}`);
  107 |   console.log(`Page Errors (uncaught exceptions): ${pageErrors.length}`);
  108 | 
  109 |   // Check for the specific error
  110 |   const maxUpdateDepthErrors = consoleMessages.errors.filter(
  111 |     (err) => err.includes('Maximum update depth exceeded')
  112 |   );
  113 |   console.log(`\nMaximum Update Depth Exceeded errors: ${maxUpdateDepthErrors.length}`);
  114 |   if (maxUpdateDepthErrors.length > 0) {
  115 |     maxUpdateDepthErrors.forEach((err, idx) => {
  116 |       console.log(`  Error ${idx + 1}: ${err}`);
  117 |     });
  118 |   }
  119 | 
  120 |   // Show all unique errors
  121 |   const uniqueErrors = [...new Set(consoleMessages.errors)];
  122 |   console.log(`\nUnique Console Errors (${uniqueErrors.length}):`);
  123 |   uniqueErrors.forEach((err, idx) => {
  124 |     const count = consoleMessages.errors.filter((e) => e === err).length;
  125 |     console.log(`  [${count}x] ${err.substring(0, 150)}${err.length > 150 ? '...' : ''}`);
  126 |   });
  127 | 
  128 |   // Show all unique warnings
  129 |   const uniqueWarnings = [...new Set(consoleMessages.warnings)];
  130 |   console.log(`\nUnique Console Warnings (${uniqueWarnings.length}):`);
  131 |   uniqueWarnings.slice(0, 10).forEach((warn, idx) => {
  132 |     const count = consoleMessages.warnings.filter((w) => w === warn).length;
  133 |     console.log(`  [${count}x] ${warn.substring(0, 150)}${warn.length > 150 ? '...' : ''}`);
  134 |   });
  135 | 
  136 |   // Show page errors
  137 |   console.log(`\nPage Errors (uncaught exceptions):`);
  138 |   pageErrors.forEach((err, idx) => {
  139 |     console.log(`  ${idx + 1}: ${err}`);
  140 |   });
  141 | 
  142 |   console.log('\n=== NAVIGATION ATTEMPTS ===');
  143 |   navigationAttempts.forEach((attempt) => {
  144 |     console.log(`  ${attempt.button}: ${attempt.success ? 'SUCCESS' : 'FAILED'}`);
  145 |   });
  146 | 
  147 |   // Test assertions
> 148 |   expect(maxUpdateDepthErrors.length).toBe(0);
      |                                       ^ Error: expect(received).toBe(expected) // Object.is equality
  149 |   expect(pageErrors.length).toBe(0);
  150 | });
  151 | 
```