/**
 * Script to apply SQL migration to Supabase
 * Usage: node scripts/apply-migration.js <migration-file-path>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationPath) {
  try {
    console.log(`📄 Reading migration file: ${migrationPath}`);

    // Read SQL file
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`📝 Migration content preview (first 200 chars):`);
    console.log(sql.substring(0, 200) + '...\n');

    console.log('🚀 Applying migration to Supabase...');

    // Execute SQL using Supabase RPC (we'll need to use raw query)
    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to use the REST API

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Tip: You may need to apply this migration manually via Supabase Dashboard:');
    console.error(`   1. Go to https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([^.]+)/)[1]}/sql/new`);
    console.error(`   2. Paste the SQL from: ${migrationPath}`);
    console.error('   3. Click "Run"');
    process.exit(1);
  }
}

// Get migration file path from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/apply-migration.js <migration-file-path>');
  console.error('Example: node scripts/apply-migration.js supabase/migrations/20250130_update_aitunnel_models.sql');
  process.exit(1);
}

// Resolve absolute path
const absolutePath = path.resolve(process.cwd(), migrationFile);

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Migration file not found: ${absolutePath}`);
  process.exit(1);
}

applyMigration(absolutePath);
