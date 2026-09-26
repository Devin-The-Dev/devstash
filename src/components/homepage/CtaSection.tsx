import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/homepage/Reveal";
import { homeButton } from "@/components/homepage/home-button";

export function CtaSection() {
  return (
    <section className="pb-20 md:pb-[110px]">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6">
        <Reveal className="rounded-3xl border border-home-border bg-home-surface bg-[radial-gradient(500px_240px_at_20%_0%,rgb(63_114_198/0.12),transparent_70%),radial-gradient(500px_240px_at_80%_100%,rgb(236_72_153/0.09),transparent_70%)] px-5 py-14 text-center md:px-8 md:py-[72px]">
          <h2 className="text-[clamp(30px,4.4vw,46px)] leading-[1.15] font-bold tracking-tight">
            Ready to Organize Your Knowledge?
          </h2>
          <p className="mx-auto mt-4 mb-8 max-w-[520px] text-[17px] text-home-muted">
            Bring your snippets, prompts, and commands home. It takes less than a minute.
          </p>
          <Link href="/register" className={homeButton({ size: "lg" })}>
            Get started for free
            <ArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
