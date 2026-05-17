import Link from "next/link";
import { ArrowLeft, Archive, FlaskConical } from "lucide-react";

const disabledPages = [
  {
    href: "/disabled-pages/strategy-analytics",
    title: "Strategy Analytics",
    label: "Legacy test page",
    body: "Original multi-strategy analytics prototype with Trend following as the strategy family."
  }
];

export default function DisabledPagesIndex() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <p className="mt-6 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-steel">
            <Archive className="h-4 w-4" />
            Disabled Pages
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Reference Tests</h1>
          <p className="mt-3 max-w-3xl text-ink/65">
            Archived experiments and disabled product surfaces live here so we can refer back to what was built before.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <section className="grid gap-4 md:grid-cols-2">
          {disabledPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-lg border border-line bg-panel p-5 shadow-panel transition hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-background">
                  <FlaskConical className="h-4 w-4 text-pine" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">{page.label}</p>
                  <h2 className="text-lg font-semibold">{page.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/68">{page.body}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
