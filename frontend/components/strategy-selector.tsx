"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { StrategyDefinition } from "@/lib/types";

export function StrategySelector({
  strategies,
  selectedStrategyId,
  timeframe
}: {
  strategies: StrategyDefinition[];
  selectedStrategyId: string;
  timeframe: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(next: { strategyId?: string; timeframe?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("strategy", next.strategyId ?? selectedStrategyId);
    params.set("timeframe", next.timeframe ?? timeframe);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selected = strategies.find((strategy) => strategy.id === selectedStrategyId) ?? strategies[0];

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-ink/55">Strategy</span>
        <select
          value={selectedStrategyId}
          onChange={(event) => {
            const nextStrategy = strategies.find((strategy) => strategy.id === event.target.value);
            update({
              strategyId: event.target.value,
              timeframe: nextStrategy?.supported_timeframes.includes(timeframe)
                ? timeframe
                : nextStrategy?.supported_timeframes[0]
            });
          }}
          className="w-full rounded-md border-line bg-white text-sm font-medium"
        >
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-ink/55">Timeframe</span>
        <select
          value={timeframe}
          onChange={(event) => update({ timeframe: event.target.value })}
          className="w-full rounded-md border-line bg-white text-sm font-medium"
        >
          {selected.supported_timeframes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
