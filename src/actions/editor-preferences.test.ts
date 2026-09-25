import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const { updateEditorPreferences } = await import("@/actions/editor-preferences");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateEditorPreferences", () => {
  it("returns Unauthorized when there is no session", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("returns a validation error for invalid input", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({ ...DEFAULT_EDITOR_PREFERENCES, theme: "light" });

    expect(result).toEqual({ success: false, error: "Invalid theme" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects partial input so a save can't wipe the other stored fields", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({ theme: "monokai" });

    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("saves only schema fields for the session user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const prefs = { fontSize: 16, tabSize: 4, wordWrap: false, minimap: true, theme: "monokai" };

    const result = await updateEditorPreferences({ ...prefs, extra: "ignored" });

    expect(result).toEqual({ success: true, data: prefs });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: prefs },
    });
  });
});
