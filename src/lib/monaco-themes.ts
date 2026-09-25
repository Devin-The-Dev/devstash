import type { BeforeMount } from "@monaco-editor/react";
import type { EditorTheme } from "@/lib/editor-preferences";

type Monaco = Parameters<BeforeMount>[0];
type ThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

const SCROLLBAR_COLORS = {
  "scrollbarSlider.background": "#40404066",
  "scrollbarSlider.hoverBackground": "#52525280",
  "scrollbarSlider.activeBackground": "#737373",
};

// "vs-dark" keeps Monaco's built-in token colors, tuned to match the app's background.
const vsDark: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#171717",
    "editor.lineHighlightBackground": "#26262680",
    "editorLineNumber.foreground": "#525252",
    "editorLineNumber.activeForeground": "#a3a3a3",
    "editorIndentGuide.background": "#262626",
    "editorGutter.background": "#171717",
    "editorWidget.background": "#171717",
    "editorWidget.border": "#ffffff1a",
    ...SCROLLBAR_COLORS,
  },
};

const monokai: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "F8F8F2" },
    { token: "comment", foreground: "75715E", fontStyle: "italic" },
    { token: "string", foreground: "E6DB74" },
    { token: "number", foreground: "AE81FF" },
    { token: "constant", foreground: "AE81FF" },
    { token: "regexp", foreground: "E6DB74" },
    { token: "keyword", foreground: "F92672" },
    { token: "operator", foreground: "F92672" },
    { token: "type", foreground: "66D9EF", fontStyle: "italic" },
    { token: "identifier", foreground: "F8F8F2" },
    { token: "variable", foreground: "F8F8F2" },
    { token: "variable.parameter", foreground: "FD971F" },
    { token: "function", foreground: "A6E22E" },
    { token: "tag", foreground: "F92672" },
    { token: "attribute.name", foreground: "A6E22E" },
    { token: "attribute.value", foreground: "E6DB74" },
    { token: "delimiter", foreground: "F8F8F2" },
  ],
  colors: {
    "editor.background": "#272822",
    "editor.foreground": "#F8F8F2",
    "editor.lineHighlightBackground": "#3E3D32",
    "editor.selectionBackground": "#49483E",
    "editorCursor.foreground": "#F8F8F0",
    "editorWhitespace.foreground": "#3B3A32",
    "editorLineNumber.foreground": "#75715E",
    "editorLineNumber.activeForeground": "#F8F8F2",
    "editorIndentGuide.background": "#3B3A32",
    "editorGutter.background": "#272822",
    "editorWidget.background": "#1E1F1C",
    ...SCROLLBAR_COLORS,
  },
};

const githubDark: ThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "E6EDF3" },
    { token: "comment", foreground: "8B949E", fontStyle: "italic" },
    { token: "string", foreground: "A5D6FF" },
    { token: "number", foreground: "79C0FF" },
    { token: "constant", foreground: "79C0FF" },
    { token: "regexp", foreground: "7EE787" },
    { token: "keyword", foreground: "FF7B72" },
    { token: "operator", foreground: "FF7B72" },
    { token: "type", foreground: "FFA657" },
    { token: "identifier", foreground: "E6EDF3" },
    { token: "variable", foreground: "FFA657" },
    { token: "function", foreground: "D2A8FF" },
    { token: "tag", foreground: "7EE787" },
    { token: "attribute.name", foreground: "79C0FF" },
    { token: "attribute.value", foreground: "A5D6FF" },
    { token: "delimiter", foreground: "E6EDF3" },
  ],
  colors: {
    "editor.background": "#0D1117",
    "editor.foreground": "#E6EDF3",
    "editor.lineHighlightBackground": "#161B22",
    "editor.selectionBackground": "#264F78",
    "editorCursor.foreground": "#E6EDF3",
    "editorLineNumber.foreground": "#6E7681",
    "editorLineNumber.activeForeground": "#E6EDF3",
    "editorIndentGuide.background": "#21262D",
    "editorGutter.background": "#0D1117",
    "editorWidget.background": "#161B22",
    "editorWidget.border": "#30363D",
    ...SCROLLBAR_COLORS,
  },
};

const THEMES: Record<EditorTheme, ThemeData> = {
  "vs-dark": vsDark,
  monokai,
  "github-dark": githubDark,
};

/** Monaco theme id for a preference value. Prefixed so it never collides with built-ins. */
export function monacoThemeName(theme: EditorTheme): string {
  return `devstash-${theme}`;
}

export function defineMonacoThemes(monaco: Monaco) {
  for (const [theme, data] of Object.entries(THEMES) as [EditorTheme, ThemeData][]) {
    monaco.editor.defineTheme(monacoThemeName(theme), data);
  }
}
