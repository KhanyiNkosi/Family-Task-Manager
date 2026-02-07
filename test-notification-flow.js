#!/usr/bin/env node

/**
 * Test script to verify notification system end-to-end
 * Run with: node test-notification-flow.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationFlow() {
  console.log('\n🔍 NOTIFICATION SYSTEM DIAGNOSTIC\n');
  console.log('='.repeat(60));

  // 1. Check if notifications table exists
  console.log('\n1️⃣  Checking notifications table...');
  const { data: notifTable, error: tableError } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ Notifications table error:', tableError.message);
    if (tableError.code === '42P01') {
      console.log('📝 Run create-notifications-table.sql in Supabase SQL Editor');
    }
    return;
  }
  console.log('✅ Notifications table exists');

  // 2. Check existing notifications
  console.log('\n2️⃣  Checking existing notifications...');
  const { data: existingNotifs, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (notifError) {
    console.error('❌ Error fetching notifications:', notifError.message);
  } else {
    console.log(`📬 Found ${existingNotifs?.length || 0} recent notifications`);
    if (existingNotifs && existingNotifs.length > 0) {
      existingNotifs.forEach(n => {
        console.log(`   - [${n.type}] ${n.title}: ${n.message.substring(0, 50)}...`);
      });
    }
  }

  // 3. Check triggers on tasks table
  console.log('\n3️⃣  Checking triggers on tasks table...');
  console.log('⚠️  Cannot check triggers directly from JS');
  console.log('📝 Run check-notifications-system.sql in Supabase SQL Editor to verify');

  // 4. Try to find a parent and child to test with
  console.log('\n4️⃣  Finding test users...');
  
  // Find a parent
  const { data: parents, error: parentError } = await supabase
    .from('profiles')
    .select('id, name, role, family_id')
    .eq('role', 'parent')
    .limit(1);
  
  if (parentError || !parents || parents.length === 0) {
    console.log('⚠️  No parent profiles found');
  } else {
    console.log(`👨 Parent: ${parents[0].name} (${parents[0].id})`);
    console.log(`   Family: ${parents[0].family_id}`);
  }

  // Find a child
  const { data: children, error: childError } = await supabase
    .from('profiles')
    .select('id, name, role, family_id')
    .eq('role', 'child')
    .limit(1);
  
  if (childError || !children || children.length === 0) {
    console.log('⚠️  No child profiles found');
  } else {
    console.log(`👧 Child: ${children[0].name} (${children[0].id})`);
    console.log(`   Family: ${children[0].family_id}`);
  }

  // 5. Check for existing tasks
  console.log('\n5️⃣  Checking existing tasks...');
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, status, assigned_to, family_id, help_requested')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (taskError) {
    console.error('❌ Error fetching tasks:', taskError.message);
  } else {
    console.log(`📋 Found ${tasks?.length || 0} recent tasks`);
    if (tasks && tasks.length > 0) {
      tasks.forEach(t => {
        console.log(`   - [${t.status}] ${t.title} (ID: ${t.id.substring(0, 8)}...)`);
      });
    }
  }

  // 6. Test manual notification creation
  if (parents && parents.length > 0 && children && children.length > 0) {
    console.log('\n6️⃣  Testing manual notification creation...');
    const testNotif = {
      user_id: parents[0].id,
      family_id: parents[0].family_id,
      title: 'Test Notification',
      message: 'This is a test notification created by the diagnostic script',
      type: 'info',
      read: false,
    };

    const { data: newNotif, error: createError } = await supabase
      .from('notifications')
      .insert(testNotif)
      .select();
    
    if (createError) {
      console.error('❌ Failed to create test notification:', createError.message);
      console.log('💡 This might be an RLS policy issue');
      console.log('📝 Make sure RLS policies allow INSERT for authenticated users');
    } else {
      console.log('✅ Test notification created successfully!');
      console.log(`   ID: ${newNotif[0].id}`);
      
      // Clean up test notification
      await supabase.from('notifications').delete().eq('id', newNotif[0].id);
      console.log('🧹 Test notification cleaned up');
    }
  }

  // 7. Final recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 NEXT STEPS:\n');
  
  if (tableError) {
    console.log('1. Run create-notifications-table.sql in Supabase SQL Editor');
  } else {
    console.log('1. ✅ Notifications table exists');
  }
  
  console.log('2. Run create-notification-triggers.sql in Supabase SQL Editor');
  console.log('3. Run check-notifications-system.sql to verify triggers');
  console.log('4. Try completing a task in the app');
  console.log('5. Check the notifications table in Supabase for new entries');
  
  console.log('\n💡 Common issues:');
  console.log('   - Triggers not created in Supabase database');
  console.log('   - RLS policies blocking trigger inserts (triggers need SECURITY DEFINER)');
  console.log('   - family_id mismatch between users and tasks');
  console.log('   - User lookup failing (check profiles table)');
  
  console.log('\n');
}

testNotificationFlow().catch(console.error);
