import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log('\n========================================');
console.log(' SUPABASE CONNECTION DIAGNOSTIC CHECK');
console.log('========================================\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found in project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const clean = line.trim();
  if (clean && !clean.startsWith('#')) {
    const idx = clean.indexOf('=');
    if (idx !== -1) {
      const key = clean.substring(0, idx).trim();
      const val = clean.substring(idx + 1).trim();
      env[key] = val;
    }
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('1. Checking Environment Variables:');
console.log(`   • URL:  ${url ? (url.includes('placeholder') ? '⚠️  ' + url + ' (PLACEHOLDER DETECTED)' : '✔ ' + url) : '❌ Missing'}`);
console.log(`   • Key:  ${key ? (key.includes('placeholder') ? '⚠️  Placeholder key' : '✔ Configured (' + key.substring(0, 16) + '...)') : '❌ Missing'}`);

if (!url || url.includes('placeholder-project')) {
  console.log('\n❌ DIAGNOSIS:');
  console.log('   You have added your Supabase Anon/Publishable Key, but your NEXT_PUBLIC_SUPABASE_URL');
  console.log('   is still set to the placeholder URL (https://placeholder-project.supabase.co).\n');
  console.log('👉 ACTION REQUIRED:');
  console.log('   1. Open your Supabase Dashboard (https://supabase.com/dashboard).');
  console.log('   2. Select your project -> Go to Project Settings -> API.');
  console.log('   3. Copy your "Project URL" (e.g. https://xyzabcdefghijklm.supabase.co).');
  console.log('   4. Open .env.local and replace the placeholder with your Project URL:');
  console.log('      NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co\n');
  process.exit(0);
}

console.log('\n2. Testing Connection to Supabase REST Endpoint...');

try {
  const restUrl = `${url.replace(/\/$/, '')}/rest/v1/partner_agencies?select=count`;
  const response = await fetch(restUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  const text = await response.text();
  console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
  console.log(`   Raw response: ${text}\n`);

  if (response.ok) {
    console.log('✔ Successfully connected to live Supabase database!');
    console.log('✔ "partner_agencies" table exists and is accessible!\n');
    console.log('🎉 System is fully connected to live Supabase PostgreSQL.\n');
  } else if (response.status === 404 || text.includes('42P01') || text.includes('does not exist')) {
    console.log('👉 Table "partner_agencies" does NOT exist in your Supabase project.');
    console.log('   The schema.sql has not been applied (or ran against the wrong project).');
    console.log('\n   FIX:');
    console.log('   1. Go to https://supabase.com/dashboard -> select project nkjhqrqzjcbqlyywhxoj');
    console.log('   2. Click "SQL Editor" in the left sidebar.');
    console.log('   3. Click "+ New query", paste ALL of supabase/schema.sql, click RUN.');
    console.log('   4. Then paste ALL of supabase/seed.sql, click RUN.');
    console.log('   5. Run this script again.\n');
  } else if (response.status === 401 || response.status === 403) {
    console.log('👉 Auth error — anon key invalid or RLS is blocking reads.');
    console.log('   Check Dashboard -> Authentication -> Policies.\n');
  }
} catch (err) {
  console.error('❌ Network connection failed:', err.message);
}

