#!/usr/bin/env node

/**
 * Quick check of tasks table structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasksStructure() {
  console.log('\n📋 TASKS TABLE STRUCTURE CHECK\n');

  // Try different possible column names
  const tests = [
    { col: 'status', name: 'status' },
    { col: 'task_status', name: 'task_status' },
    { col: 'completed', name: 'completed (boolean)' },
    { col: 'approved', name: 'approved (boolean)' },
  ];

  for (const test of tests) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(test.col)
        .limit(1);
      
      if (!error) {
        console.log(`✅ Column "${test.name}" EXISTS`);
      } else if (error.code === '42703') {
        console.log(`❌ Column "${test.name}" DOES NOT EXIST`);
      } else {
        console.log(`⚠️  Column "${test.name}": ${error.message}`);
      }
    } catch (err) {
      console.log(`⚠️  Column "${test.name}": ${err.message}`);
    }
  }

  // Get first task to see its structure
  console.log('\n📝 Sample task structure:');
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);
  
  if (!error && tasks && tasks.length > 0) {
    console.log(JSON.stringify(tasks[0], null, 2));
  } else {
    console.log('No tasks found or error:', error?.message);
  }
}

checkTasksStructure().catch(console.error);
