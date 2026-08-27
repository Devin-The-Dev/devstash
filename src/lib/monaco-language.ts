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
