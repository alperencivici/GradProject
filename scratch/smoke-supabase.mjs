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

const [profiles, products] = await Promise.all([
  supabase.from("profiles").select("id,full_name,role,address,location_lat,location_lng").order("role"),
  supabase.from("products").select("id,name,category,price,stock_quantity"),
]);

if (profiles.error) throw profiles.error;
if (products.error) throw products.error;

console.log(JSON.stringify({
  profiles: profiles.data.length,
  products: products.data.length,
  roles: profiles.data.map((profile) => profile.role).sort(),
}));
