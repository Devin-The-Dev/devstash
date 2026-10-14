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
