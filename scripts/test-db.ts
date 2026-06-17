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
}

main()
  .catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
