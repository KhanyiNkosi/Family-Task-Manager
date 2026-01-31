// tests/register-error.spec.js - Capture register error
const { test, expect } = require('@playwright/test');

test('capture register page error message', async ({ page }) => {
  await page.goto('/register');
  
  console.log('=== CAPTURING REGISTER ERRORS ===');
  
  // First, check initial state
  const initialInputs = await page.locator('input').all();
  console.log(`Initial inputs: ${initialInputs.length}`);
  
  // List all visible elements
  const allElements = await page.evaluate(() => {
    const elements = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.textContent && el.textContent.trim()) {
        elements.push({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          className: el.className,
          id: el.id
        });
      }
    });
    return elements.filter(el => el.text.length > 0);
  });
  
  console.log('Visible text elements:', allElements.slice(0, 10));
  
  // Click button to trigger error
  const signUpButton = page.locator('button:has-text("Sign up")');
  await signUpButton.click();
  
  // Wait for error
  await page.waitForTimeout(1000);
  
  // Capture ALL error messages
  const errorElements = await page.locator('.error, .text-red, [role="alert"], [data-error], .text-red-600, .bg-red-50, .text-red-500').all();
  console.log(`Found ${errorElements.length} error elements`);
  
  for (let i = 0; i < errorElements.length; i++) {
    const errorText = await errorElements[i].textContent();
    console.log(`Error ${i + 1}: "${errorText}"`);
    
    // Take screenshot of error
    await errorElements[i].screenshot({ path: `register-error-${i}.png` });
  }
  
  // Check if form inputs appear after error
  const inputsAfterError = await page.locator('input').all();
  console.log(`Inputs after error: ${inputsAfterError.length}`);
  
  // Debug: Check React component state
  const reactData = await page.evaluate(() => {
    try {
      // Try to access React devtools data
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React devtools available';
      }
      return 'No React devtools';
    } catch {
      return 'Cannot access React data';
    }
  });
  
  console.log('React debug:', reactData);
});
