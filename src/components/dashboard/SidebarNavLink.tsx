"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { isActivePath } from "@/lib/nav";

export function SidebarNavLink({
  href,
  tooltip,
  exact = false,
  children,
}: {
  href: string;
  tooltip: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href, exact);

  return (
    <SidebarMenuButton
      tooltip={tooltip}
      isActive={isActive}
      // Accent bar on the left so the active item stands out from hover states.
      className="relative data-active:font-semibold data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:left-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-sidebar-primary"
      render={<Link href={href} aria-current={isActive ? "page" : undefined} />}
    >
      {children}
    </SidebarMenuButton>
  );
}

// Closes the mobile drawer after any navigation, including links outside the
// nav (user menu, top bar), so the new page isn't hidden behind it.
export function CloseMobileSidebarOnNavigate() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}
