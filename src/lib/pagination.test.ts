import { describe, expect, it } from "vitest";
import { getPageNumbers, parsePageParam, totalPagesFor } from "@/lib/pagination";

describe("parsePageParam", () => {
  it("defaults to 1 for undefined, non-numeric, zero, or negative values", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
    expect(parsePageParam("2.5")).toBe(1);
  });

  it("parses a valid positive integer string", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("42")).toBe(42);
  });

  it("uses the first value when given an array (duplicate query params)", () => {
    expect(parsePageParam(["3", "5"])).toBe(3);
  });
});

describe("totalPagesFor", () => {
  it("returns at least 1 page even when there are zero items", () => {
    expect(totalPagesFor(0, 21)).toBe(1);
  });

  it("computes the ceiling of count / pageSize", () => {
    expect(totalPagesFor(21, 21)).toBe(1);
    expect(totalPagesFor(22, 21)).toBe(2);
    expect(totalPagesFor(42, 21)).toBe(2);
  });
});

describe("getPageNumbers", () => {
  it("returns an empty array for zero or negative total pages", () => {
    expect(getPageNumbers(1, 0)).toEqual([]);
  });

  it("shows every page when the total is small enough to need no ellipsis", () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses the right side with an ellipsis near the start", () => {
    expect(getPageNumbers(1, 20)).toEqual([1, 2, "ellipsis", 20]);
  });

  it("collapses the left side with an ellipsis near the end", () => {
    expect(getPageNumbers(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });

  it("collapses both sides with an ellipsis in the middle", () => {
    expect(getPageNumbers(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });
});
