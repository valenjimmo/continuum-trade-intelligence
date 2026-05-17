import { BadgeCheck, BrainCircuit, History, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { IntradayRegime, RegimeDashboard } from "@/lib/types";
import { cn, scoreTone } from "@/lib/utils";

const regimeTone: Record<IntradayRegime, string> = {
  TREND_UP: "bg-pine/10 text-pine border-pine/20",
  TREND_DOWN: "bg-danger/10 text-danger border-danger/20",
  CHOP_MEAN_REVERSION: "bg-steel/10 text-steel border-steel/20",
  COMPRESSION: "bg-amber/10 text-amber border-amber/20",
  EXPANSION_MOMENTUM: "bg-pine/10 text-pine border-pine/20"
};

const regimeMeanings: Array<{ regime: IntradayRegime; meaning: string }> = [
  { regime: "COMPRESSION", meaning: "prepare, wait for expansion" },
  { regime: "TREND_UP", meaning: "favor long continuation/pullback strategies" },
  { regime: "TREND_DOWN", meaning: "favor short continuation/failure-reclaim strategies" },
  { regime: "CHOP_MEAN_REVERSION", meaning: "avoid chasing, favor fades/extreme reversion" },
  { regime: "EXPANSION_MOMENTUM", meaning: "favor confirmed breakout/momentum continuation" }
];

function RegimeIcon({ regime }: { regime: IntradayRegime }) {
  if (regime === "TREND_DOWN") return <TrendingDown className="h-4 w-4" />;
  if (regime === "TREND_UP" || regime === "EXPANSION_MOMENTUM") {
    return <TrendingUp className="h-4 w-4" />;
  }
  return <BrainCircuit className="h-4 w-4" />;
}

function contextAssistant(regime: IntradayRegime) {
  if (regime === "TREND_UP") {
    return "Market context favors long continuation and controlled pullback entries. Avoid fading strength until evidence weakens.";
  }
  if (regime === "TREND_DOWN") {
    return "Market context favors downside continuation or failed reclaim setups. Avoid early bottom-picking.";
  }
  if (regime === "COMPRESSION") {
    return "Market context is coiling. Prepare levels and wait for confirmed expansion before chasing direction.";
  }
  if (regime === "EXPANSION_MOMENTUM") {
    return "Market context favors momentum follow-through, but entries should still wait for acceptance and participation.";
  }
  return "Market context is two-way and noisy. Avoid chasing breaks; mean-reversion or no-trade posture is favored.";
}

function dataModeLabel(dataMode: string, dataFeed: string) {
  if (dataMode.toLowerCase() === "mock") {
    return "Mock local bars; not live market data.";
  }
  return `${dataMode} / ${dataFeed}`;
}

export function RegimeIntelligencePanel({
  regimes,
  dataMode,
  dataFeed
}: {
  regimes: RegimeDashboard;
  dataMode: string;
  dataFeed: string;
}) {
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
          Bar timeframe {regimes.timeframe}
        </span>
      </div>

      <div className="rounded-lg border border-line bg-panel p-4 text-sm text-ink/70 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <p className="flex items-start gap-2">
            <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
            <span>
              Context assistant: the engine classifies the market environment and suggests the strategy posture that best fits it.
              It is not an entry or exit signal.
            </span>
          </p>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-background px-3 py-2 text-xs font-medium text-ink/65">
            <Info className="h-4 w-4" />
            {dataModeLabel(dataMode, dataFeed)}
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {regimeMeanings.map((item) => (
            <div key={item.regime} className="rounded-md border border-line bg-background p-3">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold",
                  regimeTone[item.regime]
                )}
              >
                {item.regime}
              </span>
              <p className="mt-2 text-xs leading-5 text-ink/65">{item.meaning}</p>
            </div>
          ))}
        </div>
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
                  <p className="mt-2 rounded-md border border-line bg-background p-3 text-sm text-ink/70">
                    {contextAssistant(snapshot.regime)}
                  </p>
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
