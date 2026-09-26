import { Reveal } from "@/components/homepage/Reveal";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  description: string;
}

export function SectionHeader({ kicker, title, description }: SectionHeaderProps) {
  return (
    <Reveal className="mx-auto mb-14 max-w-[640px] text-center">
      <p className="font-mono text-[13px] tracking-[0.08em] text-home-brand-text uppercase">{kicker}</p>
      <h2 className="mt-3 text-[clamp(30px,4vw,44px)] leading-[1.15] font-bold tracking-tight">{title}</h2>
      <p className="mt-4 text-[17px] text-home-muted">{description}</p>
    </Reveal>
  );
}
