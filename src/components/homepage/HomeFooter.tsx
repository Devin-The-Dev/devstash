import Link from "next/link";
import { HomeLogo } from "@/components/homepage/HomeLogo";

// Only destinations that exist today; add Docs, Changelog, legal pages, etc.
// here once they're built.
const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-home-border bg-home-elev text-sm">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-9 px-4 pt-14 pb-10 sm:px-6 md:flex-row md:justify-between md:gap-12">
        <div>
          <HomeLogo />
          <p className="mt-3.5 max-w-[260px] text-home-muted">
            One fast, searchable home for all your developer knowledge.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-[repeat(2,minmax(120px,auto))] md:gap-12">
          {COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="mb-3.5 text-[13px] tracking-[0.08em] text-home-faint uppercase">{heading}</h4>
              {links.map(({ label, href }) => (
                <Link key={label} href={href} className="mb-2.5 block text-home-muted hover:text-zinc-100">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1160px] border-t border-home-border px-4 pt-5 pb-8 text-[13px] text-home-faint sm:px-6">
        <p>&copy; {new Date().getFullYear()} DevStash. All rights reserved.</p>
      </div>
    </footer>
  );
}
