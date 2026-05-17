"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Clock3 } from "lucide-react";

const timeframes = [
  { value: "1Min", label: "1 minute" },
  { value: "5Min", label: "5 minutes" },
  { value: "15Min", label: "15 minutes" },
  { value: "30Min", label: "30 minutes" },
  { value: "1Hour", label: "1 hour" }
];

export function TimeframeSelect({ activeTimeframe }: { activeTimeframe: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateTimeframe(nextTimeframe: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("timeframe", nextTimeframe);
    router.push(`/?${params.toString()}`);
  }

  return (
    <label className="flex min-h-10 items-center gap-2 rounded-md border border-line bg-background px-3 py-2 text-sm text-ink/70">
      <Clock3 className="h-4 w-4" />
      <span className="whitespace-nowrap font-medium">Bar timeframe</span>
      <select
        value={activeTimeframe}
        onChange={(event) => updateTimeframe(event.target.value)}
        className="bg-transparent text-sm font-semibold text-ink outline-none"
      >
        {timeframes.map((timeframe) => (
          <option key={timeframe.value} value={timeframe.value}>
            {timeframe.label}
          </option>
        ))}
      </select>
    </label>
  );
}
