import { Code, House, Image, Layers, Link, Search, Sparkles, Star, StickyNote, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { label: "Snippets", dot: "bg-home-snippet" },
  { label: "Prompts", dot: "bg-home-prompt" },
  { label: "Commands", dot: "bg-home-command" },
  { label: "Notes", dot: "bg-home-note" },
  { label: "Links", dot: "bg-home-url" },
];

const CARDS = [
  { title: "useDebounce", Icon: Code, accent: "border-l-home-snippet [&_svg]:text-home-snippet" },
  { title: "Code review", Icon: Sparkles, accent: "border-l-home-prompt [&_svg]:text-home-prompt" },
  { title: "git rebase -i", Icon: Terminal, accent: "border-l-home-command [&_svg]:text-home-command" },
  { title: "Deploy notes", Icon: StickyNote, accent: "border-l-home-note [&_svg]:text-home-note" },
  { title: "Tailwind docs", Icon: Link, accent: "border-l-home-url [&_svg]:text-home-url" },
  { title: "schema.png", Icon: Image, accent: "border-l-home-image [&_svg]:text-home-image" },
];

const navItem = "flex items-center gap-2 rounded-md px-2 py-[5px] text-home-muted [&_svg]:size-3";

// "...with DevStash": a simplified, decorative dashboard.
export function DashboardMock() {
  return (
    <div
      role="img"
      aria-label="DevStash dashboard preview"
      className="grid h-[300px] grid-cols-1 overflow-hidden rounded-[18px] border border-home-border-strong bg-home-elev text-xs shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(63_114_198/0.05),0_0_80px_-30px_rgb(63_114_198/0.25)] md:h-[340px] md:grid-cols-[140px_minmax(0,1fr)]"
    >
      <aside className="hidden border-r border-home-border bg-[#0e0e11] px-2.5 py-3.5 md:block">
        <div className="mx-1.5 mb-3.5 flex items-center gap-[7px] text-[13px] font-bold">
          <Layers className="size-3 text-home-snippet" />
          DevStash
        </div>
        <ul>
          <li className={cn(navItem, "bg-white/[0.06] text-zinc-100")}>
            <House />
            Dashboard
          </li>
          <li className={navItem}>
            <Star />
            Favorites
          </li>
        </ul>
        <p className="mx-2 mt-3.5 mb-1.5 text-[10px] tracking-[0.08em] text-home-faint uppercase">Types</p>
        <ul>
          {TYPES.map(({ label, dot }) => (
            <li key={label} className={navItem}>
              <span className={cn("size-[7px] rounded-[2px]", dot)} />
              {label}
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0 p-3.5">
        <div className="flex h-[30px] items-center gap-2 rounded-lg border border-home-border bg-home-surface px-2.5 text-home-faint">
          <Search className="size-3" />
          Search everything
          <kbd className="ml-auto rounded-[5px] border border-b-2 border-home-border-strong bg-home-surface-2 px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {CARDS.map(({ title, Icon, accent }) => (
            <div
              key={title}
              className={cn(
                "flex flex-col gap-[7px] rounded-lg border border-l-3 border-home-border bg-home-surface p-2.5",
                accent,
              )}
            >
              <span className="flex items-center gap-1.5 truncate font-semibold">
                <Icon className="size-3 shrink-0" />
                {title}
              </span>
              <span className="h-[5px] rounded-[3px] bg-white/[0.08]" />
              <span className="h-[5px] w-3/5 rounded-[3px] bg-white/[0.08]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
