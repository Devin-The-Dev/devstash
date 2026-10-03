import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { execSync } from "node:child_process";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "demo@devstash.io";

// Deletes every user except the demo user (their accounts, sessions, items,
// collections, tags and custom types cascade), resets the demo user's content,
// then re-runs the seed so the demo user starts from a clean slate.
async function main() {
  const { count: usersDeleted } = await prisma.user.deleteMany({
    where: { email: { not: DEMO_USER_EMAIL } },
  });
  console.log(`Deleted ${usersDeleted} non-demo users.`);

  const demo = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (demo) {
    // Join rows (ItemCollection, ItemTag) cascade from these.
    const items = await prisma.item.deleteMany({ where: { userId: demo.id } });
    const collections = await prisma.collection.deleteMany({ where: { userId: demo.id } });
    console.log(
      `Reset demo user content: removed ${items.count} items and ${collections.count} collections.`,
    );
  }

  await prisma.$disconnect();

  console.log("Seeding demo user content...");
  execSync("npx prisma db seed", { stdio: "inherit" });
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
