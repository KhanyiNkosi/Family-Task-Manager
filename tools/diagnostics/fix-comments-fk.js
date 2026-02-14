require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixForeignKey() {
  console.log('🔧 Fixing activity_comments foreign key...\n');
  
  // Check existing foreign keys
  console.log('📊 Checking existing foreign keys...');
  const { data: existingFks, error: fkCheckError } = await supabase.rpc('exec_raw_sql', {
    sql: `
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name='activity_comments' 
        AND constraint_type='FOREIGN KEY';
    `
  }).catch(() => ({ data: null, error: 'RPC not available' }));
  
  if (existingFks) {
    console.log('Existing FKs:', existingFks);
  }
  
  // Drop and recreate the foreign key
  console.log('\n🔨 Dropping existing constraint if exists...');
  const { error: dropError } = await supabase.rpc('exec_raw_sql', {
    sql: 'ALTER TABLE activity_comments DROP CONSTRAINT IF EXISTS activity_comments_user_id_fkey;'
  }).catch(async () => {
    // Try direct query if RPC doesn't exist
    return await supabase.from('_sql').insert({ 
      query: 'ALTER TABLE activity_comments DROP CONSTRAINT IF EXISTS activity_comments_user_id_fkey;' 
    });
  });
  
  if (dropError) {
    console.log('Note: Could not drop via RPC, will try raw query');
  }
  
  console.log('➕ Adding foreign key constraint...');
  const { error: addError } = await supabase.rpc('exec_raw_sql', {
    sql: `
      ALTER TABLE activity_comments 
      ADD CONSTRAINT activity_comments_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
    `
  }).catch(async () => {
    // Try direct query if RPC doesn't exist
    return await supabase.from('_sql').insert({ 
      query: `
        ALTER TABLE activity_comments 
        ADD CONSTRAINT activity_comments_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
      ` 
    });
  });
  
  if (addError) {
    console.log('❌ Error adding FK:', addError);
    console.log('\n⚠️  RPC functions not available. Please run this SQL manually in Supabase SQL Editor:');
    console.log(`
ALTER TABLE activity_comments 
DROP CONSTRAINT IF EXISTS activity_comments_user_id_fkey;

ALTER TABLE activity_comments 
ADD CONSTRAINT activity_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;
    `);
  } else {
    console.log('✅ Foreign key added successfully!');
    
    // Test the join now
    console.log('\n🧪 Testing comment join...');
    const { data: testJoin, error: joinError } = await supabase
      .from('activity_comments')
      .select(`
        *,
        profiles!activity_comments_user_id_fkey(full_name)
      `)
      .limit(1);
    
    if (joinError) {
      console.log('❌ Join still failing:', joinError);
    } else {
      console.log('✅ Join working!', JSON.stringify(testJoin, null, 2));
    }
  }
}

fixForeignKey().catch(console.error);
