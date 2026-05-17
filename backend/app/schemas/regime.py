from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.schemas.market import Confidence


class IntradayRegime(str, Enum):
    trend_up = "TREND_UP"
    trend_down = "TREND_DOWN"
    chop_mean_reversion = "CHOP_MEAN_REVERSION"
    compression = "COMPRESSION"
    expansion_momentum = "EXPANSION_MOMENTUM"


class RegimeFeatureScores(BaseModel):
    vwap_alignment: int = Field(ge=0, le=100)
    opening_range_acceptance: int = Field(ge=0, le=100)
    ema_alignment: int = Field(ge=0, le=100)
    candle_efficiency: int = Field(ge=0, le=100)
    volume_expansion: int = Field(ge=0, le=100)
    range_expansion: int = Field(ge=0, le=100)
    trend_persistence: int = Field(ge=0, le=100)
    compression: int = Field(ge=0, le=100)
    relative_strength: int = Field(ge=0, le=100)


class StrategyRecommendation(BaseModel):
    strategy_id: str
    name: str
    suitability_score: int = Field(ge=0, le=100)
    rationale: str


class RegimeSnapshot(BaseModel):
    symbol: str
    timestamp: datetime
    timeframe: str
    price: float
    regime: IntradayRegime
    confidence: Confidence
    confidence_score: int = Field(ge=0, le=100)
    direction_score: int = Field(ge=-100, le=100)
    feature_scores: RegimeFeatureScores
    strategy_recommendations: list[StrategyRecommendation]
    explanation: str
    engine_version: str


class RegimeDashboard(BaseModel):
    generated_at: datetime
    timeframe: str
    symbols: list[RegimeSnapshot]
    primary_regime: IntradayRegime
    market_confidence: Confidence
    market_confidence_score: int = Field(ge=0, le=100)
