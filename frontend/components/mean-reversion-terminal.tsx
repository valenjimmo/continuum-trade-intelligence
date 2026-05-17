"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type UTCTimestamp
} from "lightweight-charts";
import { HelpCircle, Plus, X } from "lucide-react";
import type {
  BollingerPoint,
  MeanReversionTerminalSnapshot,
  TerminalCandle,
  TerminalMetric,
  TerminalMetricState
} from "@/lib/types";
import { cn } from "@/lib/utils";

const terminalBg = "#0d1117";
const chartBg = "#101720";
const grid = "#1f2937";

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

function toTime(value: string): UTCTimestamp {
  return Math.floor(new Date(value).getTime() / 1000) as UTCTimestamp;
}

function commonChartOptions(width: number, height: number) {
  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: chartBg },
      textColor: "#94a3b8",
      fontSize: 10
    },
    grid: {
      vertLines: { color: grid },
      horzLines: { color: grid }
    },
    rightPriceScale: {
      borderColor: "#334155",
      scaleMargins: { top: 0.12, bottom: 0.12 }
    },
    timeScale: {
      borderColor: "#334155",
      timeVisible: false,
      secondsVisible: false
    },
    crosshair: {
      mode: CrosshairMode.Magnet
    },
    handleScroll: false,
    handleScale: false
  };
}

function applyChartSize(chart: IChartApi, width: number, height: number) {
  chart.applyOptions({ width, height });
  chart.timeScale().fitContent();
}

function TradingViewMiniChart({
  candles,
  bands,
  rsi,
  adx
}: {
  candles: TerminalCandle[];
  bands: BollingerPoint[];
  rsi: number[];
  adx: number[];
}) {
  const priceRef = useRef<HTMLDivElement | null>(null);
  const rsiRef = useRef<HTMLDivElement | null>(null);
  const adxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!priceRef.current || !rsiRef.current || !adxRef.current) return;

    const priceWidth = priceRef.current.clientWidth;
    const subWidth = rsiRef.current.clientWidth;
    const priceChart = createChart(priceRef.current, commonChartOptions(priceWidth, 96));
    const rsiChart = createChart(rsiRef.current, commonChartOptions(subWidth, 30));
    const adxChart = createChart(adxRef.current, commonChartOptions(subWidth, 30));

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#e11d48",
      borderUpColor: "#34d399",
      borderDownColor: "#fb7185",
      wickUpColor: "#34d399",
      wickDownColor: "#fb7185"
    });
    candleSeries.setData(
      candles.map((item) => ({
        time: toTime(item.timestamp),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      }))
    );

    const upper = priceChart.addLineSeries({ color: "#64748b", lineWidth: 1, priceLineVisible: false });
    const middle = priceChart.addLineSeries({
      color: "#94a3b8",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false
    });
    const lower = priceChart.addLineSeries({ color: "#64748b", lineWidth: 1, priceLineVisible: false });
    upper.setData(bands.map((item) => ({ time: toTime(item.timestamp), value: item.upper })));
    middle.setData(bands.map((item) => ({ time: toTime(item.timestamp), value: item.middle })));
    lower.setData(bands.map((item) => ({ time: toTime(item.timestamp), value: item.lower })));

    const rsiSeries = rsiChart.addLineSeries({ color: "#a78bfa", lineWidth: 2, priceLineVisible: false });
    rsiSeries.setData(
      candles.map((item, index) => ({ time: toTime(item.timestamp), value: rsi[index] ?? 50 }))
    );
    const adxSeries = adxChart.addLineSeries({ color: "#38bdf8", lineWidth: 2, priceLineVisible: false });
    adxSeries.setData(
      candles.map((item, index) => ({ time: toTime(item.timestamp), value: adx[index] ?? 20 }))
    );

    priceChart.timeScale().fitContent();
    rsiChart.timeScale().fitContent();
    adxChart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (!priceRef.current || !rsiRef.current || !adxRef.current) return;
      applyChartSize(priceChart, priceRef.current.clientWidth, 96);
      applyChartSize(rsiChart, rsiRef.current.clientWidth, 30);
      applyChartSize(adxChart, adxRef.current.clientWidth, 30);
    });
    resizeObserver.observe(priceRef.current);

    return () => {
      resizeObserver.disconnect();
      priceChart.remove();
      rsiChart.remove();
      adxChart.remove();
    };
  }, [adx, bands, candles, rsi]);

  return (
    <div className="grid h-[160px] grid-rows-[96px_30px_30px] gap-1">
      <div ref={priceRef} className="overflow-hidden rounded-sm" />
      <div className="relative overflow-hidden rounded-sm">
        <span className="pointer-events-none absolute left-2 top-1 z-10 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">RSI</span>
        <div ref={rsiRef} />
      </div>
      <div className="relative overflow-hidden rounded-sm">
        <span className="pointer-events-none absolute left-2 top-1 z-10 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">ADX</span>
        <div ref={adxRef} />
      </div>
    </div>
  );
}

function ChartBox({ snapshot }: { snapshot: MeanReversionTerminalSnapshot }) {
  return (
    <section className="h-[208px] w-[390px] shrink-0 rounded border border-slate-700 bg-[#101720] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">1H Candle + BB 20/2</p>
          <h2 className="text-sm font-semibold text-slate-100">{snapshot.symbol}</h2>
        </div>
        <p className="text-lg font-bold text-slate-100">${snapshot.price.toFixed(2)}</p>
      </div>
      <TradingViewMiniChart
        candles={snapshot.candles_1h}
        bands={snapshot.bollinger_bands}
        rsi={snapshot.rsi_1h}
        adx={snapshot.adx_1h_series}
      />
    </section>
  );
}

function MetricBox({ metric }: { metric: TerminalMetric }) {
  return (
    <section className={cn("flex h-[208px] w-[118px] shrink-0 flex-col justify-between rounded border p-3", heatClass(metric.state, metric.intensity))}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{metric.label}</p>
      <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">{metric.sub_label}</p>
    </section>
  );
}

function SignalBox({ snapshot }: { snapshot: MeanReversionTerminalSnapshot }) {
  return (
    <section className={cn("flex h-[208px] w-[210px] shrink-0 flex-col justify-between rounded border p-4", heatClass(snapshot.signal_state, snapshot.signal_intensity))}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Strategy Signal</p>
      <div>
        <p className="text-2xl font-black leading-tight tracking-tight text-white">{snapshot.signal.replace("STRATEGY: ", "")}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          {snapshot.selected_contract.side} ${snapshot.selected_contract.strike.toFixed(0)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          IV {(snapshot.selected_contract.implied_volatility * 100).toFixed(0)}% / Δ {snapshot.selected_contract.delta.toFixed(2)}
        </p>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">{snapshot.selected_contract.expiration}</p>
    </section>
  );
}

function TickerControls({ symbols }: { symbols: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  function setSymbols(nextSymbols: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("symbols", nextSymbols.join(","));
    router.push(`/strategies/mean-reversion?${params.toString()}`);
  }

  function addTicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = value.trim().toUpperCase().replace(/[^A-Z.]/g, "");
    if (!ticker || symbols.includes(ticker)) return;
    setSymbols([...symbols, ticker].slice(0, 8));
    setValue("");
  }

  function removeTicker(symbol: string) {
    const nextSymbols = symbols.filter((item) => item !== symbol);
    setSymbols(nextSymbols.length ? nextSymbols : ["SPY"]);
  }

  return (
    <div className="flex min-w-max items-center justify-between gap-4 rounded border border-slate-800 bg-[#161b22] px-3 py-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Options Mean Reversion</p>
        {symbols.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => removeTicker(symbol)}
            className="inline-flex h-7 items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 text-xs font-semibold text-slate-200 hover:border-rose-500/60 hover:text-rose-200"
          >
            {symbol}
            <X className="h-3 w-3" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <form onSubmit={addTicker} className="flex items-center gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add ticker"
            className="h-8 w-28 rounded border-slate-700 bg-slate-950 text-xs font-semibold uppercase text-slate-100 placeholder:text-slate-600"
          />
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950 px-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-100 hover:bg-emerald-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </form>
        <Link
          href="/strategies/mean-reversion/faq"
          className="inline-flex h-8 items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-300 hover:bg-slate-800"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          FAQ
        </Link>
      </div>
    </div>
  );
}

function TerminalRow({ snapshot }: { snapshot: MeanReversionTerminalSnapshot }) {
  return (
    <div className="flex min-w-max items-center gap-2 rounded border border-slate-800 bg-[#161b22] p-2 shadow-2xl shadow-black/25">
      <ChartBox snapshot={snapshot} />
      {snapshot.metrics.map((metric) => (
        <MetricBox key={`${snapshot.symbol}-${metric.label}`} metric={metric} />
      ))}
      <SignalBox snapshot={snapshot} />
    </div>
  );
}

export function MeanReversionTerminal({ snapshots }: { snapshots: MeanReversionTerminalSnapshot[] }) {
  const symbols = snapshots.map((snapshot) => snapshot.symbol);

  return (
    <div className="min-h-screen overflow-x-auto" style={{ background: terminalBg }}>
      <div className="flex min-h-screen min-w-max flex-col justify-center gap-3 p-5">
        <TickerControls symbols={symbols} />
        {snapshots.map((snapshot) => (
          <TerminalRow key={snapshot.symbol} snapshot={snapshot} />
        ))}
      </div>
    </div>
  );
}
