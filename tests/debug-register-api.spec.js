// tests/debug-register-api.spec.js
const { test, expect } = require('@playwright/test');

test('debug register API call', async ({ page }) => {
  // Listen to network requests
  await page.route('**/auth/v1/signup', async route => {
    console.log('📤 REGISTER API REQUEST:');
    console.log('URL:', route.request().url());
    console.log('Method:', route.request().method());
    
    const postData = route.request().postData();
    console.log('Request Body:', postData);
    
    // Continue the request
    await route.continue();
  });

  await page.goto('http://localhost:3000/register');
  
  // Fill and submit form if it exists
  const emailField = await page.$('input[type="email"]');
  if (emailField) {
    await page.fill('input[type="email"]', 'test@debug.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for network request
    await page.waitForTimeout(2000);
  } else {
    console.log('❌ No email field found on register page');
  }
});
