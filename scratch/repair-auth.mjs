import pg from "pg";

const { Client } = pg;
const dbUrl = process.env.DB_URL;
if (!dbUrl) throw new Error("DB_URL is required");

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`
  update auth.users
  set
    raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    updated_at = now()
  where email in ('admin@kirsof.com', 'farmer@kirsof.com', 'consumer@kirsof.com');
`);

await client.query(`
  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    id,
    id::text,
    id,
    jsonb_build_object(
      'sub', id::text,
      'email', email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  from auth.users
  where email in ('admin@kirsof.com', 'farmer@kirsof.com', 'consumer@kirsof.com')
  on conflict (provider, provider_id) do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();
`);

await client.query("notify pgrst, 'reload schema';");

console.log("Auth rows repaired.");

await client.end();
