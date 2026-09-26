// Simplified brand marks for the homepage "chaos" field. Decorative only.

interface MarkProps {
  className?: string;
}

export function GitHubMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3"
      />
    </svg>
  );
}

export function NotionMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="2.5" width="18" height="19" rx="3" fill="#fff" />
      <rect x="3" y="2.5" width="18" height="19" rx="3" fill="none" stroke="#111" strokeWidth="1.5" />
      <path fill="#111" d="M7.5 6.5h2.2l4.6 7.1V6.5h2.2v11h-2.1l-4.7-7.2v7.2H7.5z" />
    </svg>
  );
}

export function SlackMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="7" y="1.5" width="3.6" height="10" rx="1.8" fill="#36c5f0" />
      <rect x="13" y="7" width="9.5" height="3.6" rx="1.8" fill="#2eb67d" />
      <rect x="13.4" y="12.5" width="3.6" height="10" rx="1.8" fill="#ecb22e" />
      <rect x="1.5" y="13.4" width="9.5" height="3.6" rx="1.8" fill="#e01e5a" />
    </svg>
  );
}

export function VSCodeMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#0ea5e9"
        fillRule="evenodd"
        d="M17.2 1.5 22.5 4v16l-5.3 2.5L7.4 13.6l-4.1 3.1-1.8-.9V8.2l1.8-.9 4.1 3.1zm0 5.9L11.5 12l5.7 4.6z"
      />
    </svg>
  );
}
