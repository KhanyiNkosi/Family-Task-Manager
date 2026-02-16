import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, category, message, ticketNumber } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send notification to support team
    await resend.emails.send({
      from: 'FamilyTask Support <support@familytask.co>',
      to: 'support@familytask.co',
      replyTo: email,
      subject: `[${category.toUpperCase()}] New Support Ticket #${ticketNumber || 'N/A'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎫 New Support Ticket</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ticket #${ticketNumber || 'N/A'}</p>
          </div>
          
          <!-- Body -->
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>📋 Ticket Details</strong><br>
                  <strong>Ticket Number:</strong> #${ticketNumber || 'N/A'}<br>
                  <strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}<br>
                  <strong>From:</strong> ${name}<br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Received:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              
              <h3 style="color: #333; font-size: 18px; margin-top: 25px;">Message:</h3>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; word-wrap: break-word;">
${message}
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 5px 0;">
                  <strong>⚡ Quick Actions:</strong>
                </p>
                <p style="font-size: 13px; color: #666;">
                  Reply directly to this email to respond to <strong>${name}</strong> at <a href="mailto:${email}" style="color: #667eea;">${email}</a>
                </p>
              </div>
              
            </div>
            
          </div>
          
        </body>
        </html>
      `,
      text: `
🎫 NEW SUPPORT TICKET #${ticketNumber || 'N/A'}

TICKET DETAILS
Ticket Number: #${ticketNumber || 'N/A'}
Category: ${category.charAt(0).toUpperCase() + category.slice(1)}
From: ${name}
Email: ${email}
Received: ${new Date().toLocaleString()}

MESSAGE:
${message}

---
Reply directly to this email to respond to ${name} at ${email}
      `
    });

    // Send confirmation to user
    await resend.emails.send({
      from: 'FamilyTask Support <support@familytask.co>',
      to: email,
      subject: `We received your message - Ticket #${ticketNumber || 'N/A'}`,
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
              
              <p>Hi ${name},</p>
              
              <p>We've received your support request and wanted to let you know that our team is on it. We typically respond within <strong>24 hours</strong> (often much sooner!).</p>
              
              <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>📌 Your Ticket Details</strong><br>
                  <strong>Ticket Number:</strong> #${ticketNumber || 'N/A'}<br>
                  <strong>Category:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}<br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Received:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              
              <h3 style="color: #333; font-size: 18px; margin-top: 25px;">What happens next?</h3>
              
              <ul style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">Our support team will review your message</li>
                <li style="margin-bottom: 10px;">You'll receive a detailed response via email to <strong>${email}</strong></li>
                <li style="margin-bottom: 10px;">We may ask for additional information if needed</li>
                <li style="margin-bottom: 10px;">Keep your ticket number <strong>#${ticketNumber || 'N/A'}</strong> for reference</li>
              </ul>
              
              <h3 style="color: #333; font-size: 18px; margin-top: 25px;">Need immediate help?</h3>
              
              <p>While waiting for our response, you might find these resources helpful:</p>
              
              <div style="margin: 20px 0;">
                <a href="https://familytask.co/my-support-tickets" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; margin-bottom: 10px;">My Tickets</a>
                <a href="https://familytask.co/pricing" style="display: inline-block; background: #764ba2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">View Pricing</a>
              </div>
              
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <strong>FamilyTask</strong> - Making family collaboration easier
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0;">
                You can reply directly to this email if you need to add more information.<br>
                Your response will be added to ticket #${ticketNumber || 'N/A'}
              </p>
              <div style="margin-top: 15px;">
                <a href="https://familytask.co" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">Home</a>
                <span style="color: #ddd;">|</span>
                <a href="https://familytask.co/my-support-tickets" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">My Tickets</a>
                <span style="color: #ddd;">|</span>
                <a href="https://familytask.co/contact-support" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 13px;">Contact Support</a>
              </div>
            </div>
            
          </div>
          
        </body>
        </html>
      `,
      text: `
FamilyTask Support - We've Received Your Message!

Hi ${name},

We've received your support request and wanted to let you know that our team is on it. We typically respond within 24 hours (often much sooner!).

YOUR TICKET DETAILS
Ticket Number: #${ticketNumber || 'N/A'}
Category: ${category.charAt(0).toUpperCase() + category.slice(1)}
Email: ${email}
Received: ${new Date().toLocaleString()}

WHAT HAPPENS NEXT?
- Our support team will review your message
- You'll receive a detailed response via email to ${email}
- We may ask for additional information if needed
- Keep your ticket number #${ticketNumber || 'N/A'} for reference

NEED IMMEDIATE HELP?
Visit our website for more resources:
- My Tickets: https://familytask.co/my-support-tickets
- Pricing: https://familytask.co/pricing
- Contact Support: https://familytask.co/contact-support

---
FamilyTask - Making family collaboration easier

You can reply directly to this email if you need to add more information.
Your response will be added to ticket #${ticketNumber || 'N/A'}

Home: https://familytask.co
My Tickets: https://familytask.co/my-support-tickets
Contact Support: https://familytask.co/contact-support
      `
    });

    return NextResponse.json({ 
      success: true,
      message: 'Emails sent successfully' 
    });

  } catch (error: any) {
    console.error('Error sending support emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: error.message },
      { status: 500 }
    );
  }
}
