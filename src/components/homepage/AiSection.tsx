import { Check, Sparkles } from "lucide-react";
import { AiTags } from "@/components/homepage/AiTags";
import { Reveal } from "@/components/homepage/Reveal";

const CAPABILITIES = [
  "Auto-tag suggestions for every item",
  "One-line summaries of long notes and docs",
  '"Explain This Code" for unfamiliar snippets',
  "Prompt optimizer for sharper AI prompts",
];

const kw = "text-purple-400";
const fn = "text-blue-400";
const str = "text-green-300";
const ty = "text-amber-400";
const num = "text-orange-400";

// Each line of the mock editor, pre-highlighted.
const CODE_LINES: React.ReactNode[] = [
  <>
    <span className={kw}>import</span> {"{ useEffect, useState }"} <span className={kw}>from</span>{" "}
    <span className={str}>&quot;react&quot;</span>;
  </>,
  null,
  <>
    <span className={kw}>export function</span> <span className={fn}>useDebounce</span>&lt;
    <span className={ty}>T</span>&gt;(value: <span className={ty}>T</span>, delay ={" "}
    <span className={num}>300</span>) {"{"}
  </>,
  <>
    {"  "}
    <span className={kw}>const</span> [debounced, setDebounced] = <span className={fn}>useState</span>(value);
  </>,
  null,
  <>
    {"  "}
    <span className={fn}>useEffect</span>(() =&gt; {"{"}
  </>,
  <>
    {"    "}
    <span className={kw}>const</span> id = <span className={fn}>setTimeout</span>(() =&gt;{" "}
    <span className={fn}>setDebounced</span>(value), delay);
  </>,
  <>
    {"    "}
    <span className={kw}>return</span> () =&gt; <span className={fn}>clearTimeout</span>(id);
  </>,
  <>{"  }, [value, delay]);"}</>,
  null,
  <>
    {"  "}
    <span className={kw}>return</span> debounced;
  </>,
  <>{"}"}</>,
];

function EditorMock() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-home-border-strong bg-[#0d0d10] shadow-[0_30px_70px_-30px_rgb(0_0_0/0.9)]">
      <div className="flex items-center gap-3 border-b border-home-border bg-home-surface px-4 py-3 font-mono text-xs">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="size-[11px] rounded-full bg-red-500" />
          <i className="size-[11px] rounded-full bg-yellow-500" />
          <i className="size-[11px] rounded-full bg-green-500" />
        </span>
        <span className="text-zinc-100">useDebounce.ts</span>
        <span className="ml-auto text-home-faint">typescript</span>
      </div>
      <pre className="overflow-x-auto px-4 py-[18px] font-mono text-[13px] leading-[1.75] text-zinc-300">
        <code>
          {CODE_LINES.map((line, i) => (
            <span key={i} className="block">
              <span className="mr-[18px] inline-block w-[2ch] text-right text-zinc-600 select-none" aria-hidden="true">
                {i + 1}
              </span>
              {line}
            </span>
          ))}
        </code>
      </pre>
      <div className="border-t border-home-border bg-linear-90 from-home-prompt/[0.06] to-transparent p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-400">
          <Sparkles className="size-4" aria-hidden="true" />
          AI Generated Tags
        </p>
        <AiTags />
      </div>
    </div>
  );
}

export function AiSection() {
  return (
    <section className="border-y border-home-border bg-home-elev bg-[radial-gradient(600px_300px_at_80%_50%,rgb(245_158_11/0.07),transparent_70%)] py-20 md:py-[110px]">
      <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-home-prompt/35 bg-home-prompt/12 px-3 py-[5px] text-[13px] font-semibold text-amber-400">
            <Sparkles className="size-4" aria-hidden="true" />
            Pro Feature
          </span>
          <h2 className="mt-5 text-[clamp(30px,4vw,42px)] leading-[1.15] font-bold tracking-tight">
            Let AI do the organizing
          </h2>
          <p className="mt-4 text-[17px] text-home-muted">
            Save something and move on. DevStash reads it, tags it, and explains it, so your stash
            stays tidy without the busywork.
          </p>
          <ul className="mt-7 grid gap-3.5">
            {CAPABILITIES.map((capability) => (
              <li key={capability} className="flex items-center gap-3">
                <Check
                  className="size-[22px] shrink-0 rounded-full bg-home-note/15 p-1 text-home-note [stroke-width:3]"
                  aria-hidden="true"
                />
                {capability}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={1}>
          <EditorMock />
        </Reveal>
      </div>
    </section>
  );
}
