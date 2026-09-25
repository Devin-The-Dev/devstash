import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  resolveEditorPreferences,
} from "@/lib/editor-preferences";

describe("resolveEditorPreferences", () => {
  it("returns defaults for null, non-objects, and arrays", () => {
    expect(resolveEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(resolveEditorPreferences("vs-dark")).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(resolveEditorPreferences([1, 2])).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns stored values when valid", () => {
    const stored = { fontSize: 16, tabSize: 4, wordWrap: false, minimap: true, theme: "monokai" };
    expect(resolveEditorPreferences(stored)).toEqual(stored);
  });

  it("falls back per field for missing or invalid values", () => {
    expect(resolveEditorPreferences({ fontSize: 99, theme: "github-dark", minimap: "yes" })).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "github-dark",
    });
  });

  it("drops unknown keys", () => {
    expect(resolveEditorPreferences({ foo: "bar" })).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("editorPreferencesSchema", () => {
  it("rejects values outside the allowed options", () => {
    expect(editorPreferencesSchema.safeParse({ ...DEFAULT_EDITOR_PREFERENCES, tabSize: 3 }).success).toBe(false);
    expect(editorPreferencesSchema.safeParse({ ...DEFAULT_EDITOR_PREFERENCES, theme: "light" }).success).toBe(false);
  });
});
