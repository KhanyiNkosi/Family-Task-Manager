// tests/fix-register-verification.spec.js
const { test, expect } = require('@playwright/test');

test('register with email and password', async ({ page }) => {
  // Go to register page
  await page.goto('http://localhost:3000/register');
  
  // Fill in the form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.fill('input[name="confirmPassword"]', 'Password123!');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Check for success or appropriate redirect
  await expect(page).not.toHaveURL(/.*register.*/);
  
  // Or check for success message
  const successMessage = await page.textContent('.success-message, .alert-success');
  if (successMessage) {
    console.log('✅ Registration successful:', successMessage);
  }
  
  // Check for error messages (should NOT see anonymous auth error)
  const errorText = await page.textContent('body');
  expect(errorText).not.toContain('Anonymous sign-ins are disabled');
  expect(errorText).not.toContain('anonymous auth');
});
