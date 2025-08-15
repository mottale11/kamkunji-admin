import { createClient } from '@supabase/supabase-js';

// Direct environment variable access for better debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Configuration Check:');
console.log('   VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'NOT SET');

// Better error handling and debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration error:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl);
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'NOT SET');
  console.error('\n📝 Please create a .env.local file with your Supabase credentials');
  throw new Error('Missing Supabase environment variables. Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

if (supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ Supabase configuration error:');
  console.error('   You are using placeholder values. Please update .env.local with your actual Supabase credentials');
  throw new Error('Please update .env.local with your actual Supabase credentials from your Supabase dashboard');
}

// Validate URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format. Expected: https://your-project-id.supabase.co');
  throw new Error('Invalid Supabase URL format');
}

// Validate key format (anon keys are typically 48 characters)
if (supabaseAnonKey.length < 40) {
  console.error('❌ Invalid Supabase anon key format. Key seems too short.');
  throw new Error('Invalid Supabase anon key format');
}

console.log('✅ Supabase configuration loaded successfully');
console.log('   URL:', supabaseUrl);
console.log('   Key:', '***' + supabaseAnonKey.slice(-4));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('   This usually means your VITE_SUPABASE_ANON_KEY is incorrect');
      console.error('   Please check your Supabase dashboard → Settings → API → anon public key');
    }
  } else {
    console.log('✅ Supabase connection test successful');
  }
});

// Database schema constants
export const TABLES = {
  USERS: 'users',
  ADMIN_USERS: 'admin_users',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  ITEM_SUBMISSIONS: 'item_submissions',
  CART_ITEMS: 'cart_items',
};
