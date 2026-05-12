import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  process.env[match[1].trim()] ??= match[2].trim().replace(/^"|"$/g, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

for (const email of ["admin@kirsof.com", "farmer@kirsof.com", "consumer@kirsof.com"]) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: "Password123!",
  });

  console.log(JSON.stringify({
    email,
    ok: Boolean(data.user),
    error: error?.message ?? null,
  }));

  await supabase.auth.signOut();
}
