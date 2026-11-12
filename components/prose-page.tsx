/** Shared shell for text pages (guide, privacy): a narrow, left-aligned reading column. */
export default function ProsePage({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6 md:pt-16">
      <h1 className="font-heading text-[clamp(2.75rem,6vw,4.25rem)] font-extrabold leading-[0.95] text-ink">
        {title}
      </h1>
      <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-graphite">{lede}</p>
      <div className="mt-12 space-y-12">{children}</div>
    </article>
  );
}

export function ProseSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-heading text-3xl font-bold leading-tight text-ink">
        {title}
      </h2>
      <div className="mt-3 max-w-[65ch] space-y-3 leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}
