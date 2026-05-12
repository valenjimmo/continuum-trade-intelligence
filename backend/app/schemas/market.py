from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TrendState(str, Enum):
    bullish = "bullish"
    bearish = "bearish"
    neutral = "neutral"
    compression = "compression"


class RegimeType(str, Enum):
    trend_day = "TREND_DAY"
    chop_day = "CHOP_DAY"
    balanced_day = "BALANCED_DAY"
    expansion_day = "EXPANSION_DAY"
    reversal_day = "REVERSAL_DAY"


class Confidence(str, Enum):
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"


class Bar(BaseModel):
    timestamp: datetime
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class MarketLevels(BaseModel):
    previous_day_high: float
    previous_day_low: float
    prior_close: float
    premarket_high: float
    premarket_low: float
    opening_range_high: float
    opening_range_low: float
    vwap: float
    ema_9: float
    ema_21: float
    ema_50: float


class StructureSnapshot(BaseModel):
    trend: TrendState
    higher_highs: int
    higher_lows: int
    lower_highs: int
    lower_lows: int
    breakout_status: str
    compression_score: int = Field(ge=0, le=100)


class ContinuationFactors(BaseModel):
    vwap_respect: int = Field(ge=0, le=100)
    relative_volume: int = Field(ge=0, le=100)
    pullback_quality: int = Field(ge=0, le=100)
    candle_acceptance: int = Field(ge=0, le=100)
    momentum_stability: int = Field(ge=0, le=100)
    breakout_quality: int = Field(ge=0, le=100)
    trend_persistence: int = Field(ge=0, le=100)
    liquidity_sweeps: int = Field(ge=0, le=100)


class SymbolAnalysis(BaseModel):
    ticker: str
    timestamp: datetime
    price: float
    trend: TrendState
    continuation_score: int = Field(ge=0, le=100)
    regime: RegimeType
    confidence: Confidence
    correlation_confirmation: bool
    participation_score: int = Field(ge=0, le=100)
    levels: MarketLevels
    structure: StructureSnapshot
    factors: ContinuationFactors
    summary: str


class DashboardSnapshot(BaseModel):
    generated_at: datetime
    data_mode: str
    data_feed: str
    refresh_seconds: int
    symbols: list[SymbolAnalysis]
    market_bias: TrendState
    regime: RegimeType
    participation_score: int = Field(ge=0, le=100)


class AlertSummary(BaseModel):
    id: str
    created_at: datetime
    ticker: str
    severity: Confidence
    title: str
    message: str
    score: int = Field(ge=0, le=100)


class ReplayEvent(BaseModel):
    id: str
    timestamp: datetime
    ticker: str
    regime: RegimeType
    continuation_score: int = Field(ge=0, le=100)
    outcome: str
    max_favorable_excursion: float
    max_adverse_excursion: float
    failure_reason: Optional[str] = None


class AppSnapshot(BaseModel):
    dashboard: DashboardSnapshot
    alerts: list[AlertSummary]
    replay: list[ReplayEvent]
