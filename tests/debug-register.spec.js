// tests/debug-register.spec.js - Debug register page
const { test, expect } = require('@playwright/test');

test('debug register page', async ({ page }) => {
  await page.goto('/register');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-register-page.png' });
  
  // List ALL elements
  console.log('=== DEBUG REGISTER PAGE ===');
  
  // All inputs
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input elements:`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type') || 'no-type';
    const name = await input.getAttribute('name') || 'no-name';
    const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
    const id = await input.getAttribute('id') || 'no-id';
    
    console.log(`  [${i}] type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
  }
  
  // All buttons
  const buttons = await page.locator('button').all();
  console.log(`\nFound ${buttons.length} button elements:`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent() || 'no-text';
    const type = await button.getAttribute('type') || 'no-type';
    
    console.log(`  [${i}] type="${type}", text="${text.trim()}"`);
  }
  
  // Check for forms
  const forms = await page.locator('form').all();
  console.log(`\nFound ${forms.length} form elements`);
  
  // Check page title
  console.log(`Page title: "${await page.title()}"`);
});
