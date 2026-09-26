export type FavoriteSort = "date" | "name" | "type";

export const DEFAULT_FAVORITE_SORT: FavoriteSort = "date";

export const FAVORITE_SORT_OPTIONS: { value: FavoriteSort; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
];

// `type` is omitted for rows without an item type (collections), so a type
// sort falls back to name for them.
export type FavoriteSortKeys = {
  name: string;
  date: Date | string;
  type?: string;
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function compareDateDesc(a: FavoriteSortKeys, b: FavoriteSortKeys): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function sortFavorites<T>(
  rows: readonly T[],
  sort: FavoriteSort,
  getKeys: (row: T) => FavoriteSortKeys,
): T[] {
  return rows
    .map((row) => ({ row, keys: getKeys(row) }))
    .sort(({ keys: a }, { keys: b }) => {
      if (sort === "date") return compareDateDesc(a, b) || collator.compare(a.name, b.name);
      if (sort === "type") {
        const byType = collator.compare(a.type ?? "", b.type ?? "");
        if (byType !== 0) return byType;
      }
      return collator.compare(a.name, b.name) || compareDateDesc(a, b);
    })
    .map(({ row }) => row);
}
