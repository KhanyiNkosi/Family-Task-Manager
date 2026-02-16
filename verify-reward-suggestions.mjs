// ============================================================================
// Verify Reward Suggestions System
// ============================================================================
// This script checks that reward suggestions work end-to-end
// ============================================================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        REWARD SUGGESTIONS SYSTEM VERIFICATION                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Check 1: Verify notifications table has metadata column
console.log('📊 CHECK 1: Notifications table schema\n');
const { data: tableInfo, error: tableError } = await supabase
  .from('notifications')
  .select('*')
  .limit(1);

if (tableError) {
  console.log('❌ Error accessing notifications table:', tableError.message);
} else {
  console.log('✅ Notifications table accessible');
  if (tableInfo && tableInfo.length > 0 && tableInfo[0].metadata) {
    console.log('✅ Metadata column exists');
  } else {
    console.log('⚠️  No notifications with metadata found (table may be empty)');
  }
}

// Check 2: Count reward suggestion notifications
console.log('\n📊 CHECK 2: Reward suggestion notifications\n');
const { data: suggestions, error: suggestError } = await supabase
  .from('notifications')
  .select('*')
  .eq('action_url', '/rewards-store')
  .order('created_at', { ascending: false });

if (suggestError) {
  console.log('❌ Error loading suggestions:', suggestError.message);
} else {
  console.log(`Found ${suggestions?.length || 0} reward suggestion notifications`);
  
  if (suggestions && suggestions.length > 0) {
    console.log('\nRecent suggestions:');
    suggestions.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. "${s.metadata?.reward_name || s.title}"`);
      console.log(`     Suggested by: ${s.metadata?.suggested_by_name || 'Unknown'}`);
      console.log(`     Points: ${s.metadata?.suggested_points || 'N/A'}`);
      console.log(`     Status: ${s.read ? '✓ Read' : '● Unread'}`);
      console.log(`     Created: ${new Date(s.created_at).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.log('  No suggestions found. Try creating one as a child user.');
  }
}

// Check 3: User profiles and roles
console.log('\n📊 CHECK 3: User profiles and roles\n');
const { data: userProfiles, error: profilesError } = await supabase
  .from('user_profiles')
  .select('id, role');

if (profilesError) {
  console.log('❌ Error loading user_profiles:', profilesError.message);
} else {
  const parents = userProfiles?.filter(u => u.role === 'parent') || [];
  const children = userProfiles?.filter(u => u.role === 'child') || [];
  
  console.log(`Parents: ${parents.length}`);
  console.log(`Children: ${children.length}`);
  
  if (parents.length === 0) {
    console.log('⚠️  No parent users found - suggestions need a parent to receive them');
  }
}

// Check 4: Families with parents and children
console.log('\n📊 CHECK 4: Family structure\n');
const { data: profiles, error: familyError } = await supabase
  .from('profiles')
  .select('id, full_name, family_id');

if (familyError) {
  console.log('❌ Error loading profiles:', familyError.message);
} else {
  // Group by family_id
  const families = {};
  profiles?.forEach(p => {
    if (!families[p.family_id]) {
      families[p.family_id] = { members: [], parents: 0, children: 0 };
    }
    families[p.family_id].members.push(p);
  });
  
  // Check which family members are parents/children
  for (const familyId in families) {
    const family = families[familyId];
    for (const member of family.members) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', member.id)
        .single();
      
      if (userProfile?.role === 'parent') {
        family.parents++;
      } else if (userProfile?.role === 'child') {
        family.children++;
      }
    }
  }
  
  console.log(`Total families: ${Object.keys(families).length}\n`);
  
  Object.entries(families).forEach(([familyId, family], i) => {
    console.log(`Family ${i + 1} (${familyId}):`);
    console.log(`  Members: ${family.members.length}`);
    console.log(`  Parents: ${family.parents}`);
    console.log(`  Children: ${family.children}`);
    
    if (family.parents === 0) {
      console.log('  ⚠️  No parent in this family - suggestions won\'t work');
    } else if (family.children === 0) {
      console.log('  ℹ️  No children in this family - no one to send suggestions');
    } else {
      console.log('  ✅ Family structure looks good');
    }
    console.log('');
  });
}

// Check 5: Test query that child page uses
console.log('\n📊 CHECK 5: Simulating child\'s parent lookup\n');

// Get a sample child user
const { data: childUsers } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('role', 'child')
  .limit(1);

if (childUsers && childUsers.length > 0) {
  const childId = childUsers[0].id;
  
  // Get child's profile
  const { data: childProfile } = await supabase
    .from('profiles')
    .select('family_id, full_name')
    .eq('id', childId)
    .single();
  
  if (childProfile?.family_id) {
    console.log(`Testing with child: ${childProfile.full_name}`);
    console.log(`Family ID: ${childProfile.family_id}\n`);
    
    // Try the corrected parent lookup query
    console.log('Attempting parent lookup...');
    const { data: parentProfiles, error: lookupError } = await supabase
      .from('user_profiles')
      .select('id, profiles!inner(id, family_id)')
      .eq('role', 'parent')
      .eq('profiles.family_id', childProfile.family_id)
      .limit(1);
    
    if (lookupError) {
      console.log('❌ Parent lookup failed:', lookupError.message);
    } else if (!parentProfiles || parentProfiles.length === 0) {
      console.log('⚠️  No parent found in this family');
    } else {
      console.log('✅ Parent lookup successful!');
      console.log(`   Parent ID: ${parentProfiles[0].id}`);
    }
  }
} else {
  console.log('⚠️  No child users found - cannot test parent lookup');
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    VERIFICATION COMPLETE                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📝 Summary:\n');
console.log('To test reward suggestions:');
console.log('1. Login as a CHILD user');
console.log('2. Navigate to "My Rewards" (/my-rewards)');
console.log('3. Click "Suggest Reward" button');
console.log('4. Fill in reward details and submit');
console.log('5. Logout and login as a PARENT user');
console.log('6. Navigate to "Rewards Store" (/rewards-store)');
console.log('7. You should see the suggestion in a purple box at the top');
console.log('8. Approve or reject the suggestion\n');
