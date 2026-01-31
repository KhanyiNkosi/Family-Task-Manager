// tests/login.spec.js
const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const SupabaseTestHelper = require('./utils/supabaseTestHelper');

const testHelper = new SupabaseTestHelper();

test.beforeEach(async () => {
  await testHelper.cleanupTestUsers('e2e-%@example.com');
});

test.afterAll(async () => {
  await testHelper.cleanupTestUsers('e2e-%@example.com');
});

test('login with valid credentials', async ({ page }) => {
  const email = `e2e-login-${crypto.randomBytes(4).toString('hex')}@example.com`;
  const password = `P@ssw0rd-${crypto.randomBytes(4).toString('hex')}`;
  
  // Create user first
  await testHelper.createTestUser(email, password);
  
  // Go to login page
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard or show success
  await page.waitForURL(/dashboard|home|profile/, { timeout: 10000 }).catch(() => {});
  
  // Check for protected content or user menu
  const protectedSelectors = [
    '[data-test="user-menu"]',
    '[data-test="dashboard"]',
    'text="Dashboard"',
    'text="Welcome"',
    'text="Profile"'
  ];
  
  let protectedFound = false;
  for (const selector of protectedSelectors) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 3000 });
      protectedFound = true;
      break;
    } catch {
      continue;
    }
  }
  
  expect(protectedFound).toBeTruthy();
});

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'nonexistent@example.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  
  // Should show error
  await expect(page.locator('.text-red-600, [data-test="error-message"]').first()).toBeVisible({
    timeout: 5000
  });
});
