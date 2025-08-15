// Environment configuration for admin frontend
// Copy this to .env.local and fill in your actual values

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'your_supabase_project_url',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  },
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  }
};

// Enhanced environment variable validation
export function validateEnvironment() {
  const issues = [];
  
  if (!config.supabase.url || config.supabase.url === 'your_supabase_project_url') {
    issues.push('VITE_SUPABASE_URL is not set or using placeholder value');
  }
  
  if (!config.supabase.anonKey || config.supabase.anonKey === 'your_supabase_anon_key') {
    issues.push('VITE_SUPABASE_ANON_KEY is not set or using placeholder value');
  }
  
  if (issues.length > 0) {
    console.error('❌ Environment Configuration Issues:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    console.error('\n📝 To fix this:');
    console.error('   1. Create a .env.local file in the admin-frontend directory');
    console.error('   2. Add your Supabase credentials:');
    console.error('      VITE_SUPABASE_URL=https://your-project-id.supabase.co');
    console.error('      VITE_SUPABASE_ANON_KEY=your-actual-anon-key');
    console.error('   3. Restart the development server');
    console.error('\n🔑 Get your credentials from:');
    console.error('   https://supabase.com/dashboard → Your Project → Settings → API');
    
    return false;
  }
  
  return true;
}

// Check environment on import
validateEnvironment();
