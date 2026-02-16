import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role for direct database access (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature || !verifySignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventName = event.meta.event_name;
    const data = event.data;

    console.log('Lemon Squeezy webhook received:', eventName);

    // Get user_id from custom data
    const userId = event.meta.custom_data?.user_id;

    if (!userId) {
      console.error('No user_id in webhook data');
      return NextResponse.json({ error: 'No user_id' }, { status: 400 });
    }

    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(userId, data);
        break;
      
      case 'subscription_created':
        await handleSubscriptionCreated(userId, data);
        break;
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(userId, data);
        break;
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(userId, data);
        break;
      
      case 'subscription_resumed':
        await handleSubscriptionResumed(userId, data);
        break;
      
      case 'subscription_expired':
        await handleSubscriptionExpired(userId, data);
        break;
      
      case 'subscription_payment_success':
        await handlePaymentSuccess(userId, data);
        break;
      
      case 'subscription_payment_failed':
        await handlePaymentFailed(userId, data);
        break;
        
      default:
        console.log('Unhandled webhook event:', eventName);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleOrderCreated(userId: string, data: any) {
  console.log('Order created for user:', userId);
  
  // Check if this is a lifetime purchase
  const productName = data.attributes.first_order_item?.product_name || '';
  
  if (productName.toLowerCase().includes('lifetime')) {
    const { error } = await supabase
      .from('profiles')
      .update({
        premium_status: 'lifetime',
        premium_expires_at: null,
        lemonsqueezy_customer_id: data.attributes.customer_id
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating profile for lifetime purchase:', error);
    } else {
      console.log('Lifetime access granted to user:', userId);
    }
  }
}

async function handleSubscriptionCreated(userId: string, data: any) {
  const attrs = data.attributes;
  
  // Determine plan type from product name
  const productName = attrs.product_name || '';
  const planType = productName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';
  
  console.log('Creating subscription for user:', userId, 'Plan:', planType);
  
  // Insert subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      lemonsqueezy_subscription_id: data.id,
      lemonsqueezy_customer_id: attrs.customer_id,
      lemonsqueezy_order_id: attrs.order_id,
      lemonsqueezy_product_id: attrs.product_id,
      lemonsqueezy_variant_id: attrs.variant_id,
      status: attrs.status || 'active',
      plan_type: planType,
      billing_amount: parseFloat(attrs.subtotal || '0'),
      billing_currency: attrs.currency || 'USD',
      current_period_start: attrs.created_at,
      current_period_end: attrs.renews_at,
      trial_ends_at: attrs.trial_ends_at
    });
    
  if (subError) {
    console.error('Error creating subscription record:', subError);
  }
  
  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      premium_status: 'premium',
      premium_expires_at: attrs.renews_at,
      lemonsqueezy_customer_id: attrs.customer_id,
      lemonsqueezy_subscription_id: data.id
    })
    .eq('id', userId);
    
  if (profileError) {
    console.error('Error updating profile for subscription:', profileError);
  } else {
    console.log('Premium access granted to user:', userId);
  }
}

async function handleSubscriptionUpdated(userId: string, data: any) {
  const attrs = data.attributes;
  
  console.log('Updating subscription for user:', userId);
  
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: attrs.status,
      current_period_end: attrs.renews_at,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', data.id);
    
  if (subError) {
    console.error('Error updating subscription:', subError);
  }
  
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      premium_expires_at: attrs.renews_at
    })
    .eq('id', userId);
    
  if (profileError) {
    console.error('Error updating profile expiry:', profileError);
  }
}

async function handleSubscriptionCancelled(userId: string, data: any) {
  console.log('Subscription cancelled for user:', userId);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', data.id);
    
  if (error) {
    console.error('Error marking subscription as cancelled:', error);
  }
  
  // Don't immediately revoke premium - wait until period ends
  console.log('Premium access will remain until current period ends');
}

async function handleSubscriptionResumed(userId: string, data: any) {
  console.log('Subscription resumed for user:', userId);
  
  const attrs = data.attributes;
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      cancelled_at: null,
      current_period_end: attrs.renews_at
    })
    .eq('lemonsqueezy_subscription_id', data.id);
    
  if (error) {
    console.error('Error resuming subscription:', error);
  }
}

async function handleSubscriptionExpired(userId: string, data: any) {
  console.log('Subscription expired for user:', userId);
  
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'expired'
    })
    .eq('lemonsqueezy_subscription_id', data.id);
    
  if (subError) {
    console.error('Error marking subscription as expired:', subError);
  }
  
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      premium_status: 'free',
      premium_expires_at: null
    })
    .eq('id', userId);
    
  if (profileError) {
    console.error('Error revoking premium access:', profileError);
  } else {
    console.log('Premium access revoked for user:', userId);
  }
}

async function handlePaymentSuccess(userId: string, data: any) {
  console.log('Payment successful for user:', userId);
  // Extend subscription period
  await handleSubscriptionUpdated(userId, data);
}

async function handlePaymentFailed(userId: string, data: any) {
  console.log('Payment failed for user:', userId);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due'
    })
    .eq('lemonsqueezy_subscription_id', data.id);
    
  if (error) {
    console.error('Error marking subscription as past_due:', error);
  }
  
  // TODO: Send notification to user about failed payment
  console.log('Payment failed - user should be notified');
}
