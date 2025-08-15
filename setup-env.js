#!/usr/bin/env node

/**
 * Setup script to create .env.local file
 * Run this with: node setup-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up environment variables for admin frontend...\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('📁 .env.local file already exists');
  const content = fs.readFileSync(envPath, 'utf8');
  
  if (content.includes('your_supabase_project_url') || content.includes('your_supabase_anon_key')) {
    console.log('⚠️  File contains placeholder values - needs to be updated');
  } else {
    console.log('✅ File appears to have real values');
  }
  
  console.log('\nCurrent content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
} else {
  console.log('📁 .env.local file does not exist - creating template...');
}

// Create template content
const template = `# Supabase Configuration
# Replace these placeholder values with your actual Supabase credentials

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Optional: API Configuration (if still using backend)
VITE_API_URL=http://localhost:5000
`;

// Write template
fs.writeFileSync(envPath, template);

console.log('\n📝 Template .env.local file created/updated!');
console.log('\n🔑 Next steps:');
console.log('   1. Go to https://supabase.com/dashboard');
console.log('   2. Select your project');
console.log('   3. Go to Settings → API');
console.log('   4. Copy the Project URL and anon public key');
console.log('   5. Update the values in .env.local');
console.log('   6. Restart your development server');
console.log('\n📁 File location:', envPath);

// Show the file content
console.log('\n📋 File content:');
console.log('─'.repeat(50));
console.log(template);
console.log('─'.repeat(50));

console.log('\n💡 Remember:');
console.log('   - Use the anon public key (not service role key)');
console.log('   - No quotes around values');
console.log('   - No spaces around = signs');
console.log('   - Restart server after updating');
