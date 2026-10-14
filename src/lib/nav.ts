// Prefix match by default so nested routes (e.g. /collections/[id]) keep their
// parent link highlighted. Pass `exact` for links whose children have their
// own sidebar entry.
export function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) return true;
  return !exact && pathname.startsWith(`${href}/`);
}
