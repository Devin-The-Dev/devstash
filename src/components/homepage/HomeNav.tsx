"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { HomeLogo } from "@/components/homepage/HomeLogo";
import { homeButton } from "@/components/homepage/home-button";

const MIN_ALPHA = 0.55;
const MAX_ALPHA = 0.94;
const SCROLL_RANGE = 240;

// Fixed nav whose background fades from translucent to near-opaque over the
// first 240px of scroll. Written straight to a CSS variable to skip re-renders.
export function HomeNav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let queued = false;

    const update = () => {
      const progress = Math.min(window.scrollY / SCROLL_RANGE, 1);
      nav.style.setProperty("--nav-alpha", String(MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * progress));
      queued = false;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[rgb(255_255_255/calc(var(--nav-alpha)*0.09))] bg-[rgb(10_10_12/var(--nav-alpha))] backdrop-blur-md backdrop-saturate-140 [--nav-alpha:0.55]"
    >
      <div className="mx-auto flex h-full w-full max-w-[1160px] items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <HomeLogo />
        <div className="hidden gap-6 text-sm text-home-muted sm:flex">
          <a href="#features" className="hover:text-zinc-100">
            Features
          </a>
          <a href="#pricing" className="hover:text-zinc-100">
            Pricing
          </a>
        </div>
        <div className="ml-auto flex gap-1 sm:gap-2">
          <Link href="/sign-in" className={homeButton({ variant: "ghost", className: "max-sm:px-3" })}>
            Sign In
          </Link>
          <Link href="/register" className={homeButton({ className: "max-sm:px-3" })}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
