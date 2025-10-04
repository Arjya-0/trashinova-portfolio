// Simple environment variable checker for Firebase config.
// Load .env when invoked directly via Node (build/dev scripts)
import 'dotenv/config';
// Fails fast during dev/build if required vars are missing.
const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Support running directly with Node (process.env) and Vite (import.meta.env at runtime)
const missing = [];
for (const key of REQUIRED_KEYS) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length) {
  console.error('\n❌ Missing required Firebase environment variables:');
  for (const m of missing) console.error('  - ' + m);
  console.error('\nAdd them to your .env file (see .env.example) and re-run.');
  process.exit(1);
} else {
  console.log('✅ Firebase environment variables present.');
}
