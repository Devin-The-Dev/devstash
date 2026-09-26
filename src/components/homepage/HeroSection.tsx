import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChaosField } from "@/components/homepage/ChaosField";
import { DashboardMock } from "@/components/homepage/DashboardMock";
import { Reveal } from "@/components/homepage/Reveal";
import { homeButton } from "@/components/homepage/home-button";
import { cn } from "@/lib/utils";

const panelLabel = "mb-3 font-mono text-[13px]";
const heroCta = "max-[420px]:w-full";

function TransformArrow() {
  return (
    <div
      aria-hidden="true"
      className="relative grid size-[60px] rotate-90 place-items-center rounded-full bg-linear-135 from-home-brand to-home-brand-2 text-white shadow-[0_0_28px_-8px_rgb(99_102_241/0.4)] motion-safe:animate-arrow-pulse lg:mt-7 lg:rotate-0"
    >
      <span className="absolute inset-0 rounded-full border-2 border-[rgb(99_102_241/0.35)] motion-safe:animate-ring-pulse motion-reduce:hidden" />
      <ArrowRight className="relative size-[26px] [stroke-width:2.4] motion-safe:animate-arrow-nudge" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="pt-28 pb-24 md:pt-[136px]">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-home-border bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-home-muted min-[421px]:text-[13px]">
            <span className="size-1.5 rounded-full bg-home-note shadow-[0_0_0_4px_rgb(34_197_94/0.18)]" />
            Snippets · Prompts · Commands · Notes · Files · Links
          </span>
          <h1 className="mt-6 text-[clamp(40px,6.4vw,72px)] leading-[1.15] font-extrabold tracking-[-0.035em]">
            Stop Losing Your
            <br />
            <span className="bg-linear-90 from-[#7ea6ec] via-[#9a9cf0] via-45% to-[#e48bbf] bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-[22px] max-w-[620px] text-[clamp(16px,2vw,19px)] text-home-muted">
            Your best snippets live in VS Code, your prompts in chat history, your commands in a
            random{" "}
            <code className="rounded-[5px] bg-home-surface-2 px-[0.35em] py-[0.1em] font-mono text-[0.9em] text-zinc-100">
              .txt
            </code>{" "}
            file. DevStash pulls it all into one fast, searchable, AI-enhanced hub.
          </p>
          <div className="mt-[34px] flex flex-wrap justify-center gap-3">
            <Link href="/register" className={homeButton({ size: "lg", className: heroCta })}>
              Start for free
              <ArrowRight />
            </Link>
            <a href="#features" className={homeButton({ variant: "outline", size: "lg", className: heroCta })}>
              See how it works
            </a>
          </div>
        </Reveal>

        <Reveal
          delay={2}
          className="mt-14 grid grid-cols-1 items-center justify-items-center gap-5 md:mt-[72px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)] lg:justify-items-stretch lg:gap-7"
        >
          <div className="relative w-full max-w-[560px] min-w-0 lg:max-w-none">
            <p className={cn(panelLabel, "text-home-faint")}>Your knowledge today...</p>
            <ChaosField />
          </div>
          <TransformArrow />
          <div className="relative w-full max-w-[560px] min-w-0 lg:max-w-none">
            <p className={cn(panelLabel, "text-home-brand-text")}>...with DevStash</p>
            <DashboardMock />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
