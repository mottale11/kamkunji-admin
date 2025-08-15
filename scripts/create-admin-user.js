#!/usr/bin/env node

/**
 * Script to create an admin user in Supabase
 * Usage: node scripts/create-admin-user.js <email> <password>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('\nPlease create a .env.local file with your Supabase credentials');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser(email, password) {
  try {
    console.log(`🔐 Creating admin user: ${email}`);
    
    // Step 1: Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log(`✅ User created with ID: ${userId}`);

    // Step 2: Add to admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        role: 'admin',
        permissions: {
          can_manage_products: true,
          can_manage_orders: true,
          can_manage_users: true,
          can_manage_categories: true,
          can_view_analytics: true
        }
      })
      .select()
      .single();

    if (adminError) {
      // Clean up the created user if admin creation fails
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create admin record: ${adminError.message}`);
    }

    console.log(`✅ Admin user created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\n💡 You can now log in to the admin portal at /admin/login`);

  } catch (error) {
    console.error(`❌ Error creating admin user: ${error.message}`);
    process.exit(1);
  }
}

// Get command line arguments
const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('❌ Usage: node scripts/create-admin-user.js <email> <password>');
  console.error('\nExample:');
  console.error('  node scripts/create-admin-user.js admin@kamkunjindogo.com mySecurePassword123');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters long');
  process.exit(1);
}

createAdminUser(email, password);
