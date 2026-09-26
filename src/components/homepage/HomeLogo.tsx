import { Layers } from "lucide-react";

export function HomeLogo() {
  return (
    <a
      href="#top"
      aria-label="DevStash home"
      className="inline-flex items-center gap-2.5 text-[17px] font-bold tracking-tight"
    >
      <span className="grid size-[30px] place-items-center rounded-lg bg-linear-135 from-home-brand to-home-brand-2 text-white">
        <Layers className="size-[17px]" aria-hidden="true" />
      </span>
      DevStash
    </a>
  );
}
