import { BadgeCheck, BrainCircuit, History, TrendingDown, TrendingUp } from "lucide-react";
import type { IntradayRegime, RegimeDashboard } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

const regimeTone: Record<IntradayRegime, string> = {
  TREND_UP: "bg-pine/10 text-pine border-pine/20",
  TREND_DOWN: "bg-danger/10 text-danger border-danger/20",
  CHOP_MEAN_REVERSION: "bg-steel/10 text-steel border-steel/20",
  COMPRESSION: "bg-amber/10 text-amber border-amber/20",
  EXPANSION_MOMENTUM: "bg-pine/10 text-pine border-pine/20"
};

function RegimeIcon({ regime }: { regime: IntradayRegime }) {
  if (regime === "TREND_DOWN") return <TrendingDown className="h-4 w-4" />;
  if (regime === "TREND_UP" || regime === "EXPANSION_MOMENTUM") {
    return <TrendingUp className="h-4 w-4" />;
  }
  return <BrainCircuit className="h-4 w-4" />;
}

export function RegimeIntelligencePanel({ regimes }: { regimes: RegimeDashboard }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Intraday Regime Engine</h2>
          <p className="text-sm text-ink/60">
            {regimes.primary_regime.replaceAll("_", " ")} · {regimes.market_confidence_score}% market confidence
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink/70">
          <History className="h-4 w-4" />
          {regimes.timeframe}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {regimes.symbols.map((snapshot) => {
          const topFeatures = Object.entries(snapshot.feature_scores)
            .sort(([, left], [, right]) => right - left)
            .slice(0, 3);
          const primaryStrategy = snapshot.strategy_recommendations[0];

          return (
            <article key={snapshot.symbol} className="rounded-lg border border-line bg-panel p-4 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{snapshot.symbol}</h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                        regimeTone[snapshot.regime]
                      )}
                    >
                      <RegimeIcon regime={snapshot.regime} />
                      {snapshot.regime.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/65">{snapshot.explanation}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-semibold", scoreTone(snapshot.confidence_score))}>
                    {snapshot.confidence_score}
                  </p>
                  <p className="text-xs font-medium text-ink/55">{snapshot.confidence}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {topFeatures.map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-ink/65">{name.replaceAll("_", " ")}</span>
                      <span className={cn("font-semibold", scoreTone(value))}>{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-line">
                      <div className="h-2 rounded-full bg-pine" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {primaryStrategy ? (
                <div className="mt-4 rounded-md border border-line p-3">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-ink/55">
                    <BadgeCheck className="h-4 w-4" />
                    Preferred strategy
                  </p>
                  <p className="mt-1 font-semibold">{primaryStrategy.name}</p>
                  <p className="mt-1 text-sm text-ink/60">{primaryStrategy.rationale}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
