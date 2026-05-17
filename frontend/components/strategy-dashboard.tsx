import { ArrowDownRight, ArrowUpRight, BadgeCheck, CircleDot, ShieldCheck } from "lucide-react";
import type { StrategyDashboard as StrategyDashboardData } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";
import { LocalTime } from "@/components/local-time";
import { StrategySelector } from "@/components/strategy-selector";

function percentTone(value: number) {
  if (value > 0) return "text-pine";
  if (value < 0) return "text-danger";
  return "text-steel";
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon
}: {
  label: string;
  value: string;
  tone?: string;
  icon: typeof ArrowUpRight;
}) {
  return (
    <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <p className="flex items-center gap-2 text-sm text-ink/60">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold", tone)}>{value}</p>
    </article>
  );
}

function MiniCurve({
  values,
  variant
}: {
  values: number[];
  variant: "equity" | "drawdown";
}) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(max - min, 1);

  return (
    <div className="flex h-[210px] items-end gap-1 rounded-md border border-line bg-background p-4">
      {values.map((value, index) => {
        const height = Math.max(5, ((value - min) / range) * 100);
        return (
          <div
            key={`${variant}-${index}`}
            className={cn("w-full rounded-t-sm", variant === "equity" ? "bg-pine" : "bg-danger")}
            style={{ height: `${height}%` }}
            aria-label={`${variant} point ${value.toFixed(2)}`}
          />
        );
      })}
    </div>
  );
}

export function StrategyDashboard({ dashboard }: { dashboard: StrategyDashboardData }) {
  const metrics = dashboard.metrics;
  const equityValues = dashboard.equity_curve.map((point) => point.value);
  const drawdownValues = dashboard.drawdown_curve.map((point) => Math.abs(point.drawdown_percent));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-steel">
                {dashboard.selected_strategy.family}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{dashboard.selected_strategy.name}</h2>
              <p className="mt-2 text-sm text-ink/65">{dashboard.selected_strategy.description}</p>
            </div>
            <span className="rounded-full border border-line bg-background px-2 py-1 text-xs font-medium uppercase tracking-[0.08em]">
              {dashboard.data_mode} / {dashboard.data_feed}
            </span>
          </div>
          <StrategySelector
            strategies={dashboard.available_strategies}
            selectedStrategyId={dashboard.selected_strategy.id}
            timeframe={dashboard.timeframe}
          />
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-ink/60">
            {dashboard.symbols.map((symbol) => (
              <span key={symbol} className="rounded-full border border-line bg-background px-2 py-1">
                {symbol}
              </span>
            ))}
            <span className="rounded-full border border-line bg-background px-2 py-1">
              Generated <LocalTime value={dashboard.generated_at} />
            </span>
          </div>
        </div>

        <div className="metric-grid gap-3">
          <MetricCard
            label="Total Return"
            value={`${metrics.total_return_percent.toFixed(2)}%`}
            tone={percentTone(metrics.total_return_percent)}
            icon={ArrowUpRight}
          />
          <MetricCard label="Win Rate" value={`${metrics.win_rate}%`} tone={scoreTone(metrics.win_rate)} icon={BadgeCheck} />
          <MetricCard label="Profit Factor" value={metrics.profit_factor.toFixed(2)} icon={CircleDot} />
          <MetricCard
            label="Max Drawdown"
            value={`${metrics.max_drawdown_percent.toFixed(2)}%`}
            tone="text-danger"
            icon={ArrowDownRight}
          />
          <MetricCard
            label="Avg Trade"
            value={`${metrics.average_trade_return_percent.toFixed(2)}%`}
            tone={percentTone(metrics.average_trade_return_percent)}
            icon={ArrowUpRight}
          />
          <MetricCard label="Risk Score" value={`${metrics.risk_score}`} tone={scoreTone(metrics.risk_score)} icon={ShieldCheck} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Equity Curve</h2>
            <span className="text-sm text-ink/55">{metrics.trade_count} trades</span>
          </div>
          <MiniCurve values={equityValues.length ? equityValues : [100]} variant="equity" />
        </div>
        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Drawdown</h2>
            <span className="text-sm text-ink/55">Peak-to-trough</span>
          </div>
          <MiniCurve values={drawdownValues.length ? drawdownValues : [0]} variant="drawdown" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Signals</h2>
            <span className="text-sm text-ink/55">{dashboard.timeframe}</span>
          </div>
          <div className="space-y-3">
            {dashboard.signals.map((signal) => (
              <article key={signal.symbol} className="rounded-md border border-line bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{signal.symbol}</p>
                    <p className="text-sm text-ink/60">{signal.reason}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
                      signal.action === "enter"
                        ? "border-pine/20 bg-pine/10 text-pine"
                        : signal.action === "exit"
                          ? "border-danger/20 bg-danger/10 text-danger"
                          : "border-steel/20 bg-steel/10 text-steel"
                    )}
                  >
                    {signal.action}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-ink/55">Price</p>
                    <p className="font-semibold">${signal.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-ink/55">Confidence</p>
                    <p className={cn("font-semibold", scoreTone(signal.confidence))}>{signal.confidence}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Symbol Performance</h2>
            <span className="text-sm text-ink/55">Backtest slices</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/55">
                  <th className="py-2 font-medium">Symbol</th>
                  <th className="py-2 font-medium">Trades</th>
                  <th className="py-2 font-medium">Win Rate</th>
                  <th className="py-2 font-medium">Return</th>
                  <th className="py-2 font-medium">Max DD</th>
                  <th className="py-2 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.symbol_performance.map((item) => (
                  <tr key={item.symbol} className="border-b border-line last:border-0">
                    <td className="py-3 font-semibold">{item.symbol}</td>
                    <td className="py-3">{item.trades}</td>
                    <td className={cn("py-3 font-semibold", scoreTone(item.win_rate))}>{item.win_rate}%</td>
                    <td className={cn("py-3 font-semibold", percentTone(item.total_return_percent))}>
                      {item.total_return_percent.toFixed(2)}%
                    </td>
                    <td className="py-3 text-danger">{item.max_drawdown_percent.toFixed(2)}%</td>
                    <td className="py-3 text-ink/65">{item.current_signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trades</h2>
          <span className="text-sm text-ink/55">Last {dashboard.trades.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink/55">
                <th className="py-2 font-medium">Symbol</th>
                <th className="py-2 font-medium">Side</th>
                <th className="py-2 font-medium">Entry</th>
                <th className="py-2 font-medium">Exit</th>
                <th className="py-2 font-medium">Entry Price</th>
                <th className="py-2 font-medium">Exit Price</th>
                <th className="py-2 font-medium">Return</th>
                <th className="py-2 font-medium">Quality</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.trades.map((trade) => (
                <tr key={trade.id} className="border-b border-line last:border-0">
                  <td className="py-3 font-semibold">{trade.symbol}</td>
                  <td className="py-3 capitalize">{trade.side}</td>
                  <td className="py-3"><LocalTime value={trade.entry_time} /></td>
                  <td className="py-3"><LocalTime value={trade.exit_time} /></td>
                  <td className="py-3">${trade.entry_price.toFixed(2)}</td>
                  <td className="py-3">${trade.exit_price.toFixed(2)}</td>
                  <td className={cn("py-3 font-semibold", percentTone(trade.return_percent))}>
                    {trade.return_percent.toFixed(2)}%
                  </td>
                  <td className={cn("py-3 font-semibold", scoreTone(trade.setup_quality))}>{trade.setup_quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
