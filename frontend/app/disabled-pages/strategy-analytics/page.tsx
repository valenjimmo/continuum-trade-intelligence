import { BarChart3, Clock, LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppTabs } from "@/components/app-tabs";
import { AutoRefresh } from "@/components/auto-refresh";
import { StrategyDashboard } from "@/components/strategy-dashboard";
import { getStrategyDashboard } from "@/lib/api";

export const dynamic = "force-dynamic";

type DisabledStrategyAnalyticsPageProps = {
  searchParams?: {
    strategy?: string;
    timeframe?: string;
  };
};

export default async function DisabledStrategyAnalyticsPage({ searchParams }: DisabledStrategyAnalyticsPageProps) {
  const strategyId = searchParams?.strategy ?? "ema_9_21";
  const timeframe = searchParams?.timeframe ?? "5Min";
  const dashboard = await getStrategyDashboard(strategyId, timeframe);
  const refreshSeconds = Number(process.env.NEXT_PUBLIC_DASHBOARD_REFRESH_SECONDS ?? 30);

  return (
    <main className="min-h-screen">
      <AutoRefresh seconds={refreshSeconds} />
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/disabled-pages" className="text-sm font-medium text-ink/55 hover:text-ink">
                Disabled pages
              </Link>
              <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-steel">Strategy Lab Test</p>
              <h1 className="mt-1 text-3xl font-semibold">Strategy Analytics</h1>
            </div>
            <AppTabs />
          </div>
          <div className="metric-grid gap-3">
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><LineChart className="h-4 w-4" /> Strategy</p>
              <p className="mt-1 font-semibold">{dashboard.selected_strategy.name}</p>
            </div>
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><BarChart3 className="h-4 w-4" /> Trades</p>
              <p className="mt-1 font-semibold">{dashboard.metrics.trade_count}</p>
            </div>
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><ShieldCheck className="h-4 w-4" /> Risk Score</p>
              <p className="mt-1 font-semibold">{dashboard.metrics.risk_score}</p>
            </div>
            <div className="rounded-lg border border-line bg-background p-3">
              <p className="flex items-center gap-2 text-sm text-ink/60"><Clock className="h-4 w-4" /> Timeframe</p>
              <p className="mt-1 font-semibold">{dashboard.timeframe}</p>
            </div>
          </div>
        </div>
      </header>

      <StrategyDashboard dashboard={dashboard} />
    </main>
  );
}
