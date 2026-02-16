import { NextRequest, NextResponse } from 'next/server';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Configure Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy Error:', error)
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { variantId } = await request.json();
    
    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create checkout session
    const checkout = await createCheckout(
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID!,
      variantId,
      {
        checkoutData: {
          email: user.email || profile?.email,
          name: profile?.full_name,
          custom: {
            user_id: user.id
          }
        },
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
          dark: false,
          subscriptionPreview: true
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        preview: false,
        testMode: process.env.NODE_ENV === 'development'
      }
    );

    return NextResponse.json({ 
      checkoutUrl: checkout.data.data.attributes.url 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
