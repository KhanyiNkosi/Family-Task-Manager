// tests/register-click.spec.js - Test clicking register button
const { test, expect } = require('@playwright/test');

test('click register button to see what happens', async ({ page }) => {
  await page.goto('/register');
  
  console.log('=== TESTING REGISTER BUTTON CLICK ===');
  
  // Take before screenshot
  await page.screenshot({ path: 'register-before-click.png' });
  
  // Find and click the "Sign up" button
  const signUpButton = page.locator('button:has-text("Sign up")');
  await expect(signUpButton).toBeVisible();
  
  console.log('Found Sign up button, clicking...');
  
  // Click and see what happens
  await signUpButton.click();
  
  // Wait for any navigation or changes
  await page.waitForTimeout(3000);
  
  // Take after screenshot
  await page.screenshot({ path: 'register-after-click.png' });
  
  // Check if URL changed
  const currentUrl = page.url();
  console.log(`URL after click: ${currentUrl}`);
  
  // Check for any new elements that appeared
  const inputsAfterClick = await page.locator('input').all();
  console.log(`Inputs after click: ${inputsAfterClick.length}`);
  
  // Check for error messages or dialogs
  const errorMessages = await page.locator('.error, .text-red, [role="alert"], [data-error]').all();
  console.log(`Error messages: ${errorMessages.length}`);
  
  // Check page title
  console.log(`Page title: "${await page.title()}"`);
  
  // Check body text
  const bodyText = await page.textContent('body');
  console.log('Body contains "email":', bodyText.toLowerCase().includes('email'));
  console.log('Body contains "error":', bodyText.toLowerCase().includes('error'));
  console.log('Body contains "required":', bodyText.toLowerCase().includes('required'));
});
