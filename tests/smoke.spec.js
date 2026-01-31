// tests/smoke.spec.js - Simple smoke test
const { test, expect } = require('@playwright/test');

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  
  // Check page title or some content
  await expect(page).toHaveTitle(/Family Task Manager|Task App/i);
  
  // Take screenshot for verification
  await page.screenshot({ path: 'test-results/homepage.png' });
});

test('register page accessible', async ({ page }) => {
  await page.goto('/register');
  
  // Check for register form elements
  await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
  await expect(page.locator('button[type="submit"]').first()).toBeVisible();
});
