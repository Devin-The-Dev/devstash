const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  js: "javascript",
  ts: "typescript",
  yml: "yaml",
};

export function resolveMonacoLanguage(language: string | null | undefined): string {
  if (!language) return "plaintext";
  const normalized = language.trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export type LanguageOption = { value: string | null; label: string };

// Values are Monaco language ids. Plain text is null so it saves as no language.
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: null, label: "Plain text" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "shell", label: "Shell / Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "markdown", label: "Markdown" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
  { value: "xml", label: "XML" },
  { value: "ini", label: "INI" },
];

/**
 * The dropdown value for a stored language: aliases like "bash" select their
 * Monaco option, and empty or "plaintext" selects Plain text (null).
 */
export function toLanguageSelectValue(language: string | null | undefined): string | null {
  const resolved = resolveMonacoLanguage(language);
  return resolved === "plaintext" ? null : resolved;
}

/**
 * The options to show for a stored language. A language outside the list
 * (typed in before the dropdown existed) is appended so it stays selected
 * instead of silently showing Plain text.
 */
export function languageOptionsFor(language: string | null | undefined): LanguageOption[] {
  const value = toLanguageSelectValue(language);
  if (value === null || LANGUAGE_OPTIONS.some((option) => option.value === value)) {
    return LANGUAGE_OPTIONS;
  }
  return [...LANGUAGE_OPTIONS, { value, label: language!.trim() }];
}
