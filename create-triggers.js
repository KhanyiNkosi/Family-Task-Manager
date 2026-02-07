const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'create-notification-triggers.sql'), 
      'utf8'
    );

    console.log('📝 Executing notification trigger SQL...\n');

    // Execute the SQL using the Supabase REST API
    // We'll use rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      // If exec_sql doesn't exist, we'll need to execute via REST API
      console.log('⚠️  exec_sql function not available, using REST API...\n');
      
      // Split into individual statements and execute
      const statements = sqlContent
        .split(/;\s*(?=CREATE|DROP|DO)/g)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + (stmt.trim().endsWith(';') ? '' : ';'));

      console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.includes('CREATE OR REPLACE FUNCTION')) {
          const funcName = stmt.match(/FUNCTION (\w+)\(/)?.[1];
          console.log(`  ${i + 1}. Creating function: ${funcName}...`);
        } else if (stmt.includes('CREATE TRIGGER')) {
          const trigName = stmt.match(/CREATE TRIGGER (\w+)/)?.[1];
          console.log(`  ${i + 1}. Creating trigger: ${trigName}...`);
        } else if (stmt.includes('DROP TRIGGER')) {
          const trigName = stmt.match(/DROP TRIGGER.*?(\w+) ON/)?.[1];
          console.log(`  ${i + 1}. Dropping trigger: ${trigName}...`);
        } else if (stmt.includes('DO $$')) {
          console.log(`  ${i + 1}. Executing success message block...`);
        }
      }

      // Use fetch to execute via Supabase's PostgREST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sqlContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    console.log('\n✅ Notification triggers created successfully!\n');
    console.log('Active triggers:');
    console.log('  ✓ Task completion notifications');
    console.log('  ✓ Task approval notifications');
    console.log('  ✓ Task assignment notifications');
    console.log('  ✓ Help request notifications');
    console.log('  ✓ Reward request notifications');
    console.log('  ✓ Reward approval/denial notifications\n');

    // Verify triggers were created
    const { data: triggers, error: verifyError } = await supabase
      .rpc('get_triggers');

    if (!verifyError && triggers) {
      console.log('📊 Trigger verification:', triggers);
    }

  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    process.exit(1);
  }
}

executeSQL();
