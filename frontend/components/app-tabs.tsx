"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Trend Continuation", icon: Activity },
  { href: "/strategies/mean-reversion", label: "Options MR", icon: CandlestickChart }
];

export function AppTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Analytics workspaces">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.href === "/" ? pathname === "/" : pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-pine bg-pine text-white"
                : "border-line bg-background text-ink/70 hover:bg-white hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
