import type { ReplayEvent } from "@/lib/types";
import { scoreTone } from "@/lib/utils";

export function ReplayTable({ events }: { events: ReplayEvent[] }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <h2 className="mb-4 text-lg font-semibold">Replay Review</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink/55">
              <th className="py-2 font-medium">Ticker</th>
              <th className="py-2 font-medium">Regime</th>
              <th className="py-2 font-medium">Score</th>
              <th className="py-2 font-medium">Outcome</th>
              <th className="py-2 font-medium">MFE</th>
              <th className="py-2 font-medium">MAE</th>
              <th className="py-2 font-medium">Failure</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-line last:border-0">
                <td className="py-3 font-semibold">{event.ticker}</td>
                <td className="py-3">{event.regime.replace("_", " ")}</td>
                <td className={`py-3 font-semibold ${scoreTone(event.continuation_score)}`}>{event.continuation_score}</td>
                <td className="py-3">{event.outcome.replaceAll("_", " ")}</td>
                <td className="py-3 text-pine">{event.max_favorable_excursion.toFixed(2)}%</td>
                <td className="py-3 text-danger">{event.max_adverse_excursion.toFixed(2)}%</td>
                <td className="py-3 text-ink/60">{event.failure_reason ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
