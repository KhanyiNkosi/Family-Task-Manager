// tests/playwright-check.spec.js
const { test, expect } = require('@playwright/test');

test('basic playwright setup check', async ({ page }) => {
  // Test that we can navigate
  await page.goto('https://example.com');
  await expect(page).toHaveTitle('Example Domain');
  
  console.log('✅ Playwright is working!');
});
