"use client";

import { useRevealed } from "@/components/homepage/Reveal";
import { cn } from "@/lib/utils";

const TAGS = ["react", "hooks", "debounce", "typescript", "performance"];
const DELAYS = ["delay-700", "delay-[880ms]", "delay-[1060ms]", "delay-[1240ms]", "delay-[1420ms]"];

// Tags "generate" one by one once the surrounding <Reveal> is in view.
export function AiTags() {
  const revealed = useRevealed();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {TAGS.map((tag, i) => (
        <span
          key={tag}
          className={cn(
            "rounded-full border border-home-prompt/30 bg-home-prompt/10 px-[11px] py-1 font-mono text-xs text-amber-200 transition-[opacity,scale,translate] duration-350 motion-reduce:transition-none",
            DELAYS[i],
            !revealed && "js:motion-safe:translate-y-1.5 js:motion-safe:scale-90 js:motion-safe:opacity-0",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
