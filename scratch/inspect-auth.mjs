import pg from "pg";

const { Client } = pg;
const dbUrl = process.env.DB_URL;
if (!dbUrl) throw new Error("DB_URL is required");

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const users = await client.query(`
  select
    id,
    email,
    confirmation_token is null as confirmation_token_null,
    email_change is null as email_change_null,
    email_change_token_new is null as email_change_token_new_null,
    recovery_token is null as recovery_token_null,
    raw_app_meta_data
  from auth.users
  order by email
`);

const identityColumns = await client.query(`
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'auth'
    and table_name = 'identities'
  order by ordinal_position
`);

const identities = await client.query(`
  select id, user_id, provider, provider_id
  from auth.identities
  order by provider, user_id
`);

console.log(JSON.stringify({
  users: users.rows,
  identityColumns: identityColumns.rows,
  identities: identities.rows,
}, null, 2));

await client.end();
