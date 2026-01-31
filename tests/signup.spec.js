// tests/signup.spec.js
const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const SupabaseTestHelper = require('./utils/supabaseTestHelper');

// Test data setup and cleanup
const testHelper = new SupabaseTestHelper();

test.beforeEach(async () => {
  // Optional: Clean up any leftover test users before each test
  await testHelper.cleanupTestUsers('e2e-%@example.com');
});

test.afterEach(async ({ page }, testInfo) => {
  // Take screenshot on failure
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = testInfo.outputPath(`failure-${testInfo.title}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }
});

test.afterAll(async () => {
  // Final cleanup after all tests
  await testHelper.cleanupTestUsers('e2e-%@example.com');
});

test('signup flow with email and password', async ({ page }) => {
  const email = `e2e-${crypto.randomBytes(4).toString('hex')}@example.com`;
  const password = `P@ssw0rd-${crypto.randomBytes(4).toString('hex')}`;

  console.log(`Testing with email: ${email}`);

  // Go to signup page
  await page.goto('/register'); // Changed from /signup to /register based on your app
  
  // Fill signup form - adjust selectors based on your actual form
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.fill('input[name="confirmPassword"]', password); // If you have confirm password field
  
  // If you have name field
  await page.fill('input[name="name"]', 'Test User');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success message or redirect
  await page.waitForTimeout(2000); // Give time for request
  
  // Check for success message (adjust based on your app)
  const successSelectors = [
    '.text-green-600', // Tailwind green text
    '[data-test="success-message"]',
    'text="Check your email"',
    'text="Registration successful"',
    'text="success"'
  ];
  
  let successFound = false;
  for (const selector of successSelectors) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 5000 });
      successFound = true;
      console.log(`Found success indicator: ${selector}`);
      break;
    } catch {
      continue;
    }
  }
  
  // If no success message found, check for errors
  if (!successFound) {
    const errorSelectors = [
      '.text-red-600',
      '[data-test="error-message"]',
      'text="error"',
      'text="invalid"',
      'text="failed"'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const element = page.locator(selector).first();
        const errorText = await element.textContent({ timeout: 1000 });
        if (errorText) {
          console.log(`Found error: ${errorText}`);
          // Take screenshot for debugging
          await page.screenshot({ path: `debug-signup-error-${Date.now()}.png` });
          break;
        }
      } catch {
        continue;
      }
    }
  }
  
  // Expect some form of feedback
  expect(successFound).toBeTruthy();
});

test('signup with existing email shows error', async ({ page }) => {
  // Create a user first
  const email = `e2e-existing-${crypto.randomBytes(4).toString('hex')}@example.com`;
  const password = 'TestPassword123!';
  
  await testHelper.createTestUser(email, password);
  
  // Try to sign up with same email
  await page.goto('/register');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Should show error message
  await expect(page.locator('.text-red-600, [data-test="error-message"]').first()).toBeVisible({
    timeout: 10000
  });
});

test('signup validation - weak password', async ({ page }) => {
  await page.goto('/register');
  
  // Fill with weak password
  await page.fill('input[name="email"]', `e2e-weak-${crypto.randomBytes(4).toString('hex')}@example.com`);
  await page.fill('input[name="password"]', 'weak');
  await page.click('button[type="submit"]');
  
  // Should show validation error
  await expect(page.locator('.text-red-600, [data-test="error-message"]').first()).toBeVisible({
    timeout: 5000
  });
});
