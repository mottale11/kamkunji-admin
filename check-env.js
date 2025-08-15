// Check if environment variables are loaded
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking Environment Variables...\n');

// Try to load .env.local
const envPath = path.join(__dirname, '.env.local');
console.log('📁 Looking for .env.local at:', envPath);

try {
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error('❌ Error loading .env.local:', result.error.message);
  } else {
    console.log('✅ .env.local loaded successfully');
  }
} catch (error) {
  console.error('❌ Failed to load .env.local:', error.message);
}

console.log('\n📋 Environment Variables:');
console.log('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NOT SET');
console.log('   VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 
  '***' + process.env.VITE_SUPABASE_ANON_KEY.slice(-4) : 'NOT SET');

console.log('\n🔍 File System Check:');
import fs from 'fs';

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('   File size:', content.length, 'characters');
  console.log('   First line:', content.split('\n')[0]);
} else {
  console.error('❌ .env.local file does not exist');
}

console.log('\n💡 If variables show as "NOT SET", check:');
console.log('   1. File name is exactly .env.local (not .env.local.txt)');
console.log('   2. File is in the admin-frontend directory');
console.log('   3. No extra spaces around = signs');
console.log('   4. File encoding is UTF-8');
