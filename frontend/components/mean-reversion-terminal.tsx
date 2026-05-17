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
import { GripVertical, HelpCircle, Maximize2, Plus, X } from "lucide-react";
import type {
  BollingerPoint,
  MeanReversionTerminalSnapshot,
  TerminalCandle,
  TerminalMetric,
  TerminalMetricState
} from "@/lib/types";
import { DisabledPagesLink } from "@/components/disabled-pages-link";
import { cn } from "@/lib/utils";

const terminalBg = "#0d1117";
const chartBg = "#101720";
const grid = "#1f2937";
const defaultSymbols = "SPY,QQQ,IWM,AAPL,MSFT,NVDA,AMZN,META,GOOGL,TSLA";
const storageKey = "mean-reversion-symbol-order";

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
  adx,
  priceHeight = 96,
  subHeight = 30
}: {
  candles: TerminalCandle[];
  bands: BollingerPoint[];
  rsi: number[];
  adx: number[];
  priceHeight?: number;
  subHeight?: number;
}) {
  const priceRef = useRef<HTMLDivElement | null>(null);
  const rsiRef = useRef<HTMLDivElement | null>(null);
  const adxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!priceRef.current || !rsiRef.current || !adxRef.current) return;

    const priceWidth = priceRef.current.clientWidth;
    const subWidth = rsiRef.current.clientWidth;
    const priceChart = createChart(priceRef.current, commonChartOptions(priceWidth, priceHeight));
    const rsiChart = createChart(rsiRef.current, commonChartOptions(subWidth, subHeight));
    const adxChart = createChart(adxRef.current, commonChartOptions(subWidth, subHeight));

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
      applyChartSize(priceChart, priceRef.current.clientWidth, priceHeight);
      applyChartSize(rsiChart, rsiRef.current.clientWidth, subHeight);
      applyChartSize(adxChart, adxRef.current.clientWidth, subHeight);
    });
    resizeObserver.observe(priceRef.current);

    return () => {
      resizeObserver.disconnect();
      priceChart.remove();
      rsiChart.remove();
      adxChart.remove();
    };
  }, [adx, bands, candles, priceHeight, rsi, subHeight]);

  return (
    <div className="grid gap-1" style={{ gridTemplateRows: `${priceHeight}px ${subHeight}px ${subHeight}px` }}>
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

function ChartBox({
  snapshot,
  onExpand
}: {
  snapshot: MeanReversionTerminalSnapshot;
  onExpand: (snapshot: MeanReversionTerminalSnapshot) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onExpand(snapshot)}
      className="h-[208px] w-[390px] shrink-0 rounded border border-slate-700 bg-[#101720] p-3 text-left transition hover:border-sky-400/60"
      aria-label={`Expand ${snapshot.symbol} chart`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">1H Candle + BB 20/2</p>
          <h2 className="text-sm font-semibold text-slate-100">{snapshot.symbol}</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-slate-100">${snapshot.price.toFixed(2)}</p>
          <Maximize2 className="h-4 w-4 text-slate-500" />
        </div>
      </div>
      <TradingViewMiniChart
        candles={snapshot.candles_1h}
        bands={snapshot.bollinger_bands}
        rsi={snapshot.rsi_1h}
        adx={snapshot.adx_1h_series}
      />
    </button>
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
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{snapshot.selected_contract.side}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Strike ${snapshot.selected_contract.strike.toFixed(0)} / Exp {snapshot.selected_contract.expiration}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          IV {(snapshot.selected_contract.implied_volatility * 100).toFixed(0)}% / Δ {snapshot.selected_contract.delta.toFixed(2)}
        </p>
      </div>
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-300">{snapshot.selected_contract.symbol}</p>
    </section>
  );
}

function TickerControls({
  symbols,
  setSymbols
}: {
  symbols: string[];
  setSymbols: (symbols: string[]) => void;
}) {
  const [value, setValue] = useState("");

  function addTicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = value.trim().toUpperCase().replace(/[^A-Z.]/g, "");
    if (!ticker || symbols.includes(ticker)) return;
    setSymbols([...symbols, ticker].slice(0, 12));
    setValue("");
  }

  return (
    <div className="flex min-w-max items-center justify-between gap-4 rounded border border-slate-800 bg-[#161b22] px-3 py-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Options Mean Reversion</p>
        <span className="text-xs text-slate-500">{symbols.length} rows</span>
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

function ChartModal({
  snapshot,
  onClose
}: {
  snapshot: MeanReversionTerminalSnapshot;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl rounded border border-slate-700 bg-[#101720] p-4 shadow-2xl shadow-black">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Expanded 1H Chart</p>
            <h2 className="text-2xl font-black text-slate-100">{snapshot.symbol} ${snapshot.price.toFixed(2)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            aria-label="Close enlarged chart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <TradingViewMiniChart
          candles={snapshot.candles_1h}
          bands={snapshot.bollinger_bands}
          rsi={snapshot.rsi_1h}
          adx={snapshot.adx_1h_series}
          priceHeight={420}
          subHeight={90}
        />
      </div>
    </div>
  );
}

function TerminalRow({
  snapshot,
  onExpand,
  onRemove,
  onDragStart,
  onDrop
}: {
  snapshot: MeanReversionTerminalSnapshot;
  onExpand: (snapshot: MeanReversionTerminalSnapshot) => void;
  onRemove: (symbol: string) => void;
  onDragStart: (symbol: string) => void;
  onDrop: (symbol: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(snapshot.symbol)}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={() => onDrop(snapshot.symbol)}
      className="flex min-w-max items-center gap-2 rounded border border-slate-800 bg-[#161b22] p-2 shadow-2xl shadow-black/25"
    >
      <ChartBox snapshot={snapshot} onExpand={onExpand} />
      {snapshot.metrics.map((metric) => (
        <MetricBox key={`${snapshot.symbol}-${metric.label}`} metric={metric} />
      ))}
      <SignalBox snapshot={snapshot} />
      <div className="flex h-[208px] w-[50px] shrink-0 flex-col items-center justify-between rounded border border-slate-800 bg-slate-950 p-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-400 active:cursor-grabbing"
          aria-label={`Drag ${snapshot.symbol} row`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(snapshot.symbol)}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-400 hover:border-rose-500/60 hover:text-rose-200"
          aria-label={`Remove ${snapshot.symbol}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function MeanReversionTerminal({ snapshots }: { snapshots: MeanReversionTerminalSnapshot[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbols = snapshots.map((snapshot) => snapshot.symbol);
  const [activeChart, setActiveChart] = useState<MeanReversionTerminalSnapshot | null>(null);
  const dragSymbol = useRef<string | null>(null);

  function setSymbols(nextSymbols: string[]) {
    const cleanSymbols = nextSymbols.length ? nextSymbols : ["SPY"];
    const nextValue = cleanSymbols.join(",");
    localStorage.setItem(storageKey, nextValue);
    const params = new URLSearchParams(searchParams.toString());
    params.set("symbols", nextValue);
    router.push(`/strategies/mean-reversion?${params.toString()}`);
  }

  function removeSymbol(symbol: string) {
    setSymbols(symbols.filter((item) => item !== symbol));
  }

  function moveDraggedSymbol(overSymbol: string) {
    const fromSymbol = dragSymbol.current;
    if (!fromSymbol || fromSymbol === overSymbol) return;
    const nextSymbols = [...symbols];
    const fromIndex = nextSymbols.indexOf(fromSymbol);
    const toIndex = nextSymbols.indexOf(overSymbol);
    if (fromIndex < 0 || toIndex < 0) return;
    nextSymbols.splice(fromIndex, 1);
    nextSymbols.splice(toIndex, 0, fromSymbol);
    dragSymbol.current = fromSymbol;
    setSymbols(nextSymbols);
  }

  useEffect(() => {
    if (searchParams.get("symbols")) {
      localStorage.setItem(storageKey, symbols.join(","));
      return;
    }
    const savedSymbols = localStorage.getItem(storageKey);
    if (savedSymbols && savedSymbols !== symbols.join(",")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("symbols", savedSymbols);
      router.replace(`/strategies/mean-reversion?${params.toString()}`);
    } else if (!savedSymbols) {
      localStorage.setItem(storageKey, defaultSymbols);
    }
  }, [router, searchParams, symbols]);

  return (
    <div className="min-h-screen overflow-x-auto" style={{ background: terminalBg }}>
      <div className="flex min-h-screen min-w-max flex-col justify-center gap-3 p-5">
        <TickerControls symbols={symbols} setSymbols={setSymbols} />
        {snapshots.map((snapshot) => (
          <TerminalRow
            key={snapshot.symbol}
            snapshot={snapshot}
            onExpand={setActiveChart}
            onRemove={removeSymbol}
            onDragStart={(symbol) => {
              dragSymbol.current = symbol;
            }}
            onDrop={(symbol) => {
              moveDraggedSymbol(symbol);
              dragSymbol.current = null;
            }}
          />
        ))}
        <footer className="flex justify-center pt-2">
          <DisabledPagesLink />
        </footer>
      </div>
      {activeChart ? <ChartModal snapshot={activeChart} onClose={() => setActiveChart(null)} /> : null}
    </div>
  );
}
