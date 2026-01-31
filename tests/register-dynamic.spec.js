// tests/register-dynamic.spec.js - Check for dynamic form
const { test, expect } = require('@playwright/test');

test('check register page for dynamic form', async ({ page }) => {
  await page.goto('/register');
  
  console.log('=== CHECKING DYNAMIC CONTENT ===');
  
  // Wait a bit for any JavaScript to load
  await page.waitForTimeout(2000);
  
  // Check again for inputs
  const inputsAfterWait = await page.locator('input').all();
  console.log(`Inputs after wait: ${inputsAfterWait.length}`);
  
  // Check for hidden inputs
  const allInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      hidden: input.hidden,
      style: input.style.display,
      className: input.className
    }));
  });
  
  console.log('All inputs (including hidden):', JSON.stringify(allInputs, null, 2));
  
  // Check for any form-related elements
  const formElements = await page.evaluate(() => {
    const elements = [];
    
    // Check for labels
    document.querySelectorAll('label').forEach(label => {
      elements.push({
        type: 'label',
        text: label.textContent?.trim(),
        htmlFor: label.htmlFor
      });
    });
    
    // Check for divs that might contain form
    document.querySelectorAll('div[class*="form"], div[class*="input"], div[class*="field"]').forEach(div => {
      if (div.textContent?.includes('@') || div.textContent?.includes('email') || 
          div.textContent?.includes('password') || div.textContent?.includes('sign')) {
        elements.push({
          type: 'div',
          text: div.textContent?.trim().substring(0, 50),
          className: div.className
        });
      }
    });
    
    return elements;
  });
  
  console.log('Form-related elements:', JSON.stringify(formElements, null, 2));
  
  // Take screenshot to see what's visible
  await page.screenshot({ path: 'debug-register-visible.png', fullPage: true });
  
  // Check if there's text indicating what the register page does
  const pageText = await page.textContent('body');
  console.log('Page contains "email":', pageText.toLowerCase().includes('email'));
  console.log('Page contains "password":', pageText.toLowerCase().includes('password'));
  console.log('Page contains "sign up":', pageText.toLowerCase().includes('sign up'));
  console.log('Page contains "register":', pageText.toLowerCase().includes('register'));
  
  // Check for common auth providers
  const hasGoogle = await page.locator('text=/google|Google/i').count() > 0;
  const hasGithub = await page.locator('text=/github|GitHub/i').count() > 0;
  const hasOAuth = await page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Continue with")').count() > 0;
  
  console.log('Has Google auth:', hasGoogle);
  console.log('Has GitHub auth:', hasGithub);
  console.log('Has OAuth buttons:', hasOAuth);
});
