from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TerminalCandle(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float


class BollingerPoint(BaseModel):
    timestamp: datetime
    upper: float
    middle: float
    lower: float


class TerminalMetric(BaseModel):
    label: str
    value: str
    numeric_value: float
    state: Literal["bullish", "bearish", "neutral"]
    intensity: int = Field(ge=0, le=100)
    sub_label: str


class SelectedOptionContract(BaseModel):
    symbol: str
    side: Literal["call", "put"]
    expiration: str
    strike: float
    delta: float
    implied_volatility: float


class MeanReversionTerminalSnapshot(BaseModel):
    generated_at: datetime
    symbol: str
    price: float
    data_mode: str
    data_feed: str
    candles_1h: list[TerminalCandle]
    bollinger_bands: list[BollingerPoint]
    rsi_1h: list[float]
    adx_1h_series: list[float]
    metrics: list[TerminalMetric]
    selected_contract: SelectedOptionContract
    signal: str
    signal_state: Literal["bullish", "bearish", "neutral"]
    signal_intensity: int = Field(ge=0, le=100)
