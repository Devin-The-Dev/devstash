import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI runs outside Next.js, so env vars must be loaded manually.
// .env.local is gitignored and holds real credentials; .env holds safe defaults.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // CLI uses the direct (non-pooled) connection for migrations & introspection.
  // Falls back to DATABASE_URL when DIRECT_URL is not set.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
