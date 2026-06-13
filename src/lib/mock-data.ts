// Mock data for the dashboard UI. Replace with real DB queries once Prisma models are wired up.

export type ContentType = "TEXT" | "FILE" | "URL";

export type ItemType = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // hex
  isSystem: boolean;
};

export type Item = {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  content?: string;
  url?: string;
  language?: string;
  typeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  lastUsedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
};

export const currentUser: User = {
  id: "user_1",
  name: "Alex Doe",
  email: "alex@example.com",
  isPro: false,
};

export const itemTypes: ItemType[] = [
  { id: "type_snippet", name: "Snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { id: "type_prompt", name: "Prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { id: "type_command", name: "Command", icon: "Terminal", color: "#f97316", isSystem: true },
  { id: "type_note", name: "Note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_link", name: "Link", icon: "Link", color: "#10b981", isSystem: true },
  { id: "type_file", name: "File", icon: "File", color: "#6b7280", isSystem: true },
  { id: "type_image", name: "Image", icon: "Image", color: "#ec4899", isSystem: true },
];

export const collections: Collection[] = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Hooks, composition, and rendering tricks I reach for...",
    isFavorite: true,
    itemCount: 24,
    lastUsedAt: "2026-06-13T08:00:00.000Z", // 2h ago
  },
  {
    id: "col_ai_prompt_library",
    name: "AI Prompt Library",
    description: "System prompts and templates for GPT and...",
    isFavorite: false,
    itemCount: 47,
    lastUsedAt: "2026-06-08T10:00:00.000Z", // 5d ago
  },
  {
    id: "col_docker_kubernetes",
    name: "Docker & Kubernetes",
    description: "Commands and compose files I always forget.",
    isFavorite: false,
    itemCount: 18,
    lastUsedAt: "2026-06-10T10:00:00.000Z", // 3d ago
  },
  {
    id: "col_reading_list",
    name: "Reading List",
    description: "Articles, RFCs, and blog posts to revisit.",
    isFavorite: false,
    itemCount: 56,
    lastUsedAt: "2026-06-08T10:00:00.000Z", // 5d ago
  },
  {
    id: "col_architecture_notes",
    name: "Architecture Notes",
    description: "System design write-ups and decision records.",
    isFavorite: true,
    itemCount: 12,
    lastUsedAt: "2026-06-06T10:00:00.000Z", // 1w ago
  },
  {
    id: "col_postgres_toolkit",
    name: "Postgres Toolkit",
    description: "Query patterns, migrations, and perf tricks.",
    isFavorite: false,
    itemCount: 31,
    lastUsedAt: "2026-05-30T10:00:00.000Z", // 2w ago
  },
];

export const items: Item[] = [
  {
    id: "item_use_debounce",
    title: "useDebounce hook",
    description: "Tiny debounce hook with cleanup",
    contentType: "TEXT",
    content: "export function useDebounce<T>(value: T, delay: number): T {\n  // ...\n}",
    language: "typescript",
    typeId: "type_snippet",
    collectionIds: ["col_react_patterns"],
    tags: ["react", "hooks"],
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-06-13T08:00:00.000Z", // 2h ago
  },
  {
    id: "item_code_review_prompt",
    title: "Code review system prompt",
    description: "Strict reviewer persona for PR feedback",
    contentType: "TEXT",
    content: "You are a strict senior reviewer. Review the diff for correctness...",
    typeId: "type_prompt",
    collectionIds: ["col_ai_prompt_library"],
    tags: ["gpt-4", "reviews"],
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-06-10T10:00:00.000Z", // 3d ago
  },
  {
    id: "item_docker_compose_rebuild",
    title: "docker compose up + rebuild",
    description: "Force rebuild without cache",
    contentType: "TEXT",
    content: "docker compose build --no-cache && docker compose up -d",
    language: "bash",
    typeId: "type_command",
    collectionIds: ["col_docker_kubernetes"],
    tags: ["docker", "compose"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-06-13T07:00:00.000Z",
  },
  {
    id: "item_tanstack_router_conventions",
    title: "TanStack Router file conventions",
    description: "Cheatsheet for flat routing",
    contentType: "TEXT",
    content: "## File-based routing\n\n- `routes/index.tsx` -> `/`\n- `routes/posts.$postId.tsx` -> `/posts/:postId`",
    typeId: "type_note",
    collectionIds: ["col_architecture_notes"],
    tags: ["tanstack", "routing"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-06-12T12:00:00.000Z",
  },
  {
    id: "item_designing_data_intensive_apps",
    title: "Designing Data-Intensive Applications",
    description: "Kleppmann's book chapter notes",
    contentType: "URL",
    url: "https://dataintensive.net/",
    typeId: "type_link",
    collectionIds: ["col_reading_list"],
    tags: ["book", "systems"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-06-11T09:00:00.000Z",
  },
];
