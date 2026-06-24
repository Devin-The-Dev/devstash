import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

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

const DEMO_USER_ID = "demo-user";
const DEMO_USER_EMAIL = "demo@devstash.io";

async function seedDemoUser() {
  const hashedPassword = await bcrypt.hash("12345678", 12);

  return prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });
}

async function seedCollection(
  id: string,
  userId: string,
  name: string,
  description: string,
) {
  return prisma.collection.upsert({
    where: { id },
    update: { name, description },
    create: { id, userId, name, description },
  });
}

async function seedItem(
  id: string,
  userId: string,
  typeId: string,
  collectionId: string,
  data: Omit<Prisma.ItemUncheckedCreateInput, "id" | "userId" | "typeId">,
) {
  await prisma.item.upsert({
    where: { id },
    update: { ...data },
    create: { id, userId, typeId, ...data },
  });

  await prisma.itemCollection.upsert({
    where: { itemId_collectionId: { itemId: id, collectionId } },
    update: {},
    create: { itemId: id, collectionId },
  });
}

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: type.id },
      update: { name: type.name, icon: type.icon, color: type.color },
      create: { ...type, isSystem: true },
    });
  }

  const user = await seedDemoUser();

  const collections = {
    reactPatterns: await seedCollection(
      "collection-react-patterns",
      user.id,
      "React Patterns",
      "Reusable React patterns and hooks",
    ),
    aiWorkflows: await seedCollection(
      "collection-ai-workflows",
      user.id,
      "AI Workflows",
      "AI prompts and workflow automations",
    ),
    devOps: await seedCollection(
      "collection-devops",
      user.id,
      "DevOps",
      "Infrastructure and deployment resources",
    ),
    terminalCommands: await seedCollection(
      "collection-terminal-commands",
      user.id,
      "Terminal Commands",
      "Useful shell commands for everyday development",
    ),
    designResources: await seedCollection(
      "collection-design-resources",
      user.id,
      "Design Resources",
      "UI/UX resources and references",
    ),
  };

  // ─── React Patterns (3 snippets) ───────────────────────────────────────────

  await seedItem(
    "item-use-debounce",
    user.id,
    "system-snippet",
    collections.reactPatterns.id,
    {
      title: "useDebounce hook",
      description: "Debounce a fast-changing value by a delay",
      contentType: "TEXT",
      language: "typescript",
      content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}`,
    },
  );

  await seedItem(
    "item-use-local-storage",
    user.id,
    "system-snippet",
    collections.reactPatterns.id,
    {
      title: "useLocalStorage hook",
      description: "Sync state with localStorage",
      contentType: "TEXT",
      language: "typescript",
      content: `import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
    },
  );

  await seedItem(
    "item-compound-component",
    user.id,
    "system-snippet",
    collections.reactPatterns.id,
    {
      title: "Compound component context provider",
      description: "Share implicit state between related components",
      contentType: "TEXT",
      language: "typescript",
      content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabsContext.Provider>
  );
}

export function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabsContext must be used within <Tabs>");
  return ctx;
}`,
    },
  );

  // ─── AI Workflows (3 prompts) ───────────────────────────────────────────────

  await seedItem(
    "item-prompt-code-review",
    user.id,
    "system-prompt",
    collections.aiWorkflows.id,
    {
      title: "Code review prompt",
      description: "Ask the model to review a diff for bugs and clarity",
      contentType: "TEXT",
      content: `Review the following diff for correctness bugs, edge cases, and readability issues. For each finding, cite the file and line, explain why it's a problem, and suggest a fix. Do not comment on style preferences that don't affect correctness or maintainability.

Diff:
{{diff}}`,
    },
  );

  await seedItem(
    "item-prompt-doc-gen",
    user.id,
    "system-prompt",
    collections.aiWorkflows.id,
    {
      title: "Documentation generation prompt",
      description: "Generate API documentation from source code",
      contentType: "TEXT",
      content: `Generate concise API documentation for the following module. For each exported function, include: a one-line summary, parameter types and descriptions, return type, and one usage example. Skip internal/unexported members.

Source:
{{source}}`,
    },
  );

  await seedItem(
    "item-prompt-refactor",
    user.id,
    "system-prompt",
    collections.aiWorkflows.id,
    {
      title: "Refactoring assistance prompt",
      description: "Get refactor suggestions without changing behavior",
      contentType: "TEXT",
      content: `Suggest refactors for the following code that improve readability and reduce duplication without changing its observable behavior. List each suggestion separately with a brief rationale, then provide the refactored code.

Code:
{{code}}`,
    },
  );

  // ─── DevOps (1 snippet, 1 command, 2 links) ────────────────────────────────

  await seedItem(
    "item-docker-compose",
    user.id,
    "system-snippet",
    collections.devOps.id,
    {
      title: "Docker Compose for Postgres + app",
      description: "Local dev stack with Postgres and the app container",
      contentType: "TEXT",
      language: "yaml",
      content: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data

  app:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app
    ports:
      - "3000:3000"

volumes:
  db-data:`,
    },
  );

  await seedItem(
    "item-deploy-script",
    user.id,
    "system-command",
    collections.devOps.id,
    {
      title: "Deploy to production",
      description: "Build, migrate, and restart the production service",
      contentType: "TEXT",
      language: "bash",
      content:
        "npm run build && npx prisma migrate deploy && pm2 restart app",
    },
  );

  await seedItem("item-link-docker-docs", user.id, "system-link", collections.devOps.id, {
    title: "Docker Compose documentation",
    description: "Official Docker Compose file reference",
    contentType: "URL",
    url: "https://docs.docker.com/compose/compose-file/",
  });

  await seedItem("item-link-prisma-deploy", user.id, "system-link", collections.devOps.id, {
    title: "Prisma deployment guide",
    description: "Deploying database changes with Prisma Migrate",
    contentType: "URL",
    url: "https://www.prisma.io/docs/orm/prisma-migrate/workflows/deploying-to-production",
  });

  // ─── Terminal Commands (4 commands) ────────────────────────────────────────

  await seedItem(
    "item-cmd-git-rebase",
    user.id,
    "system-command",
    collections.terminalCommands.id,
    {
      title: "Interactive rebase last N commits",
      description: "Squash/reword/reorder recent commits",
      contentType: "TEXT",
      language: "bash",
      content: "git rebase -i HEAD~5",
    },
  );

  await seedItem(
    "item-cmd-docker-cleanup",
    user.id,
    "system-command",
    collections.terminalCommands.id,
    {
      title: "Clean up dangling Docker resources",
      description: "Remove stopped containers, unused networks, and dangling images",
      contentType: "TEXT",
      language: "bash",
      content: "docker system prune -af --volumes",
    },
  );

  await seedItem(
    "item-cmd-find-port",
    user.id,
    "system-command",
    collections.terminalCommands.id,
    {
      title: "Find process using a port",
      description: "Find and optionally kill the process bound to a TCP port",
      contentType: "TEXT",
      language: "bash",
      content: "lsof -i :3000",
    },
  );

  await seedItem(
    "item-cmd-npm-outdated",
    user.id,
    "system-command",
    collections.terminalCommands.id,
    {
      title: "List outdated npm packages",
      description: "Check which dependencies have newer versions available",
      contentType: "TEXT",
      language: "bash",
      content: "npm outdated",
    },
  );

  // ─── Design Resources (4 links) ─────────────────────────────────────────────

  await seedItem(
    "item-link-tailwind-docs",
    user.id,
    "system-link",
    collections.designResources.id,
    {
      title: "Tailwind CSS documentation",
      description: "Official Tailwind CSS reference",
      contentType: "URL",
      url: "https://tailwindcss.com/docs",
    },
  );

  await seedItem(
    "item-link-shadcn",
    user.id,
    "system-link",
    collections.designResources.id,
    {
      title: "shadcn/ui",
      description: "Composable component library built on Radix and Tailwind",
      contentType: "URL",
      url: "https://ui.shadcn.com",
    },
  );

  await seedItem(
    "item-link-radix-themes",
    user.id,
    "system-link",
    collections.designResources.id,
    {
      title: "Radix UI primitives",
      description: "Unstyled, accessible component primitives for React",
      contentType: "URL",
      url: "https://www.radix-ui.com/primitives",
    },
  );

  await seedItem(
    "item-link-lucide",
    user.id,
    "system-link",
    collections.designResources.id,
    {
      title: "Lucide icon library",
      description: "Open-source icon set used throughout the app",
      contentType: "URL",
      url: "https://lucide.dev/icons/",
    },
  );

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
  console.log(`Seeded demo user ${user.email}.`);
  console.log(`Seeded ${Object.keys(collections).length} collections with items.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
