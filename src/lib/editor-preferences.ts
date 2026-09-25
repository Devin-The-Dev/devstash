import * as z from "zod";

export const EDITOR_FONT_SIZES = [12, 13, 14, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

function oneOf<T extends number>(values: readonly T[], message: string) {
  return z.number().refine((n): n is T => values.includes(n as T), { message });
}

export const editorPreferencesSchema = z.object({
  fontSize: oneOf(EDITOR_FONT_SIZES, "Invalid font size"),
  tabSize: oneOf(EDITOR_TAB_SIZES, "Invalid tab size"),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES, { error: "Invalid theme" }),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

/**
 * Resolves the raw `User.editorPreferences` JSON into a full preferences object.
 * Missing or invalid fields fall back to defaults individually, so one bad value
 * (e.g. a removed option) doesn't reset everything else.
 */
export function resolveEditorPreferences(raw: unknown): EditorPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  const resolved = { ...DEFAULT_EDITOR_PREFERENCES };
  const shape = editorPreferencesSchema.shape;
  for (const key of Object.keys(shape) as (keyof EditorPreferences)[]) {
    const parsed = shape[key].safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) {
      (resolved as Record<string, unknown>)[key] = parsed.data;
    }
  }
  return resolved;
}
