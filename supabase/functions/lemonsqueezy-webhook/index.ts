import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
}

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    attributes: {
      order_number: number
      user_email: string
      customer_id: number
      status: string
      first_order_item: {
        order_id: number
        product_id: number
        variant_id: number
        price: number
      }
      urls: {
        receipt: string
      }
    }
  }
}

interface LemonSqueezySubscriptionPayload {
  meta: {
    event_name: string
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      product_id: number
      variant_id: number
      user_email: string
      status: string
      renews_at: string | null
      ends_at: string | null
      created_at: string
      updated_at: string
    }
  }
}

async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(payload)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-signature')
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET')
    
    if (!webhookSecret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify signature
    if (signature && !await verifySignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload | LemonSqueezySubscriptionPayload
    const eventName = payload.meta.event_name
    
    console.log('Received webhook:', eventName)

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Handle different event types
    switch (eventName) {
      case 'order_created':
      case 'subscription_created': {
        const data = payload.data.attributes
        const userEmail = data.user_email
        const userId = payload.meta.custom_data?.user_id

        // Find user by email or custom user_id
        let query = supabaseAdmin
          .from('profiles')
          .select('id, email')

        if (userId) {
          query = query.eq('id', userId)
        } else {
          query = query.eq('email', userEmail)
        }

        const { data: profile, error: profileError } = await query.single()

        if (profileError || !profile) {
          console.error('User not found:', userEmail, userId)
          return new Response(
            JSON.stringify({ error: 'User not found', email: userEmail }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update profile with subscription info
        const updateData: any = {
          subscription_status: 'active',
          subscription_starts_at: new Date().toISOString(),
          lemonsqueezy_customer_id: data.customer_id.toString(),
        }

        // For subscriptions, add renewal date
        if ('renews_at' in data && data.renews_at) {
          updateData.subscription_renews_at = data.renews_at
        }

        // Store order ID
        if ('order_id' in data) {
          updateData.lemonsqueezy_order_id = data.order_id.toString()
        } else if ('order_number' in data) {
          updateData.lemonsqueezy_order_id = data.order_number.toString()
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id)

        if (updateError) {
          console.error('Failed to update profile:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ Subscription activated for user:', profile.id)
        break
      }

      case 'subscription_updated': {
        const data = payload.data.attributes as LemonSqueezySubscriptionPayload['data']['attributes']
        const userEmail = data.user_email

        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single()

        if (profileError || !profile) {
          console.error('User not found:', userEmail)
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateData: any = {
          subscription_status: data.status === 'active' ? 'active' : 
                              data.status === 'cancelled' ? 'cancelled' : 'expired',
        }

        if (data.renews_at) {
          updateData.subscription_renews_at = data.renews_at
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id)

        if (updateError) {
          console.error('Failed to update profile:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ Subscription updated for user:', profile.id)
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const data = payload.data.attributes as LemonSqueezySubscriptionPayload['data']['attributes']
        const userEmail = data.user_email

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single()

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
            })
            .eq('id', profile.id)

          console.log(`✅ Subscription ${eventName} for user:`, profile.id)
        }
        break
      }

      default:
        console.log('Unhandled event:', eventName)
    }

    return new Response(
      JSON.stringify({ success: true, event: eventName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
