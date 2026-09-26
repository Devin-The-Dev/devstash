import { describe, expect, it } from "vitest";
import { sortFavorites, type FavoriteSortKeys } from "@/lib/favorites-sort";

const rows: FavoriteSortKeys[] = [
  { name: "beta", date: new Date("2026-09-01"), type: "Snippet" },
  { name: "Alpha", date: new Date("2026-09-03"), type: "Prompt" },
  { name: "gamma", date: new Date("2026-09-02"), type: "Snippet" },
  { name: "delta", date: new Date("2026-09-04"), type: "Command" },
];

const names = (sorted: FavoriteSortKeys[]) => sorted.map((row) => row.name);
const byKeys = (row: FavoriteSortKeys) => row;

describe("sortFavorites", () => {
  it("sorts by date, most recent first", () => {
    expect(names(sortFavorites(rows, "date", byKeys))).toEqual(["delta", "Alpha", "gamma", "beta"]);
  });

  it("sorts by name A→Z, case-insensitively", () => {
    expect(names(sortFavorites(rows, "name", byKeys))).toEqual(["Alpha", "beta", "delta", "gamma"]);
  });

  it("sorts by type A→Z, breaking ties by name", () => {
    expect(names(sortFavorites(rows, "type", byKeys))).toEqual(["delta", "Alpha", "beta", "gamma"]);
  });

  it("falls back to name when rows have no type", () => {
    const untyped = rows.map(({ name, date }) => ({ name, date }));
    expect(names(sortFavorites(untyped, "type", byKeys))).toEqual([
      "Alpha",
      "beta",
      "delta",
      "gamma",
    ]);
  });

  it("accepts ISO date strings and does not mutate the input", () => {
    const input = [
      { name: "old", date: "2026-01-01T00:00:00.000Z" },
      { name: "new", date: "2026-06-01T00:00:00.000Z" },
    ];
    expect(names(sortFavorites(input, "date", byKeys))).toEqual(["new", "old"]);
    expect(names(input)).toEqual(["old", "new"]);
  });

  it("orders names containing numbers naturally", () => {
    const numbered = [{ name: "item 10", date: "2026-01-01" }, { name: "item 2", date: "2026-01-01" }];
    expect(names(sortFavorites(numbered, "name", byKeys))).toEqual(["item 2", "item 10"]);
  });
});
