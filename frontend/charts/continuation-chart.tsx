import type { SymbolAnalysis } from "@/lib/types";
import { scoreTone } from "@/lib/utils";

export function ContinuationChart({ symbols }: { symbols: SymbolAnalysis[] }) {
  const colors: Record<string, string> = {
    SPY: "bg-pine",
    QQQ: "bg-steel",
    IWM: "bg-amber"
  };

  return (
    <div className="h-[260px] w-full overflow-hidden rounded-md border border-line bg-background p-4">
      <div className="grid h-full grid-cols-3 items-end gap-4">
        {symbols.map((symbol) => (
          <div key={symbol.ticker} className="flex h-full min-w-0 flex-col justify-end">
            <div className="mb-2 text-center">
              <p className={`text-lg font-semibold ${scoreTone(symbol.continuation_score)}`}>
                {symbol.continuation_score}
              </p>
              <p className="text-xs font-medium text-ink/55">{symbol.ticker}</p>
            </div>
            <div className="flex h-[170px] items-end rounded-md bg-white px-3 py-2">
              <div
                className={`w-full rounded-t-md ${colors[symbol.ticker] ?? "bg-pine"}`}
                style={{ height: `${Math.max(symbol.continuation_score, 4)}%` }}
                aria-label={`${symbol.ticker} continuation score ${symbol.continuation_score}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
