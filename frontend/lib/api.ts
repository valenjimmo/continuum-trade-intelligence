import type {
  AlertSummary,
  AppSnapshot,
  DashboardSnapshot,
  MeanReversionTerminalSnapshot,
  RegimeDashboard,
  RegimeSnapshot,
  ReplayEvent,
  StrategyDashboard,
  StrategyDefinition
} from "@/lib/types";

const API_BASE =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function requestQuery(dataMode?: string, timeframe?: string) {
  const params = new URLSearchParams();
  if (dataMode) params.set("data_mode", dataMode);
  if (timeframe) params.set("timeframe", timeframe);
  return params.toString();
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 20 } });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getDashboard(dataMode?: string, timeframe?: string) {
  const query = requestQuery(dataMode, timeframe);
  return getJson<DashboardSnapshot>(`/dashboard${query ? `?${query}` : ""}`);
}

export function getOverview(dataMode?: string, timeframe?: string) {
  const query = requestQuery(dataMode, timeframe);
  return getJson<AppSnapshot>(`/overview${query ? `?${query}` : ""}`);
}

export function getAlerts() {
  return getJson<AlertSummary[]>("/alerts");
}

export function getReplay() {
  return getJson<ReplayEvent[]>("/replay");
}

export function getRegimes(timeframe = "5Min", dataMode?: string) {
  const params = new URLSearchParams({ timeframe });
  if (dataMode) params.set("data_mode", dataMode);
  return getJson<RegimeDashboard>(`/regimes?${params.toString()}`);
}

export function getRegimeHistory(symbol: string, limit = 50) {
  return getJson<RegimeSnapshot[]>(
    `/regimes/${encodeURIComponent(symbol)}/history?limit=${limit}`
  );
}

export function getStrategies() {
  return getJson<StrategyDefinition[]>("/strategies");
}

export function getStrategyDashboard(strategyId = "ema_9_21", timeframe = "5Min") {
  return getJson<StrategyDashboard>(`/strategies/${strategyId}/dashboard?timeframe=${timeframe}`);
}

export function getMeanReversionTerminal(symbol = "SPY") {
  return getJson<MeanReversionTerminalSnapshot>(`/strategies/mean-reversion/${encodeURIComponent(symbol)}`);
}

export function getMeanReversionTerminals(symbols = "SPY,QQQ,IWM") {
  return getJson<MeanReversionTerminalSnapshot[]>(
    `/strategies/mean-reversion?symbols=${encodeURIComponent(symbols)}`
  );
}
