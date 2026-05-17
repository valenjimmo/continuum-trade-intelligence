import type {
  BollingerPoint,
  MeanReversionTerminalSnapshot,
  TerminalCandle,
  TerminalMetric,
  TerminalMetricState
} from "@/lib/types";
import { cn } from "@/lib/utils";

const terminalBg = "#0d1117";

function heatClass(state: TerminalMetricState, intensity: number) {
  if (state === "neutral") return "border-slate-700 bg-slate-900/95";
  if (state === "bullish") {
    if (intensity >= 72) return "border-emerald-400/45 bg-emerald-950";
    if (intensity >= 45) return "border-emerald-500/35 bg-emerald-900/85";
    return "border-emerald-700/35 bg-emerald-950/70";
  }
  if (intensity >= 72) return "border-rose-400/45 bg-rose-950";
  if (intensity >= 45) return "border-rose-500/35 bg-rose-900/85";
  return "border-rose-700/35 bg-rose-950/70";
}

function linePath(values: number[], width: number, height: number, pad = 8) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);
  return values
    .map((value, index) => {
      const x = pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2);
      const y = height - pad - ((value - min) / range) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function ChartBox({
  candles,
  bands,
  rsi,
  adx,
  symbol,
  price
}: {
  candles: TerminalCandle[];
  bands: BollingerPoint[];
  rsi: number[];
  adx: number[];
  symbol: string;
  price: number;
}) {
  const width = 360;
  const priceHeight = 150;
  const subHeight = 38;
  const high = Math.max(...candles.map((item) => item.high), ...bands.map((item) => item.upper));
  const low = Math.min(...candles.map((item) => item.low), ...bands.map((item) => item.lower));
  const range = Math.max(high - low, 0.01);
  const candleWidth = Math.max(4, (width - 24) / candles.length - 3);

  function y(value: number) {
    return 12 + ((high - value) / range) * (priceHeight - 24);
  }

  return (
    <section className="h-[268px] w-[384px] shrink-0 rounded border border-slate-700 bg-[#101720] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">1H CANDLE</p>
          <h2 className="text-sm font-semibold text-slate-100">{symbol} / OPTIONS MR</h2>
        </div>
        <p className="text-lg font-bold text-slate-100">${price.toFixed(2)}</p>
      </div>

      <svg viewBox={`0 0 ${width} ${priceHeight + subHeight * 2 + 18}`} className="h-[215px] w-full">
        <rect width={width} height={priceHeight} rx="3" fill="#0d1117" />
        <path d={linePath(bands.map((item) => item.upper), width, priceHeight, 10)} fill="none" stroke="#64748b" strokeWidth="1" opacity="0.7" />
        <path d={linePath(bands.map((item) => item.middle), width, priceHeight, 10)} fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.45" strokeDasharray="3 4" />
        <path d={linePath(bands.map((item) => item.lower), width, priceHeight, 10)} fill="none" stroke="#64748b" strokeWidth="1" opacity="0.7" />
        {candles.map((candle, index) => {
          const x = 10 + (index / Math.max(candles.length - 1, 1)) * (width - 20);
          const bullish = candle.close >= candle.open;
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyBottom = y(Math.min(candle.open, candle.close));
          return (
            <g key={`${candle.timestamp}-${index}`}>
              <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={bullish ? "#34d399" : "#fb7185"} strokeWidth="1" />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={Math.max(2, bodyBottom - bodyTop)}
                fill={bullish ? "#059669" : "#be123c"}
                rx="1"
              />
            </g>
          );
        })}

        <g transform={`translate(0 ${priceHeight + 8})`}>
          <rect width={width} height={subHeight} rx="3" fill="#0d1117" />
          <text x="8" y="13" fill="#64748b" fontSize="9" fontWeight="700">RSI 14</text>
          <path d={linePath(rsi.length ? rsi : [50], width, subHeight, 7)} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
        </g>

        <g transform={`translate(0 ${priceHeight + subHeight + 16})`}>
          <rect width={width} height={subHeight} rx="3" fill="#0d1117" />
          <text x="8" y="13" fill="#64748b" fontSize="9" fontWeight="700">ADX 14</text>
          <path d={linePath(adx.length ? adx : [20], width, subHeight, 7)} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        </g>
      </svg>
    </section>
  );
}

function MetricBox({ metric }: { metric: TerminalMetric }) {
  return (
    <section className={cn("flex h-[268px] w-[128px] shrink-0 flex-col justify-between rounded border p-3", heatClass(metric.state, metric.intensity))}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{metric.label}</p>
      <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">{metric.sub_label}</p>
    </section>
  );
}

function SignalBox({ snapshot }: { snapshot: MeanReversionTerminalSnapshot }) {
  return (
    <section className={cn("flex h-[268px] w-[210px] shrink-0 flex-col justify-between rounded border p-4", heatClass(snapshot.signal_state, snapshot.signal_intensity))}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">STRATEGY SIGNAL</p>
      <div>
        <p className="text-2xl font-black leading-tight tracking-tight text-white">{snapshot.signal.replace("STRATEGY: ", "")}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          {snapshot.selected_contract.side} ${snapshot.selected_contract.strike.toFixed(0)}
        </p>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">{snapshot.selected_contract.expiration}</p>
    </section>
  );
}

export function MeanReversionTerminal({ snapshot }: { snapshot: MeanReversionTerminalSnapshot }) {
  return (
    <div className="min-h-screen overflow-x-auto" style={{ background: terminalBg }}>
      <div className="flex min-h-screen min-w-max items-center justify-center p-5">
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#161b22] p-2 shadow-2xl shadow-black/40">
          <ChartBox
            candles={snapshot.candles_1h}
            bands={snapshot.bollinger_bands}
            rsi={snapshot.rsi_1h}
            adx={snapshot.adx_1h_series}
            symbol={snapshot.symbol}
            price={snapshot.price}
          />
          {snapshot.metrics.map((metric) => (
            <MetricBox key={metric.label} metric={metric} />
          ))}
          <SignalBox snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
}
