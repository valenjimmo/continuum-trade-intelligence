import type { SymbolAnalysis } from "@/lib/types";
import { scoreTone } from "@/lib/utils";

export function FactorMatrix({ symbols }: { symbols: SymbolAnalysis[] }) {
  const factorNames = Object.keys(symbols[0]?.factors ?? {});

  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Continuation Matrix</h2>
        <span className="text-sm text-ink/55">0-100 quality model</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/55">
              <th className="py-2 font-medium">Factor</th>
              {symbols.map((symbol) => (
                <th key={symbol.ticker} className="py-2 font-medium">{symbol.ticker}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factorNames.map((factor) => (
              <tr key={factor} className="border-b border-line last:border-0">
                <td className="py-3 capitalize text-ink/70">{factor.replaceAll("_", " ")}</td>
                {symbols.map((symbol) => {
                  const value = symbol.factors[factor as keyof typeof symbol.factors];
                  return (
                    <td key={`${symbol.ticker}-${factor}`} className={`py-3 font-semibold ${scoreTone(value)}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
