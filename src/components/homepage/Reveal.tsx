"use client";

import { createContext, useContext } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const RevealContext = createContext(true);

// Whether the nearest <Reveal> has scrolled into view (true outside one).
export function useRevealed() {
  return useContext(RevealContext);
}

const DELAYS = ["delay-0", "delay-[90ms]", "delay-[180ms]"] as const;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2;
}

// Fades and slides its content up once it scrolls into view. Content is only
// hidden when scripting is on and motion is allowed, so it never gets stuck
// invisible without JS or under prefers-reduced-motion.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none",
        DELAYS[delay],
        !inView && "js:motion-safe:translate-y-6 js:motion-safe:opacity-0",
        className,
      )}
    >
      <RevealContext.Provider value={inView}>{children}</RevealContext.Provider>
    </div>
  );
}
