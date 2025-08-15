#!/usr/bin/env node

/**
 * Setup script to create admin_users table in Supabase
 * Run this with: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🗄️ Setting up database for admin frontend...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '***' + supabaseServiceKey.slice(-4) : 'NOT SET');
  console.error('\n📝 Please create a .env.local file with your Supabase credentials');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🔧 Testing Supabase connection...');
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful\n');
    
    // Check if admin_users table exists
    console.log('🔍 Checking if admin_users table exists...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('relation "admin_users" does not exist')) {
        console.log('❌ admin_users table does not exist');
        console.log('📋 You need to create it manually in your Supabase SQL editor');
        console.log('\n📝 Copy and paste this SQL into your Supabase SQL editor:');
        console.log('─'.repeat(60));
        
        const createTableSQL = `
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view their own record" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage admin users" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role;
        `;
        
        console.log(createTableSQL);
        console.log('─'.repeat(60));
        console.log('\n💡 After running the SQL:');
        console.log('   1. Go to /admin/signup to create your first admin account');
        console.log('   2. Or use the create-admin-user.js script');
        
      } else {
        throw new Error(`Table check failed: ${tableError.message}`);
      }
    } else {
      console.log('✅ admin_users table exists and is accessible');
      console.log('   You can now use /admin/signup to create admin accounts');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
