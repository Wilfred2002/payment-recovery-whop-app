import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env file
const envFile = readFileSync('.env.development.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
	const match = line.match(/^([^=]+)=(.*)$/);
	if (match) {
		envVars[match[1]] = match[2];
	}
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase credentials in environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Supabase tables...\n');

// Check failed_payments table
console.log('📋 Checking failed_payments table...');
const { data: failedPayments, error: failedError } = await supabase
	.from('failed_payments')
	.select('*')
	.limit(1);

if (failedError) {
	console.error('❌ failed_payments table NOT FOUND or has errors:', failedError.message);
} else {
	console.log('✅ failed_payments table EXISTS');
	console.log(`   Sample count check: ${failedPayments ? failedPayments.length : 0} rows (limited to 1)`);
}

// Check creator_settings table
console.log('\n📋 Checking creator_settings table...');
const { data: settings, error: settingsError } = await supabase
	.from('creator_settings')
	.select('*')
	.limit(1);

if (settingsError) {
	console.error('❌ creator_settings table NOT FOUND or has errors:', settingsError.message);
} else {
	console.log('✅ creator_settings table EXISTS');
	console.log(`   Sample count check: ${settings ? settings.length : 0} rows (limited to 1)`);
}

console.log('\n✅ Table check complete!');
