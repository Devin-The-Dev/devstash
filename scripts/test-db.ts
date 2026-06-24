import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  const itemTypes = await prisma.itemType.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`✓ Connected. Found ${itemTypes.length} system item types:\n`);
  for (const t of itemTypes) {
    console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(12)} ${t.color}`);
  }

  const userCount = await prisma.user.count();
  const itemCount = await prisma.item.count();
  const collectionCount = await prisma.collection.count();

  console.log("\nRow counts:");
  console.log(`  Users:       ${userCount}`);
  console.log(`  Items:       ${itemCount}`);
  console.log(`  Collections: ${collectionCount}`);

  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    include: {
      collections: {
        orderBy: { name: "asc" },
        include: {
          items: {
            include: { item: { include: { type: true } } },
          },
        },
      },
    },
  });

  if (!demoUser) {
    console.log("\n✗ Demo user not found. Run `npm run db:seed` first.");
    return;
  }

  console.log(`\nDemo user: ${demoUser.name} <${demoUser.email}>\n`);
  for (const collection of demoUser.collections) {
    console.log(`${collection.name} (${collection.items.length} items)`);
    for (const { item } of collection.items) {
      const detail = item.url ?? item.content?.split("\n")[0] ?? "";
      console.log(`  [${item.type.name.padEnd(8)}] ${item.title.padEnd(36)} ${detail}`);
    }
    console.log("");
  }
}

main()
  .catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
