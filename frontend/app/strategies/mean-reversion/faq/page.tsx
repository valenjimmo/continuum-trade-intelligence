import Link from "next/link";
import { ArrowLeft, Circle } from "lucide-react";

const sections = [
  {
    title: "How To Read The Row",
    body: "Each ticker gets one horizontal row. Read it left to right: price context first, higher-timeframe filters next, execution filters after that, then options pricing, contract sensitivity, and the final strategy signal. The default list starts with SPY, QQQ, and IWM, then the MAG7 names."
  },
  {
    title: "Chart",
    body: "The chart is a 1H candlestick view with Bollinger Bands using a 20-period moving average and 2 standard deviations. The upper and lower bands show statistical extension from the recent mean. The middle dashed line is the moving average."
  },
  {
    title: "RSI And ADX",
    body: "The small sub-panels under the candle chart show RSI 14 and ADX 14. RSI helps identify directional pressure or exhaustion. ADX measures trend strength, not direction, so high ADX can be a warning against fading a strong move."
  },
  {
    title: "4H RSI",
    body: "The 4H RSI box is the macro directional filter. Bullish means the larger timeframe supports call-side mean reversion. Bearish means the backdrop is weak or put-side biased. Neutral means the strategy should avoid over-reading direction."
  },
  {
    title: "4H ADX",
    body: "The 4H ADX box checks whether the larger trend is usable. Moderate trend strength can support a controlled reversion attempt. Very hot trend strength turns red because fading a strong trend is dangerous."
  },
  {
    title: "1H ADX",
    body: "The 1H ADX box is the execution momentum filter. A moderate value means the entry environment is active enough to matter. A very high value can warn that momentum is too strong for a clean mean reversion entry."
  },
  {
    title: "IV Rank",
    body: "IV Rank estimates whether options premium is cheap, fair, or rich. Green means premium is relatively cheap for buying options. Red means premium is expensive and the trade may need a different structure."
  },
  {
    title: "BB Distance",
    body: "1H BB Distance measures how close price is to a Bollinger Band extension. Higher values mean price is nearer an outer band, which is where this mean reversion strategy starts paying closer attention."
  },
  {
    title: "Delta",
    body: "Delta measures option sensitivity to the underlying. The target zone is roughly 0.45 to 0.65 in absolute value, giving enough directional exposure without selecting an extremely deep in-the-money contract."
  },
  {
    title: "Strategy Signal",
    body: "The signal box combines the row states into a final action: LONG CALL, LONG PUT, or WAIT. WAIT means too many filters are neutral or hostile. It is an analysis signal, not an order ticket."
  },
  {
    title: "Rows And Layout",
    body: "Use Add ticker to append a row. Remove a ticker with the X at the end of its row. Drag the handle at the end of a row to reorder the scanner. The order is saved in the URL and browser storage."
  },
  {
    title: "Expanded Chart",
    body: "Click any row chart to open a larger version. Only one enlarged chart can be open at a time, so the scanner stays clear and you always know which symbol you are inspecting."
  }
];

const colors = [
  {
    label: "Green",
    className: "text-emerald-300",
    body: "Bullish or favorable for the configured strategy condition. Darker green means stronger confirmation."
  },
  {
    label: "Red",
    className: "text-rose-300",
    body: "Bearish, hostile, or risk-elevated for the configured condition. Darker red means stronger warning."
  },
  {
    label: "Slate",
    className: "text-slate-300",
    body: "Neutral, incomplete, or wait state. The data does not strongly support action."
  }
];

export default function MeanReversionFaqPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/strategies/mean-reversion"
          className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to terminal
        </Link>

        <header className="mt-8 border-b border-slate-800 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Options Mean Reversion FAQ</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">How To Read The Terminal</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            This page explains the chart, filters, color states, and signal logic used by the multi-ticker options
            mean reversion scanner.
          </p>
        </header>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          {colors.map((color) => (
            <article key={color.label} className="rounded border border-slate-800 bg-[#161b22] p-4">
              <p className={`flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] ${color.className}`}>
                <Circle className="h-3 w-3 fill-current" />
                {color.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{color.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded border border-slate-800 bg-[#161b22] p-5">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded border border-amber-500/25 bg-amber-950/20 p-5">
          <h2 className="text-lg font-bold text-amber-200">Data Caveat</h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            In mock mode, option IV and delta use deterministic fallback values. In Alpaca mode, the backend attempts
            to use Alpaca option chain snapshots with greeks from the indicative feed. True IV Rank requires stored IV
            history over time, so it should be treated as an estimate until IV snapshots are persisted.
          </p>
        </section>
      </div>
    </main>
  );
}
