import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Verify Resend webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('resend-signature');
    
    // Verify webhook signature
    if (signature && !verifySignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const payload = JSON.parse(body);
    
    // Check if this is an email.received event
    if (payload.type !== 'email.received') {
      return NextResponse.json({ message: 'Event type not handled' });
    }
    
    // Extract email details
    const fromEmail = payload.data.from;
    const fromName = payload.data.from_name || 'there';
    const subject = payload.data.subject;
    const receivedAt = new Date().toISOString();
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    console.log('Received support email from:', fromEmail);
    
    // Send acknowledgement email
    const result = await resend.emails.send({
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
              
              <p>Hi ${fromName},</p>
              
              <p>We've received your support request and wanted to let you know that our team is on it. We typically respond within <strong>24 hours</strong> (often much sooner!).</p>
              
              <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>📌 Ticket Details</strong><br>
                  Email: ${fromEmail}<br>
                  Subject: ${subject}<br>
                  Received: ${new Date(receivedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}<br>
                  Reference: #${ticketId}
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
              
              <div style="margin: 20px 0;">
                <a href="https://familytask.co/pricing" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; margin-bottom: 10px;">View Pricing</a>
                <a href="https://familytask.co/contact-support" style="display: inline-block; background: #764ba2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">Help Center</a>
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
                <a href="mailto:support@familytask.co" style="color: #667eea; text-decoration: none;">support@familytask.co</a>
              </p>
              <div style="margin-top: 15px;">
                <a href="https://familytask.co" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">Home</a>
                <span style="color: #ddd;">|</span>
                <a href="https://familytask.co/pricing" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">Pricing</a>
                <span style="color: #ddd;">|</span>
                <a href="https://familytask.co/contact-support" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">Contact</a>
              </div>
            </div>
            
          </div>
          
        </body>
        </html>
      `,
      text: `
FamilyTask Support - We've Received Your Message!

Hi ${fromName},

We've received your support request and wanted to let you know that our team is on it. We typically respond within 24 hours (often much sooner!).

TICKET DETAILS
Email: ${fromEmail}
Subject: ${subject}
Received: ${new Date(receivedAt).toLocaleString()}
Reference: #${ticketId}

WHAT HAPPENS NEXT?
- Our support team will review your message
- You'll receive a detailed response via email
- We may ask for additional information if needed

NEED IMMEDIATE HELP?
Visit our website for more resources:
- Pricing: https://familytask.co/pricing
- Help Center: https://familytask.co/contact-support

---
FamilyTask - Making family collaboration easier

This is an automated acknowledgement. Please do not reply to this email.
If you need to add more information, send a new email to support@familytask.co

Home: https://familytask.co
Pricing: https://familytask.co/pricing
Contact: https://familytask.co/contact-support
      `
    });
    
    console.log('Acknowledgement sent:', result.data?.id);
    
    // Optional: Store ticket in database
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    // await supabase.from('support_tickets').insert({
    //   ticket_id: ticketId,
    //   from_email: fromEmail,
    //   from_name: fromName,
    //   subject: subject,
    //   received_at: receivedAt,
    //   status: 'open'
    // });
    
    return NextResponse.json({ 
      success: true, 
      ticketId,
      acknowledgementSent: true 
    });
    
  } catch (error: any) {
    console.error('Support webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process support email' },
      { status: 500 }
    );
  }
}
