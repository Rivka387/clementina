import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

it('enforces duo isolation, private weights and food diaries, ownership, invite capacity and anonymous denial in PostgreSQL', async () => {
  const db = new PGlite();
  try {
    // Minimal local Auth shim. Supabase supplies these roles and auth.uid() in production.
    await db.exec(`
   create role anon nologin;
   create role authenticated nologin;
   create schema auth;
   create table auth.users(id uuid primary key,email text);
   create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to anon,authenticated;
   grant execute on function auth.uid() to anon,authenticated;
   grant usage on schema public to anon,authenticated;
  `);
    await db.exec(
      readFileSync(new URL('../supabase/migrations/001_clementina.sql', import.meta.url), 'utf8'),
    );
    await db.exec(
      readFileSync(new URL('../supabase/migrations/002_food_entries.sql', import.meta.url), 'utf8'),
    );
    await db.exec(
      readFileSync(
        new URL('../supabase/migrations/003_optional_calories.sql', import.meta.url),
        'utf8',
      ),
    );
    await db.exec(
      readFileSync(
        new URL('../supabase/migrations/004_optional_amount.sql', import.meta.url),
        'utf8',
      ),
    );
    await db.exec(readFileSync(new URL('../supabase/tests/security.sql', import.meta.url), 'utf8'));
    const result = await db.query<{ count: number }>('select count(*)::int from public.members');
    expect(result.rows[0].count).toBe(0); // Test fixtures rolled back completely.
  } finally {
    await db.close();
  }
}, 30000);
