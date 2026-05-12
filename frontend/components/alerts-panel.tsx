import { Bell, Send } from "lucide-react";
import type { AlertSummary } from "@/lib/types";
import { ScoreRing } from "@/components/score-ring";

export function AlertsPanel({ alerts }: { alerts: AlertSummary[] }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5" />
          Alerts
        </h2>
        <button className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink/70 hover:bg-background" title="Send alert summary">
          <Send className="h-4 w-4" />
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-6 text-sm text-ink/60">
          No high-confidence continuation alerts. Conditions are being monitored.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 rounded-md border border-line p-3">
              <ScoreRing score={alert.score} size="sm" />
              <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="text-sm text-ink/60">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
