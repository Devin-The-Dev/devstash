import { describe, expect, it } from "vitest";
import { isActivePath } from "./nav";

describe("isActivePath", () => {
  it("matches the exact path", () => {
    expect(isActivePath("/dashboard", "/dashboard")).toBe(true);
    expect(isActivePath("/collections", "/collections", true)).toBe(true);
  });

  it("matches nested paths by default", () => {
    expect(isActivePath("/collections/abc", "/collections")).toBe(true);
  });

  it("does not match nested paths when exact", () => {
    expect(isActivePath("/collections/abc", "/collections", true)).toBe(false);
  });

  it("does not match a sibling that shares a prefix", () => {
    expect(isActivePath("/items/snippets-old", "/items/snippets")).toBe(false);
    expect(isActivePath("/dashboards", "/dashboard")).toBe(false);
  });

  it("does not match unrelated paths", () => {
    expect(isActivePath("/favorites", "/dashboard")).toBe(false);
  });
});
