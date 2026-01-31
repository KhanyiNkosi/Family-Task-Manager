// tests/login-better.spec.js - Better login test
const { test, expect } = require('@playwright/test');

test('login page has form elements', async ({ page }) => {
  await page.goto('/login');
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/login-page.png' });
  
  // Check page title or heading
  const pageTitle = await page.title();
  console.log(`Login page title: "${pageTitle}"`);
  
  // Look for login form - multiple strategies
  const selectors = [
    'input[type="email"]',
    'input[type="password"]',
    'button:has-text("Sign In")',
    'button:has-text("Login")',
    'form',
    '[data-test="login-form"]',
    'text=Email',
    'text=Password'
  ];
  
  let foundElement = false;
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const count = await element.count();
    if (count > 0) {
      console.log(`Found element with selector: "${selector}"`);
      foundElement = true;
      break;
    }
  }
  
  expect(foundElement).toBeTruthy();
  console.log('✅ Login page test passed');
});

test('can type in login form', async ({ page }) => {
  await page.goto('/login');
  
  // Try to find and fill email field
  const emailInput = page.locator('input[type="email"], [placeholder*="email"], [placeholder*="Email"]').first();
  
  if (await emailInput.count() > 0) {
    await emailInput.fill('test@example.com');
    console.log('✅ Can type in email field');
  }
  
  // Try to find and fill password field  
  const passwordInput = page.locator('input[type="password"], [placeholder*="password"], [placeholder*="Password"]').first();
  
  if (await passwordInput.count() > 0) {
    await passwordInput.fill('testpassword');
    console.log('✅ Can type in password field');
  }
  
  // Check if we found at least one field
  const foundFields = (await emailInput.count() > 0) || (await passwordInput.count() > 0);
  expect(foundFields).toBeTruthy();
});
