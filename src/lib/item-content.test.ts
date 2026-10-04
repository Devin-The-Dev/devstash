import { describe, expect, it } from "vitest";
import { parseTagInput } from "@/lib/item-content";

describe("parseTagInput", () => {
  it("splits, trims and drops empty entries", () => {
    expect(parseTagInput(" react, hooks ,, ")).toEqual(["react", "hooks"]);
  });

  it("lowercases and removes duplicates", () => {
    expect(parseTagInput("React, react, REACT, hooks")).toEqual(["react", "hooks"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTagInput("   ")).toEqual([]);
  });
});
