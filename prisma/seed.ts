import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// System types use stable IDs so the seed is always idempotent.
// userId is null for system types (shared across all users).
const SYSTEM_ITEM_TYPES = [
  { id: "system-snippet", name: "Snippet", icon: "Code", color: "#3b82f6" },
  { id: "system-prompt", name: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "system-command", name: "Command", icon: "Terminal", color: "#f97316" },
  { id: "system-note", name: "Note", icon: "StickyNote", color: "#fde047" },
  { id: "system-link", name: "Link", icon: "Link", color: "#10b981" },
  { id: "system-file", name: "File", icon: "File", color: "#6b7280" },
  { id: "system-image", name: "Image", icon: "Image", color: "#ec4899" },
] as const;

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: type.id },
      update: { name: type.name, icon: type.icon, color: type.color },
      create: { ...type, isSystem: true },
    });
  }

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
