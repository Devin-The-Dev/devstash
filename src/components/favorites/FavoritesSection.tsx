export function FavoritesSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 border-b px-2 pb-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {title}
        <span className="tabular-nums">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="px-2 py-2 text-muted-foreground">No favorite {title.toLowerCase()}.</p>
      ) : (
        <div className="divide-y divide-border/50">{children}</div>
      )}
    </section>
  );
}
