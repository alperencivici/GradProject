import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  console.error("DB_URL is required.");
  process.exit(1);
}

const migrationSql = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260501000000_fresh_schema.sql"),
  "utf8",
);
const seedSql = fs.readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");

const resetSql = `
drop policy if exists "Public can view images" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Authenticated users can update images" on storage.objects;
drop trigger if exists on_auth_user_created on auth.users;
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
`;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("Connecting to hosted Supabase Postgres...");
  await client.connect();
  console.log("Connected. Resetting public schema...");
  await client.query(resetSql);
  console.log("Applying fresh migration...");
  await client.query(migrationSql);
  console.log("Seeding fresh data...");
  await client.query(seedSql);
  console.log("Reloading PostgREST schema cache...");
  await client.query("notify pgrst, 'reload schema';");
  console.log("Remote database reset complete.");
} finally {
  await client.end();
}
