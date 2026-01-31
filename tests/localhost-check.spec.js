// tests/localhost-check.spec.js - Test Playwright can access localhost
const { test, expect } = require('@playwright/test');

test('playwright can access localhost', async ({ page }) => {
  // Test accessing your local server
  await page.goto('http://localhost:3000/');
  
  // Check page loaded
  await expect(page).toHaveTitle(/Family Task Manager|Task App/i);
  
  // Take screenshot for proof
  await page.screenshot({ path: 'test-results/localhost-success.png' });
  
  console.log('✅ Playwright can access localhost:3000');
});
