import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreTone(score: number) {
  if (score >= 75) return "text-pine";
  if (score >= 55) return "text-amber";
  return "text-danger";
}

export function trendTone(trend: string) {
  if (trend === "bullish") return "bg-pine/10 text-pine border-pine/20";
  if (trend === "bearish") return "bg-danger/10 text-danger border-danger/20";
  if (trend === "compression") return "bg-amber/10 text-amber border-amber/20";
  return "bg-steel/10 text-steel border-steel/20";
}
