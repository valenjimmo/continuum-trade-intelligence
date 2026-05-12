import Link from "next/link";
import { ArrowLeft, BarChart3, Bell, Gauge, ListChecks, RadioTower, Repeat2 } from "lucide-react";

const dashboardItems = [
  {
    title: "Market Bias",
    icon: Gauge,
    body: "The broad directional read across the tracked ETFs. Bullish or bearish means participation is leaning one way; neutral means alignment is not strong enough to treat the tape as directional; compression means range is contracting."
  },
  {
    title: "Regime",
    icon: BarChart3,
    body: "The current market-day classification. TREND_DAY favors continuation tactics, CHOP_DAY warns against forcing entries, BALANCED_DAY points to range behavior, EXPANSION_DAY marks wider volatility, and REVERSAL_DAY highlights failed acceptance."
  },
  {
    title: "Participation",
    icon: RadioTower,
    body: "A cross-market alignment score. A higher value means SPY, QQQ, and IWM are agreeing more clearly, which makes continuation conditions cleaner than a one-symbol move."
  },
  {
    title: "Symbol Cards",
    icon: ListChecks,
    body: "Each card shows the ticker price, trend state, continuation score, VWAP, current regime, breakout status, and whether the move is confirmed by broader participation."
  },
  {
    title: "Alerts",
    icon: Bell,
    body: "Alerts appear only when continuation quality and cross-market confirmation are high enough. They are summaries for attention, not automated trade instructions."
  },
  {
    title: "Replay Review",
    icon: Repeat2,
    body: "Replay rows are the starting point for historical review: regime, continuation score, outcome, favorable excursion, adverse excursion, and failure reason."
  }
];

const methodology = [
  "The platform does not predict tops, bottoms, or exact price targets.",
  "It scores continuation quality by combining VWAP respect, relative volume, pullback quality, candle acceptance, momentum stability, breakout quality, trend persistence, and liquidity sweep behavior.",
  "Market structure checks whether price is bullish, bearish, neutral, or compressing using ORB levels, VWAP, EMA alignment, and recent higher-high/higher-low or lower-high/lower-low behavior.",
  "Regime classification turns those conditions into a day type so the dashboard can distinguish healthy trend participation from chop, balance, expansion, and reversal risk.",
  "Correlation looks for agreement across SPY, QQQ, and IWM because continuation is more trustworthy when multiple liquid indices participate."
];

const faqs = [
  {
    question: "What is this dashboard for?",
    answer: "It helps you decide whether the current market environment supports trend continuation. It is meant to improve context and discipline, not replace judgment."
  },
  {
    question: "Is the continuation score a buy or sell signal?",
    answer: "No. A high score means conditions are cleaner for continuation. It does not define entry, stop, size, or trade direction by itself."
  },
  {
    question: "Why focus on SPY, QQQ, and IWM?",
    answer: "They are highly liquid and give a practical read on large-cap, growth-heavy, and small-cap participation. Agreement across them often says more than one ticker alone."
  },
  {
    question: "Why is this useful?",
    answer: "It can help reduce low-quality entries, avoid chop, spot healthier participation, and create a repeatable record for replay analysis."
  },
  {
    question: "What data is used right now?",
    answer: "The MVP currently uses deterministic mock market data so the full product flow can run without vendor credentials. The repository boundary is ready to swap in Alpaca, Yahoo, Polygon, or another market data adapter."
  },
  {
    question: "What should I look at first?",
    answer: "Start with market bias, regime, and participation. Then inspect the symbol cards and factor matrix to see whether the score is supported by real structure or just one strong factor."
  }
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.16em] text-steel">FAQ</p>
          <h1 className="mt-1 text-3xl font-semibold">Dashboard Guide and Methodology</h1>
          <p className="mt-3 max-w-3xl text-ink/65">
            TCIP is designed to answer one practical question: is the current market environment clean enough to consider participating in trend continuation?
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
          <h2 className="text-xl font-semibold">Quick Summary</h2>
          <p className="mt-3 text-ink/70">
            The dashboard combines market structure, continuation quality, day regime, and cross-market participation into a compact operating view. It is useful because it slows the decision down just enough to separate higher-quality continuation environments from noisy, emotional, or low-confirmation setups.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-line bg-panel p-5 shadow-panel">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-background">
                    <Icon className="h-4 w-4 text-pine" />
                  </span>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/68">{item.body}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
          <h2 className="text-xl font-semibold">Methodology</h2>
          <div className="mt-4 space-y-3">
            {methodology.map((item) => (
              <p key={item} className="rounded-md border border-line bg-background p-3 text-sm leading-6 text-ink/70">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
          <h2 className="text-xl font-semibold">Common Questions</h2>
          <div className="mt-4 divide-y divide-line">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/68">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
