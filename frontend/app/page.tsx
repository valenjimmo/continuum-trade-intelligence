import Link from "next/link";
import { BarChart3, Gauge, HelpCircle, RadioTower } from "lucide-react";
import { AlertsPanel } from "@/components/alerts-panel";
import { FactorMatrix } from "@/components/factor-matrix";
import { LocalTime } from "@/components/local-time";
import { RefreshButton } from "@/components/refresh-button";
import { ReplayTable } from "@/components/replay-table";
import { SymbolCard } from "@/components/symbol-card";
import { ContinuationChart } from "@/charts/continuation-chart";
import { getAlerts, getDashboard, getReplay } from "@/lib/api";
import { trendTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [dashboard, alerts, replay] = await Promise.all([getDashboard(), getAlerts(), getReplay()]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-steel">TCIP MVP</p>
            <h1 className="mt-1 text-3xl font-semibold">Trend Continuation Intelligence</h1>
          </div>
          <div className="metric-grid gap-3 md:min-w-[520px]">
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><Gauge className="h-4 w-4" /> Market Bias</p>
              <p className={`mt-1 inline-flex rounded-full border px-2 py-1 text-sm font-semibold ${trendTone(dashboard.market_bias)}`}>
                {dashboard.market_bias}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><BarChart3 className="h-4 w-4" /> Regime</p>
              <p className="mt-1 font-semibold">{dashboard.regime.replace("_", " ")}</p>
            </div>
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><RadioTower className="h-4 w-4" /> Participation</p>
              <p className="mt-1 font-semibold">{dashboard.participation_score}%</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between text-sm text-ink/60">
          <span>
            Generated <LocalTime value={dashboard.generated_at} />
          </span>
          <RefreshButton />
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {dashboard.symbols.map((symbol) => (
            <SymbolCard key={symbol.ticker} symbol={symbol} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Continuation Scores</h2>
              <span className="text-sm text-ink/55">SPY / QQQ / IWM</span>
            </div>
            <ContinuationChart symbols={dashboard.symbols} />
          </div>
          <AlertsPanel alerts={alerts} />
        </section>

        <FactorMatrix symbols={dashboard.symbols} />
        <ReplayTable events={replay} />

        <footer className="flex justify-center border-t border-line py-6">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-ink/70 hover:bg-white hover:text-ink"
          >
            <HelpCircle className="h-4 w-4" />
            FAQ and methodology
          </Link>
        </footer>
      </div>
    </main>
  );
}
