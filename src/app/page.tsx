import type { Metadata } from "next";
import { AiSection } from "@/components/homepage/AiSection";
import { CtaSection } from "@/components/homepage/CtaSection";
import { FeaturesSection } from "@/components/homepage/FeaturesSection";
import { HeroSection } from "@/components/homepage/HeroSection";
import { HomeFooter } from "@/components/homepage/HomeFooter";
import { HomeNav } from "@/components/homepage/HomeNav";
import { PricingPlans } from "@/components/homepage/PricingPlans";
import { SectionHeader } from "@/components/homepage/SectionHeader";

export const metadata: Metadata = {
  title: "DevStash — Your developer knowledge, in one place",
  description:
    "DevStash unifies your code snippets, AI prompts, commands, notes, files, and links into one fast, searchable, AI-enhanced hub.",
};

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-home-bg text-base leading-relaxed text-zinc-100 antialiased [&_:focus-visible]:rounded-md [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-home-brand">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-[radial-gradient(600px_360px_at_18%_12%,rgb(63_114_198/0.08),transparent_70%),radial-gradient(520px_320px_at_85%_20%,rgb(236_72_153/0.07),transparent_70%),radial-gradient(700px_400px_at_50%_60%,rgb(99_102_241/0.05),transparent_70%)]"
      />
      <HomeNav />
      <main id="top">
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <section id="pricing" className="scroll-mt-16 py-20 md:py-[110px]">
          <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6">
            <SectionHeader
              kicker="Pricing"
              title="Start free, upgrade when your stash grows"
              description="Everything you need to get organized, with Pro for power users and AI."
            />
            <PricingPlans />
          </div>
        </section>
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
