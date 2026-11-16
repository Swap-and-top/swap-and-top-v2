/**
 * Copies the accounts Supabase Auth holds (its `auth.users`) into our own
 * sign in tables (`auth_users`, `auth_accounts`), keeping each account's
 * id, so every person stays linked (`people.auth_user_id`), and its
 * password as Supabase hashed it (bcrypt, which accounts.ts still takes).
 *
 * Run it against the Supabase database only, where `auth.users` is:
 * `pnpm --filter @snt/api db:import-accounts`. It can be run again: accounts
 * already copied are left alone, so it picks up only those made since.
 * Another database gets its accounts by copying the two tables from here.
 */

import { sql } from './client';

async function main() {
  const users = await sql`
    insert into auth_users
      (id, name, email, email_verified, phone_number, phone_number_verified, location, created_at, updated_at)
    select
      u.id,
      coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), ''),
      coalesce(lower(nullif(u.email, '')), regexp_replace(u.phone, '\\D', '', 'g') || '@phone.swapandtop.invalid'),
      u.email_confirmed_at is not null,
      case when nullif(u.phone, '') is not null then '+' || regexp_replace(u.phone, '\\D', '', 'g') end,
      case when nullif(u.phone, '') is not null then u.phone_confirmed_at is not null end,
      nullif(trim(u.raw_user_meta_data->>'location'), ''),
      u.created_at,
      coalesce(u.updated_at, u.created_at)
    from auth.users u
    where nullif(u.email, '') is not null or nullif(u.phone, '') is not null
    on conflict do nothing
    returning id`;

  const passwords = await sql`
    insert into auth_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
    select gen_random_uuid()::text, u.id, u.id::text, 'credential', u.encrypted_password, u.created_at,
      coalesce(u.updated_at, u.created_at)
    from auth.users u
    join auth_users ours on ours.id = u.id
    where nullif(u.encrypted_password, '') is not null
      and not exists (
        select 1 from auth_accounts a where a.user_id = u.id and a.provider_id = 'credential'
      )
    returning id`;

  const [missed] = await sql<{ left: number }[]>`
    select count(*)::int as left from auth.users u
    where not exists (select 1 from auth_users ours where ours.id = u.id)`;

  console.log(`Copied ${users.length} accounts and ${passwords.length} passwords. Not copied: ${missed?.left ?? 0}.`);
  await sql.end();
}

void main();
