import { cva } from "class-variance-authority";

// Link-styled buttons for the marketing homepage, which uses its own brand
// palette rather than the app's neutral shadcn theme.
export const homeButton = cva(
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-transparent font-semibold whitespace-nowrap transition-colors active:translate-y-px [&_svg]:size-4 [&_svg]:transition-transform hover:[&_svg]:translate-x-0.5",
  {
    variants: {
      variant: {
        primary:
          "bg-home-brand text-white shadow-[0_6px_18px_-10px_rgb(63_114_198/0.45)] hover:bg-home-brand-hover",
        outline:
          "border-home-border-strong bg-white/[0.02] text-zinc-100 hover:border-zinc-600 hover:bg-white/5",
        ghost: "text-home-muted hover:bg-white/5 hover:text-zinc-100",
      },
      size: {
        default: "h-[38px] px-4 text-sm",
        lg: "h-12 rounded-xl px-[22px] text-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
