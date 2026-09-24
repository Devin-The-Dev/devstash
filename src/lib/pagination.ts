export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// Next.js searchParams values arrive as string | string[] | undefined and are
// fully untrusted (user-editable URL) — always falls back to page 1 rather
// than passing a bad value through to a Prisma `skip`.
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function totalPagesFor(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export type PageToken = number | "ellipsis";

// Always shows the first and last page, plus one sibling on each side of the
// current page, collapsing any gap into a single ellipsis token.
export function getPageNumbers(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return [];

  const siblingCount = 1;
  const totalNumbersShown = siblingCount * 2 + 5;

  if (totalPages <= totalNumbersShown) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const pages: PageToken[] = [1];

  if (showLeftEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let page = 2; page < leftSibling; page++) pages.push(page);
  }

  for (let page = leftSibling; page <= rightSibling; page++) {
    if (page > 1 && page < totalPages) pages.push(page);
  }

  if (showRightEllipsis) {
    pages.push("ellipsis");
  } else {
    for (let page = rightSibling + 1; page < totalPages; page++) pages.push(page);
  }

  pages.push(totalPages);

  return pages;
}
