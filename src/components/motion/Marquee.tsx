export function Marquee({ items, className = "", speed = 40 }: { items: string[]; className?: string; speed?: number }) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{t}</span>
          <span className="inline-block size-2 rotate-45 bg-primary" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} role="presentation">
      <div className="marquee" style={{ ["--dur" as string]: `${speed}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
