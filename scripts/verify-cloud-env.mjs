// Never print keys; this runs in the public deployment build log.
const rawUrl = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
function fail(message) {
  console.error(`Cloud configuration error: ${message}`);
  process.exit(1);
}
if (!rawUrl || !key) {
  fail('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Netlify before deploying.');
}
let url;
try { url = new URL(rawUrl); } catch { fail('VITE_SUPABASE_URL must be an HTTPS project URL.'); }
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
  fail('Use the HTTPS Supabase project URL, without credentials or paths. A PostgreSQL connection string is not supported.');
}
if (key.startsWith('sb_secret_')) fail('A secret key must never be used in a browser build. Use a publishable key.');
if (!key.startsWith('sb_publishable_')) {
  let claims;
  try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')); } catch {
    fail('Use a publishable key beginning with sb_publishable_, or a legacy anon key.');
  }
  if (claims?.role !== 'anon') fail('Only publishable or legacy anon keys are allowed in a browser build.');
}
console.log('Cloud configuration format verified. Build will use Supabase authentication.');
