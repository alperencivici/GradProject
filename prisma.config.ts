import fs from "node:fs";
import { defineConfig, env } from "prisma/config";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;

  const [, key, rawValue] = match;
  process.env[key.trim()] ??= rawValue.trim().replace(/^"|"$/g, "");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
