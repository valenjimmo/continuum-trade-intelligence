import Link from "next/link";
import { Database, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
  {
    id: "mock",
    label: "Mock",
    description: "Generated local bars",
    icon: Database
  },
  {
    id: "alpaca",
    label: "Alpaca",
    description: "Market data API",
    icon: Radio
  }
];

export function DataModeSwitch({ activeMode }: { activeMode: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Data mode">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;

        return (
          <Link
            key={mode.id}
            href={`/?data_mode=${mode.id}`}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-pine bg-pine text-white"
                : "border-line bg-background text-ink/70 hover:bg-white hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{mode.label}</span>
            <span className={cn("hidden text-xs sm:inline", active ? "text-white/75" : "text-ink/45")}>
              {mode.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
