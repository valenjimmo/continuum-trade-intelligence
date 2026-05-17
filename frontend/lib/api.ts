import type {
  AlertSummary,
  AppSnapshot,
  DashboardSnapshot,
  ReplayEvent,
  StrategyDashboard,
  StrategyDefinition
} from "@/lib/types";

const API_BASE =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 20 } });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getDashboard() {
  return getJson<DashboardSnapshot>("/dashboard");
}

export function getOverview() {
  return getJson<AppSnapshot>("/overview");
}

export function getAlerts() {
  return getJson<AlertSummary[]>("/alerts");
}

export function getReplay() {
  return getJson<ReplayEvent[]>("/replay");
}

export function getStrategies() {
  return getJson<StrategyDefinition[]>("/strategies");
}

export function getStrategyDashboard(strategyId = "ema_9_21", timeframe = "5Min") {
  return getJson<StrategyDashboard>(`/strategies/${strategyId}/dashboard?timeframe=${timeframe}`);
}
