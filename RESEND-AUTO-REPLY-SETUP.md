# Support Acknowledgement Email Setup - Resend

## Overview
Automatically send acknowledgement emails when users contact support@familytask.co

## Option 1: Resend Email Template (Recommended)

### Step 1: Create Email Template in Resend

1. Log in to [Resend Dashboard](https://resend.com/emails)
2. Go to **Emails → Templates**
3. Click **Create Template**
4. Use the template below:

**Template Name:** `support-ticket-acknowledgement`

**Subject:** `We received your message - FamilyTask Support`

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Ticket Received</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">FamilyTask Support</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We've received your message!</p>
  </div>
  
  <!-- Body -->
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    
    <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin-top: 0;">Thank You for Contacting Us!</h2>
      
      <p>Hi there,</p>
      
      <p>We've received your support request and wanted to let you know that our team is on it. We typically respond within <strong>24 hours</strong> (often much sooner!).</p>
      
      <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px;">
          <strong>📌 Ticket Details</strong><br>
          Email: {{email}}<br>
          Received: {{timestamp}}<br>
          Reference: #{{ticket_id}}
        </p>
      </div>
      
      <h3 style="color: #333; font-size: 18px; margin-top: 25px;">What happens next?</h3>
      
      <ul style="padding-left: 20px;">
        <li style="margin-bottom: 10px;">Our support team will review your message</li>
        <li style="margin-bottom: 10px;">You'll receive a detailed response via email</li>
        <li style="margin-bottom: 10px;">We may ask for additional information if needed</li>
      </ul>
      
      <h3 style="color: #333; font-size: 18px; margin-top: 25px;">Need immediate help?</h3>
      
      <p>While waiting for our response, you might find these resources helpful:</p>
      
      <div style="display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap;">
        <a href="https://familytask.co/help" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Help Center</a>
        <a href="https://familytask.co/docs" style="display: inline-block; background: #764ba2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Documentation</a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        <strong>FamilyTask</strong> - Making family collaboration easier
      </p>
      <p style="color: #999; font-size: 12px; margin: 10px 0;">
        This is an automated acknowledgement. Please do not reply to this email.<br>
        If you need to add more information, send a new email to 
        <a href="mailto:support@familytask.co" style="color: #667eea;">support@familytask.co</a>
      </p>
      <div style="margin-top: 15px;">
        <a href="https://familytask.co" style="color: #667eea; text-decoration: none; margin: 0 10px;">Home</a>
        <a href="https://familytask.co/pricing" style="color: #667eea; text-decoration: none; margin: 0 10px;">Pricing</a>
        <a href="https://familytask.co/contact-support" style="color: #667eea; text-decoration: none; margin: 0 10px;">Contact</a>
      </div>
    </div>
    
  </div>
  
</body>
</html>
```

**Text Content (Plain Text Alternative):**
```
FamilyTask Support - We've Received Your Message!

Hi there,

We've received your support request and wanted to let you know that our team is on it. We typically respond within 24 hours (often much sooner!).

TICKET DETAILS
Email: {{email}}
Received: {{timestamp}}
Reference: #{{ticket_id}}

WHAT HAPPENS NEXT?
- Our support team will review your message
- You'll receive a detailed response via email
- We may ask for additional information if needed

NEED IMMEDIATE HELP?
While waiting for our response, check out:
- Help Center: https://familytask.co/help
- Documentation: https://familytask.co/docs

---
FamilyTask - Making family collaboration easier

This is an automated acknowledgement. Please do not reply to this email.
If you need to add more information, send a new email to support@familytask.co

Home: https://familytask.co
Pricing: https://familytask.co/pricing
Contact: https://familytask.co/contact-support
```

### Step 2: Set Up Email Forwarding with Auto-Reply

#### Option A: Using Resend's Inbound Email Feature

1. Go to **Settings → Domains** in Resend
2. Select `familytask.co`
3. Click **Inbound Email**
4. Add MX records to your DNS:
   ```
   Priority: 10
   Value: mx.resend.com
   ```
5. Create webhook endpoint (see below)

#### Option B: Manual Setup with Gmail/Outlook

If you're forwarding to Gmail/Outlook:

**Gmail:**
1. Go to Gmail Settings → See all settings → Filters and Blocked Addresses
2. Create filter:
   - To: `support@familytask.co`
   - Forward to: your support team email
3. Use Resend API to send acknowledgement (see API code below)

**Outlook:**
1. Go to Outlook.com → Settings → Mail → Rules
2. Create rule:
   - When message arrives at: `support@familytask.co`
   - Forward to: your support team email
3. Use Resend API to send acknowledgement

### Step 3: Create API Endpoint for Auto-Reply

Create this file in your Next.js app:

#### File: `app/api/support-webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Extract email details from Resend inbound webhook
    const fromEmail = payload.from;
    const subject = payload.subject;
    const receivedAt = new Date().toISOString();
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Send acknowledgement email
    await resend.emails.send({
      from: 'FamilyTask Support <support@familytask.co>',
      to: fromEmail,
      subject: 'We received your message - FamilyTask Support',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">FamilyTask Support</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">We've received your message!</p>
          </div>
          
          <!-- Body -->
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0;">Thank You for Contacting Us!</h2>
              
              <p>Hi there,</p>
              
              <p>We've received your support request and wanted to let you know that our team is on it. We typically respond within <strong>24 hours</strong> (often much sooner!).</p>
              
              <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>📌 Ticket Details</strong><br>
                  Email: ${fromEmail}<br>
                  Received: ${new Date(receivedAt).toLocaleString()}<br>
                  Reference: #${ticketId}
                </p>
              </div>
              
              <h3 style="color: #333; font-size: 18px; margin-top: 25px;">What happens next?</h3>
              
              <ul style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">Our support team will review your message</li>
                <li style="margin-bottom: 10px;">You'll receive a detailed response via email</li>
                <li style="margin-bottom: 10px;">We may ask for additional information if needed</li>
              </ul>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <strong>FamilyTask</strong> - Making family collaboration easier
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0;">
                This is an automated acknowledgement. Please do not reply to this email.<br>
                If you need to add more information, send a new email to support@familytask.co
              </p>
            </div>
            
          </div>
          
        </body>
        </html>
      `,
      text: `
FamilyTask Support - We've Received Your Message!

Hi there,

We've received your support request and wanted to let you know that our team is on it. We typically respond within 24 hours (often much sooner!).

TICKET DETAILS
Email: ${fromEmail}
Received: ${new Date(receivedAt).toLocaleString()}
Reference: #${ticketId}

WHAT HAPPENS NEXT?
- Our support team will review your message
- You'll receive a detailed response via email
- We may ask for additional information if needed

---
FamilyTask - Making family collaboration easier

This is an automated acknowledgement.
      `
    });
    
    // Store ticket in database (optional)
    // await supabase.from('support_tickets').insert({...})
    
    return NextResponse.json({ success: true, ticketId });
    
  } catch (error) {
    console.error('Support webhook error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
```

### Step 4: Configure Resend Webhook

1. Go to **Resend Dashboard → Webhooks**
2. Click **Add Webhook**
3. Configure:
   ```
   Endpoint URL: https://familytask.co/api/support-webhook
   Events: 
     ✅ email.received
   ```
4. Copy the signing secret and add to `.env.local`:
   ```
   RESEND_WEBHOOK_SECRET=your-signing-secret
   ```

### Step 5: Add Environment Variable

Add to `.env.local` and Vercel:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_WEBHOOK_SECRET=your_webhook_secret
```

## Option 2: Simple Auto-Reply (No Coding Required)

If you just want a basic auto-reply without webhooks:

### Using Gmail Auto-Reply:

1. Forward support@familytask.co to your Gmail
2. Go to Gmail Settings → See all settings → General
3. Scroll to "Vacation responder"
4. Enable and set message:
   ```
   Subject: We received your message - FamilyTask Support
   
   Thank you for contacting FamilyTask support!
   
   We've received your message and our team will respond within 24 hours.
   
   Best regards,
   The FamilyTask Team
   ```

### Using Resend Templates (Manual Send):

Create a simple Node.js script that you can run to send acknowledgements:

```javascript
// send-acknowledgement.js
const { Resend } = require('resend');
const resend = new Resend('your-api-key');

async function sendAcknowledgement(toEmail) {
  await resend.emails.send({
    from: 'FamilyTask Support <support@familytask.co>',
    to: toEmail,
    subject: 'We received your message - FamilyTask Support',
    html: '<p>Thank you for contacting us! We\'ll respond within 24 hours.</p>'
  });
}

// Usage: node send-acknowledgement.js user@example.com
sendAcknowledgement(process.argv[2]);
```

## Testing

1. Send test email to support@familytask.co
2. Check if acknowledgement is received
3. Verify formatting looks correct
4. Test on mobile devices

## Best Practices

- ✅ Keep acknowledgement brief and friendly
- ✅ Set clear expectations (24-hour response time)
- ✅ Include ticket reference number
- ✅ Provide alternative resources (help center, docs)
- ✅ Use professional but warm tone
- ✅ Make it mobile-friendly
- ✅ Include plain text version for accessibility

## Troubleshooting

**Issue: Acknowledgement not sending**
- Check Resend API key is correct
- Verify webhook endpoint is accessible
- Check Resend dashboard for failed emails

**Issue: Emails going to spam**
- Verify SPF, DKIM, DMARC records
- Check sender reputation in Resend dashboard
- Avoid spam trigger words

**Issue: Formatting broken**
- Test HTML in Resend template editor
- Verify email client compatibility
- Include plain text version

---

## Quick Start (Recommended Path)

1. **Create template in Resend** (5 min)
2. **Set up webhook endpoint** (10 min) 
3. **Configure Resend webhook** (5 min)
4. **Test with real email** (2 min)

**Total setup time: ~20 minutes**
