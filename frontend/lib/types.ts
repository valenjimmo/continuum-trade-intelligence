export type TrendState = "bullish" | "bearish" | "neutral" | "compression";
export type RegimeType = "TREND_DAY" | "CHOP_DAY" | "BALANCED_DAY" | "EXPANSION_DAY" | "REVERSAL_DAY";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type IntradayRegime =
  | "TREND_UP"
  | "TREND_DOWN"
  | "CHOP_MEAN_REVERSION"
  | "COMPRESSION"
  | "EXPANSION_MOMENTUM";

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

export type RegimeFeatureScores = {
  vwap_alignment: number;
  opening_range_acceptance: number;
  ema_alignment: number;
  candle_efficiency: number;
  volume_expansion: number;
  range_expansion: number;
  trend_persistence: number;
  compression: number;
  relative_strength: number;
};

export type StrategyRecommendation = {
  strategy_id: string;
  name: string;
  suitability_score: number;
  rationale: string;
};

export type RegimeSnapshot = {
  symbol: string;
  timestamp: string;
  timeframe: string;
  price: number;
  regime: IntradayRegime;
  confidence: Confidence;
  confidence_score: number;
  direction_score: number;
  feature_scores: RegimeFeatureScores;
  strategy_recommendations: StrategyRecommendation[];
  explanation: string;
  engine_version: string;
};

export type RegimeDashboard = {
  generated_at: string;
  timeframe: string;
  symbols: RegimeSnapshot[];
  primary_regime: IntradayRegime;
  market_confidence: Confidence;
  market_confidence_score: number;
};

export type StrategyDefinition = {
  id: string;
  name: string;
  family: string;
  description: string;
  supported_timeframes: string[];
  default_symbols: string[];
};

export type StrategyMetrics = {
  total_return_percent: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown_percent: number;
  average_trade_return_percent: number;
  risk_score: number;
  trade_count: number;
};

export type StrategyTrade = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  return_percent: number;
  outcome: "win" | "loss" | "flat";
  setup_quality: number;
};

export type StrategySignal = {
  timestamp: string;
  symbol: string;
  action: "watch" | "enter" | "exit";
  price: number;
  confidence: number;
  reason: string;
};

export type StrategyEquityPoint = {
  timestamp: string;
  value: number;
};

export type StrategyDrawdownPoint = {
  timestamp: string;
  drawdown_percent: number;
};

export type StrategySymbolPerformance = {
  symbol: string;
  trades: number;
  win_rate: number;
  total_return_percent: number;
  max_drawdown_percent: number;
  current_signal: string;
};

export type StrategyDashboard = {
  generated_at: string;
  data_mode: string;
  data_feed: string;
  selected_strategy: StrategyDefinition;
  available_strategies: StrategyDefinition[];
  symbols: string[];
  timeframe: string;
  metrics: StrategyMetrics;
  equity_curve: StrategyEquityPoint[];
  drawdown_curve: StrategyDrawdownPoint[];
  signals: StrategySignal[];
  trades: StrategyTrade[];
  symbol_performance: StrategySymbolPerformance[];
};

export type TerminalMetricState = "bullish" | "bearish" | "neutral";

export type TerminalCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type BollingerPoint = {
  timestamp: string;
  upper: number;
  middle: number;
  lower: number;
};

export type TerminalMetric = {
  label: string;
  value: string;
  numeric_value: number;
  state: TerminalMetricState;
  intensity: number;
  sub_label: string;
};

export type SelectedOptionContract = {
  symbol: string;
  side: "call" | "put";
  expiration: string;
  strike: number;
  delta: number;
  implied_volatility: number;
};

export type MeanReversionTerminalSnapshot = {
  generated_at: string;
  symbol: string;
  price: number;
  data_mode: string;
  data_feed: string;
  candles_1h: TerminalCandle[];
  bollinger_bands: BollingerPoint[];
  rsi_1h: number[];
  adx_1h_series: number[];
  metrics: TerminalMetric[];
  selected_contract: SelectedOptionContract;
  signal: string;
  signal_state: TerminalMetricState;
  signal_intensity: number;
};
