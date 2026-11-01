import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe,expect,it } from 'vitest';
const script=fileURLToPath(new URL('../scripts/verify-cloud-env.mjs',import.meta.url));
const testUrl='https://example-project.supabase.co';
const fixtureKey='sb_publishable_test_fixture_not_a_real_key';
function run(url:string,key:string) {
 return spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:key}});
}
describe('cloud deployment configuration',()=>{
 it('does not deploy demo mode when cloud configuration is missing',()=>{
  expect(run(testUrl,'').status).toBe(1);expect(run('',fixtureKey).status).toBe(1);
 });
 it('rejects PostgreSQL credentials without exposing them in logs',()=>{
  const r=run('postgresql://postgres:fixture_password@db.example.supabase.co/postgres',fixtureKey);
  expect(r.status).toBe(1);expect(r.stderr).not.toContain('fixture_password');
 });
 it('rejects both modern and legacy elevated keys',()=>{
  const secret='sb_secret_test_fixture';
  const legacy='header.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature';
  for(const key of [secret,legacy]){const r=run(testUrl,key);expect(r.status).toBe(1);expect(r.stderr).not.toContain(key);}
 });
 it('accepts public key formats without claiming the backend was contacted',()=>{
  const legacy='header.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';
  for(const key of [fixtureKey,legacy]){const r=run(testUrl,key);expect(r.status).toBe(0);expect(r.stdout).toContain('format verified');expect(r.stdout).not.toContain(key);}
 });
});
