// tests/register-final-debug.spec.js
const { test, expect } = require('@playwright/test');

test('register page detailed debug', async ({ page }) => {
  await page.goto('/register');
  
  console.log('=== REGISTER PAGE DEBUG ===');
  
  // Wait for any dynamic content
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'register-page-current.png', fullPage: true });
  
  // Check for React hydration errors in console
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Check network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('supabase.co/auth')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  // Click the button to trigger any actions
  const signUpButton = page.locator('button:has-text("Sign up")');
  if (await signUpButton.count() > 0) {
    console.log('Found Sign up button, clicking...');
    await signUpButton.click();
    await page.waitForTimeout(2000);
  }
  
  // Check what inputs exist NOW
  const allInputs = await page.locator('input').all();
  console.log(`Total inputs on page: ${allInputs.length}`);
  
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const type = await input.getAttribute('type') || 'no-type';
    const name = await input.getAttribute('name') || 'no-name';
    const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
    const isVisible = await input.isVisible();
    
    console.log(`  Input ${i}: type="${type}", name="${name}", placeholder="${placeholder}", visible=${isVisible}`);
  }
  
  // Check for any hidden/conditional form
  const pageSource = await page.content();
  const hasEmailInSource = pageSource.includes('type="email"') || pageSource.includes('name="email"');
  const hasPasswordInSource = pageSource.includes('type="password"') || pageSource.includes('name="password"');
  
  console.log(`\nHTML source analysis:`);
  console.log(`  Has email field in source: ${hasEmailInSource}`);
  console.log(`  Has password field in source: ${hasPasswordInSource}`);
  
  // Check for error messages
  const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-600, .text-red-500, [role="alert"]').all();
  console.log(`\nError elements found: ${errorElements.length}`);
  
  for (let i = 0; i < errorElements.length; i++) {
    const errorText = await errorElements[i].textContent();
    console.log(`  Error ${i}: "${errorText}"`);
  }
  
  // Log console errors
  console.log(`\nConsole errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 3).forEach((err, i) => {
      console.log(`  Console error ${i}: ${err.substring(0, 200)}`);
    });
  }
  
  // Log network requests to Supabase auth
  console.log(`\nSupabase auth requests: ${networkRequests.length}`);
  if (networkRequests.length > 0) {
    networkRequests.forEach((req, i) => {
      console.log(`  Request ${i}: ${req.method} ${req.url}`);
      console.log(`    Headers: ${JSON.stringify(req.headers).substring(0, 200)}...`);
    });
  }
});
