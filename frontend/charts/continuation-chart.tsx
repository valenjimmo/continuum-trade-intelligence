"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { SymbolAnalysis } from "@/lib/types";

export function ContinuationChart({ symbols }: { symbols: SymbolAnalysis[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height: 260,
      layout: { background: { type: ColorType.Solid, color: "#ffffff" }, textColor: "#40566b" },
      grid: { vertLines: { color: "#edf0ea" }, horzLines: { color: "#edf0ea" } },
      rightPriceScale: { borderColor: "#d8ddd5" },
      timeScale: { borderColor: "#d8ddd5" }
    });
    const series = chart.addHistogramSeries({ color: "#176b5b", priceFormat: { type: "volume" } });
    const now = Math.floor(Date.now() / 1000);
    series.setData(
      symbols.map((symbol, index) => ({
        time: (now + index * 300) as never,
        value: symbol.continuation_score,
        color: symbol.continuation_score >= 75 ? "#176b5b" : symbol.continuation_score >= 55 ? "#b67a18" : "#b73737"
      }))
    );
    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: ref.current?.clientWidth ?? 0 });
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [symbols]);

  return <div ref={ref} className="h-[260px] w-full" />;
}
