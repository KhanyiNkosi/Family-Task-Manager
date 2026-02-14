require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkComments() {
  console.log('🔍 Checking activity_comments table...\n');
  
  // Check if there are any comments
  const { data: comments, error } = await supabase
    .from('activity_comments')
    .select('*')
    .limit(10);
  
  if (error) {
    console.log('❌ Error loading comments:', error);
  } else {
    console.log(`📊 Total comments found: ${comments?.length || 0}`);
    if (comments && comments.length > 0) {
      console.log('Sample comments:', JSON.stringify(comments, null, 2));
    }
  }
  
  // Try to read comments with join like the frontend does
  console.log('\n🔗 Testing comment join with profiles...');
  const { data: commentsWithJoin, error: joinError } = await supabase
    .from('activity_comments')
    .select(`
      *,
      profiles!activity_comments_user_id_fkey(full_name)
    `)
    .eq('activity_id', '532b10aa-e7a7-4917-bcb5-487c7ea1db53')
    .order('created_at', { ascending: true });
  
  if (joinError) {
    console.log('❌ Error with join:', joinError);
  } else {
    console.log('✅ Join successful:', JSON.stringify(commentsWithJoin, null, 2));
  }
  
  // Try to add a test comment
  console.log('\n🧪 Attempting to add a test comment...');
  const { data: activities } = await supabase
    .from('activity_feed')
    .select('id')
    .limit(1)
    .single();
  
  if (activities) {
    const { data: newComment, error: insertError } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activities.id,
        user_id: '17eb2a70-6fef-4f01-8303-03883c92e705', // Lwandle
        comment_text: 'Test comment from diagnostic'
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Error inserting test comment:', insertError);
    } else {
      console.log('✅ Test comment added successfully:', newComment);
      
      // Now try to read it back with the join
      const { data: readBack, error: readError } = await supabase
        .from('activity_comments')
        .select(`
          *,
          profiles!activity_comments_user_id_fkey(full_name)
        `)
        .eq('id', newComment.id)
        .single();
      
      if (readError) {
        console.log('❌ Error reading comment with join:', readError);
      } else {
        console.log('✅ Comment read back with join:', JSON.stringify(readBack, null, 2));
      }
    }
  }
}

checkComments().catch(console.error);
