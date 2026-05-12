import { Activity, CheckCircle2, CircleDashed } from "lucide-react";
import type { SymbolAnalysis } from "@/lib/types";
import { cn, scoreTone, trendTone } from "@/lib/utils";
import { ScoreRing } from "@/components/score-ring";

export function SymbolCard({ symbol }: { symbol: SymbolAnalysis }) {
  const factors = Object.entries(symbol.factors).slice(0, 4);

  return (
    <article className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">{symbol.ticker}</h2>
            <span className={cn("rounded-full border px-2 py-1 text-xs font-medium", trendTone(symbol.trend))}>
              {symbol.trend}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/65">{symbol.summary}</p>
        </div>
        <ScoreRing score={symbol.continuation_score} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md border border-line p-3">
          <p className="text-ink/55">Price</p>
          <p className="font-semibold">${symbol.price.toFixed(2)}</p>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-ink/55">Regime</p>
          <p className="font-semibold">{symbol.regime.replace("_", " ")}</p>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-ink/55">VWAP</p>
          <p className="font-semibold">${symbol.levels.vwap.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {factors.map(([name, value]) => (
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

      <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-2 text-ink/65">
          <Activity className="h-4 w-4" />
          {symbol.structure.breakout_status.replaceAll("_", " ")}
        </span>
        <span className="flex items-center gap-2 font-medium">
          {symbol.correlation_confirmation ? <CheckCircle2 className="h-4 w-4 text-pine" /> : <CircleDashed className="h-4 w-4 text-amber" />}
          {symbol.correlation_confirmation ? "Confirmed" : "Waiting"}
        </span>
      </div>
    </article>
  );
}
