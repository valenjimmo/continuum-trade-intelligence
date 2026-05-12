export type TrendState = "bullish" | "bearish" | "neutral" | "compression";
export type RegimeType = "TREND_DAY" | "CHOP_DAY" | "BALANCED_DAY" | "EXPANSION_DAY" | "REVERSAL_DAY";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type ContinuationFactors = {
  vwap_respect: number;
  relative_volume: number;
  pullback_quality: number;
  candle_acceptance: number;
  momentum_stability: number;
  breakout_quality: number;
  trend_persistence: number;
  liquidity_sweeps: number;
};

export type SymbolAnalysis = {
  ticker: string;
  timestamp: string;
  price: number;
  trend: TrendState;
  continuation_score: number;
  regime: RegimeType;
  confidence: Confidence;
  correlation_confirmation: boolean;
  participation_score: number;
  summary: string;
  factors: ContinuationFactors;
  levels: {
    previous_day_high: number;
    previous_day_low: number;
    prior_close: number;
    premarket_high: number;
    premarket_low: number;
    opening_range_high: number;
    opening_range_low: number;
    vwap: number;
    ema_9: number;
    ema_21: number;
    ema_50: number;
  };
  structure: {
    breakout_status: string;
    compression_score: number;
    higher_highs: number;
    higher_lows: number;
    lower_highs: number;
    lower_lows: number;
    trend: TrendState;
  };
};

export type DashboardSnapshot = {
  generated_at: string;
  data_mode: string;
  data_feed: string;
  refresh_seconds: number;
  symbols: SymbolAnalysis[];
  market_bias: TrendState;
  regime: RegimeType;
  participation_score: number;
};

export type AlertSummary = {
  id: string;
  created_at: string;
  ticker: string;
  severity: Confidence;
  title: string;
  message: string;
  score: number;
};

export type ReplayEvent = {
  id: string;
  timestamp: string;
  ticker: string;
  regime: RegimeType;
  continuation_score: number;
  outcome: string;
  max_favorable_excursion: number;
  max_adverse_excursion: number;
  failure_reason: string | null;
};

export type AppSnapshot = {
  dashboard: DashboardSnapshot;
  alerts: AlertSummary[];
  replay: ReplayEvent[];
};
