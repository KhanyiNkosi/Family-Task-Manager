# 📧 Resend Email Integration Guide

## Overview

This guide covers integrating Resend email service with the Contact Support feature. Implement this once your Cloudflare/Resend DNS/API issues are resolved.

---

## 🔑 Prerequisites

1. **Resend Account Setup:**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (important for Cloudflare integration)
   - Get your API key from dashboard

2. **Domain Configuration with Cloudflare:**
   - Add DNS records provided by Resend
   - Verify domain ownership
   - Wait for DNS propagation (can take 24-48 hours)

3. **API Key Storage:**
   - Add to `.env.local` (development)
   - Add to Vercel environment variables (production)

---

## 📦 Installation

```bash
npm install resend
```

Or add to package.json:
```json
{
  "dependencies": {
    "resend": "^3.0.0"
  }
}
```

---

## 🔧 Environment Variables

### Local Development (.env.local):
```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=support@familytaskmanager.com

# Alternative sender names
RESEND_FROM_NAME=Family Task Manager Support
```

### Production (Vercel):
Add the same variables in:
**Vercel Dashboard → Project Settings → Environment Variables**

---

## 📝 Implementation

### Step 1: Create Resend Client

Create: `lib/resendClient.ts`
```typescript
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const SUPPORT_EMAIL = process.env.RESEND_FROM_EMAIL || 'support@familytaskmanager.com';
export const SUPPORT_NAME = process.env.RESEND_FROM_NAME || 'Family Task Manager Support';
```

---

### Step 2: Create Email Templates

Create: `emails/support-ticket-confirmation.tsx`
```typescript
import * as React from 'react';

interface SupportTicketConfirmationProps {
  name: string;
  ticketNumber: number;
  category: string;
  message: string;
}

export const SupportTicketConfirmation: React.FC<SupportTicketConfirmationProps> = ({
  name,
  ticketNumber,
  category,
  message,
}) => {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #006372 0%, #00C2E0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-box { background: #e3f2fd; border-left: 4px solid #00C2E0; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Support Request Received</h1>
          </div>
          <div className="content">
            <p>Hi {name},</p>
            <p>We've received your support request and our team will get back to you within 24 hours.</p>
            
            <div className="ticket-box">
              <p><strong>Ticket Number:</strong> #{ticketNumber}</p>
              <p><strong>Category:</strong> {category}</p>
            </div>
            
            <p><strong>Your Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; white-space: pre-wrap;">{message}</p>
            
            <p>In the meantime, you can:</p>
            <ul>
              <li>Check our <a href="https://your-domain.com/help">Help Center</a></li>
              <li>Visit our <a href="https://your-domain.com/faq">FAQ page</a></li>
              <li>Reply to this email with additional information</li>
            </ul>
            
            <p>Thank you for using Family Task Manager!</p>
            <p>- The Support Team</p>
          </div>
          <div className="footer">
            <p>Family Task Manager © 2026</p>
            <p>You're receiving this email because you submitted a support request.</p>
          </div>
        </div>
      </body>
    </html>
  );
};
```

Create: `emails/support-ticket-admin-notification.tsx`
```typescript
import * as React from 'react';

interface SupportTicketAdminNotificationProps {
  name: string;
  email: string;
  ticketNumber: number;
  category: string;
  message: string;
}

export const SupportTicketAdminNotification: React.FC<SupportTicketAdminNotificationProps> = ({
  name,
  email,
  ticketNumber,
  category,
  message,
}) => {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; border: 2px solid #00C2E0; padding: 15px; margin: 15px 0; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h2>🆘 New Support Ticket</h2>
          </div>
          <div className="content">
            <div className="info-box">
              <p><strong>Ticket #:</strong> {ticketNumber}</p>
              <p><strong>From:</strong> {name} ({email})</p>
              <p><strong>Category:</strong> {category}</p>
            </div>
            
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; white-space: pre-wrap; border: 1px solid #ddd;">{message}</p>
            
            <p style="margin-top: 30px;">
              <a href="mailto:{email}" style="background: #00C2E0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply to Customer</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
```

---

### Step 3: Create API Route for Sending Emails

Create: `app/api/send-support-email/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resend, SUPPORT_EMAIL } from '@/lib/resendClient';
import { SupportTicketConfirmation } from '@/emails/support-ticket-confirmation';
import { SupportTicketAdminNotification } from '@/emails/support-ticket-admin-notification';

export async function POST(request: NextRequest) {
  try {
    const { name, email, category, message, ticketNumber } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send confirmation email to user
    const userEmail = await resend.emails.send({
      from: SUPPORT_EMAIL,
      to: email,
      subject: `Support Request Received - Ticket #${ticketNumber}`,
      react: SupportTicketConfirmation({ name, ticketNumber, category, message }),
    });

    // Send notification to support team
    const adminEmail = await resend.emails.send({
      from: SUPPORT_EMAIL,
      to: SUPPORT_EMAIL, // Or a separate admin email
      subject: `New Support Ticket #${ticketNumber} - ${category}`,
      react: SupportTicketAdminNotification({ name, email, ticketNumber, category, message }),
    });

    return NextResponse.json({
      success: true,
      userEmailId: userEmail.data?.id,
      adminEmailId: adminEmail.data?.id,
    });
  } catch (error: any) {
    console.error('Error sending support email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### Step 4: Update Contact Support Page

Update: `app/contact-support/page.tsx`

**Add this after saving to database (around line 56):**

```typescript
      // Send confirmation email via Resend
      try {
        const emailResponse = await fetch('/api/send-support-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            category: formData.category,
            message: formData.message,
            ticketNumber: newTicket?.ticket_number || 0,
          }),
        });

        if (!emailResponse.ok) {
          console.warn('Email notification failed, but ticket was saved');
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the whole operation if email fails
      }
```

**Complete updated handleSubmit function:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  // Validation
  if (!formData.name || !formData.email || !formData.message) {
    setError("Please fill in all required fields");
    setIsLoading(false);
    return;
  }

  try {
    const supabase = createClientSupabaseClient();
    
    // Store support ticket in database
    const { data: newTicket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        name: formData.name,
        email: formData.email,
        category: formData.category,
        message: formData.message,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select('ticket_number')
      .single();

    if (insertError) {
      console.error("Error submitting support ticket:", insertError);
      setError("Failed to submit your request. Please try again or email us directly.");
      setIsLoading(false);
      return;
    }

    // ✨ NEW: Send confirmation email via Resend
    try {
      const emailResponse = await fetch('/api/send-support-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          message: formData.message,
          ticketNumber: newTicket?.ticket_number || 0,
        }),
      });

      if (!emailResponse.ok) {
        console.warn('Email notification failed, but ticket was saved');
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the whole operation if email fails
    }

    setTicketNumber(newTicket?.ticket_number || null);
    setSuccess(true);
    setFormData({ name: "", email: "", category: "general", message: "" });
  } catch (err) {
    console.error("Unexpected error:", err);
    setError("An unexpected error occurred. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🧪 Testing

### Local Testing:

1. **Test email service:**
   ```bash
   # Create test script: test-resend.mjs
   ```

   ```javascript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   async function testEmail() {
     const result = await resend.emails.send({
       from: 'support@familytaskmanager.com',
       to: 'your-email@example.com',
       subject: 'Test Email',
       html: '<h1>Test successful!</h1>',
     });
     
     console.log('Email sent:', result);
   }
   
   testEmail();
   ```

   ```bash
   node test-resend.mjs
   ```

2. **Test contact form:**
   - Go to `http://localhost:3000/contact-support`
   - Fill out form
   - Submit
   - Check both inbox (user email) and support inbox

### Production Testing:
- Test with real email addresses
- Verify emails don't go to spam
- Check email deliverability

---

## 🚨 Troubleshooting

### Common Issues:

#### 1. DNS not verified
**Error:** Domain not verified
**Solution:**
- Check DNS records in Cloudflare
- Wait 24-48 hours for propagation
- Use Resend's verification tool

#### 2. Cloudflare blocking Resend
**Error:** 403 Forbidden or DNS issues
**Solution:**
- Disable Cloudflare proxy (orange cloud) for MX records
- Add SPF, DKIM records correctly
- Contact Resend support for Cloudflare-specific setup

#### 3. API key not working
**Error:** Unauthorized
**Solution:**
- Regenerate API key in Resend dashboard
- Update environment variables
- Redeploy application

#### 4. Emails going to spam
**Solution:**
- Verify domain properly
- Add DMARC record
- Warm up domain (send gradually increasing volume)
- Avoid spam trigger words

---

## 📊 Monitoring

### Track Email Metrics:
- Open rate
- Click rate
- Bounce rate
- Spam reports

### Resend Dashboard:
Access at: [resend.com/emails](https://resend.com/emails)
- View sent emails
- Check delivery status
- Monitor API usage

---

## 🎯 Next Steps After Integration

1. **Test thoroughly** in development
2. **Deploy to production** after Cloudflare/Resend is resolved
3. **Monitor email delivery** for first 48 hours
4. **Add more email templates:**
   - Task assignment notifications
   - Reward approval/rejection
   - Daily/weekly digests
   - Welcome emails
   - Password reset emails

5. **Consider adding:**
   - Email preferences in user settings
   - Unsubscribe functionality
   - Email frequency controls

---

## 💡 Additional Email Features (Future)

### Automated Notifications:
```typescript
// Example: Send email when child completes task
async function notifyParentTaskComplete(taskId: string) {
  const task = await getTask(taskId);
  const parent = await getParent(task.family_id);
  
  await resend.emails.send({
    from: SUPPORT_EMAIL,
    to: parent.email,
    subject: `Task Completed: ${task.title}`,
    react: TaskCompletionEmail({ task, child: task.assigned_to }),
  });
}
```

### Scheduled Emails:
- Daily task reminders
- Weekly family report
- Monthly achievement summary

---

## 📞 Support

**Resend Documentation:** https://resend.com/docs
**Resend Status:** https://status.resend.com
**Cloudflare Docs:** https://developers.cloudflare.com/dns/

**Need help?**
- File: `DEPLOYMENT-CHECKLIST.md`
- Contact: Resend support for DNS issues
- Contact: Cloudflare support for DNS configuration

---

**Status:** ⏳ Waiting for Cloudflare/Resend issue resolution
**Priority:** High
**Estimated Setup Time:** 2-3 hours (after DNS resolution)
