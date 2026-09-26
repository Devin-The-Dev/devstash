import { Code, File, Folder, Search, Sparkles, Terminal, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/homepage/Reveal";
import { SectionHeader } from "@/components/homepage/SectionHeader";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  Icon: LucideIcon;
  // Sets --c, the accent every part of the card derives from.
  accent: string;
  body: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    Icon: Code,
    accent: "[--c:var(--color-home-snippet)]",
    body: "Save reusable code with syntax highlighting, language detection, and a full editor. Copy it back in one click.",
  },
  {
    title: "AI Prompts",
    Icon: Sparkles,
    accent: "[--c:var(--color-home-prompt)]",
    body: "Keep your best system messages, workflows, and context files out of chat history and ready to reuse.",
  },
  {
    title: "Instant Search",
    Icon: Search,
    accent: "[--c:var(--color-home-url)]",
    body: (
      <>
        Hit{" "}
        <kbd className="rounded-[5px] border border-b-2 border-home-border-strong bg-home-surface-2 px-[0.4em] py-[0.1em] font-mono text-[0.8em]">
          ⌘K
        </kbd>{" "}
        and search across titles, content, tags, and types. Everything is a few keystrokes away.
      </>
    ),
  },
  {
    title: "Commands",
    Icon: Terminal,
    accent: "[--c:var(--color-home-command)]",
    body: "Stop digging through bash history. Store the one-liners and flags you always forget, tagged and searchable.",
  },
  {
    title: "Files & Docs",
    Icon: File,
    accent: "[--c:var(--color-home-file)]",
    body: "Upload files and images alongside your notes: diagrams, configs, and docs, stored securely in the cloud.",
  },
  {
    title: "Collections",
    Icon: Folder,
    accent: "[--c:var(--color-home-image)]",
    body: 'Group anything into collections like "React Patterns" or "Interview Prep". Items can live in as many as you like.',
  },
];

function FeatureCard({ title, Icon, accent, body }: Feature) {
  return (
    <article
      className={cn(
        "group/feature relative h-full overflow-hidden rounded-[18px] border border-home-border bg-linear-to-b from-home-surface to-home-elev p-6 transition-[border-color,translate] duration-250 hover:-translate-y-[3px] hover:border-[color-mix(in_srgb,var(--c)_45%,var(--color-home-border))] md:p-7",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-90 before:from-transparent before:via-(--c) before:to-transparent before:opacity-80",
        "after:absolute after:-top-15 after:-right-15 after:size-40 after:rounded-full after:bg-(--c) after:opacity-[0.07] after:blur-[30px] after:transition-opacity hover:after:opacity-[0.16]",
        accent,
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl border border-(--c)/30 bg-(--c)/14 text-(--c)">
        <Icon className="size-[22px]" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-[19px] leading-[1.15] font-bold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-home-muted">{body}</p>
    </article>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-20 md:py-[110px]">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6">
        <SectionHeader
          kicker="Features"
          title="Everything you reach for, one keystroke away"
          description="Purpose-built types for the things developers actually save, with search that finds them before you finish typing."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) as 0 | 1 | 2}>
              <FeatureCard {...feature} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
