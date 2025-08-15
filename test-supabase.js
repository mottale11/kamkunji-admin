// Simple Supabase connection test
// Run this with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'NOT SET');
  console.error('\n📝 Please create a .env.local file with your Supabase credentials');
  process.exit(1);
}

console.log('✅ Environment variables found:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', '***' + supabaseAnonKey.slice(-4));
console.log('');

// Test 1: Create client
console.log('🔧 Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Client created successfully\n');

// Test 2: Test connection
console.log('🌐 Testing connection...');
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.error('\n🔑 This means your VITE_SUPABASE_ANON_KEY is incorrect');
      console.error('   Please check your Supabase dashboard → Settings → API → anon public key');
    } else if (error.message.includes('fetch')) {
      console.error('\n🌐 This means your VITE_SUPABASE_URL is incorrect');
      console.error('   Please check your Supabase dashboard → Settings → API → Project URL');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Connection test successful');
    console.log('   Session:', data.session ? 'Active' : 'None');
  }
  
  // Test 3: Test database access
  console.log('\n🗄️ Testing database access...');
  supabase.from('admin_users').select('count').then(({ data: dbData, error: dbError }) => {
    if (dbError) {
      console.error('❌ Database access failed:', dbError.message);
      
      if (dbError.message.includes('relation "admin_users" does not exist')) {
        console.error('\n📋 The admin_users table does not exist');
        console.error('   Please run the SQL script from scripts/setup-admin-table.sql in your Supabase SQL editor');
      } else if (dbError.message.includes('permission denied')) {
        console.error('\n🔒 Permission denied - check your RLS policies');
      }
    } else {
      console.log('✅ Database access successful');
      console.log('   admin_users table accessible');
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n💡 If you see any errors above, fix them before trying to log in');
  });
});
