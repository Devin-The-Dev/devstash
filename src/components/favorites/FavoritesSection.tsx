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
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <span className="text-sm font-normal tabular-nums text-muted-foreground">{count}</span>
      </h2>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">No favorite {title.toLowerCase()}.</p>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">{children}</div>
      )}
    </section>
  );
}
