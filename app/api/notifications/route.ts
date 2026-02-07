import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in notifications API:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      
      // If table doesn't exist, return empty array with helpful message
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({ 
          notifications: [],
          message: 'Notifications table not yet created. Run create-notifications-table.sql in Supabase.'
        }, { status: 200 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      familyId, 
      title, 
      message, 
      type = 'info', 
      actionUrl, 
      actionText 
    } = body;

    // Validate required fields
    if (!userId || !familyId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, familyId, title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['info', 'success', 'warning', 'error', 'task', 'reward'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create notification using the database function
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_family_id: familyId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_action_url: actionUrl || null,
      p_action_text: actionText || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      notificationId: data 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete all read notifications for the current user
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    
    if (notificationId) {
      // Delete specific notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Delete all read notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true);
      
      if (error) {
        console.error('Error deleting notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
