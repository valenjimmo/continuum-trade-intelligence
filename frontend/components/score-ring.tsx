import { cn, scoreTone } from "@/lib/utils";

export function ScoreRing({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-14 w-14 text-sm" : "h-20 w-20 text-xl";
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full border-4 bg-white font-semibold", box, scoreTone(score))}
      style={{ borderColor: `color-mix(in srgb, currentColor ${Math.max(score, 20)}%, #e2e7df)` }}
      title={`Continuation score ${score}`}
    >
      {score}
    </div>
  );
}
