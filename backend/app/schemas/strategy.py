from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class StrategyDefinition(BaseModel):
    id: str
    name: str
    family: str
    description: str
    supported_timeframes: list[str]
    default_symbols: list[str]


class StrategyMetrics(BaseModel):
    total_return_percent: float
    win_rate: int = Field(ge=0, le=100)
    profit_factor: float
    max_drawdown_percent: float
    average_trade_return_percent: float
    risk_score: int = Field(ge=0, le=100)
    trade_count: int


class StrategyTrade(BaseModel):
    id: str
    symbol: str
    side: Literal["long", "short"]
    entry_time: datetime
    exit_time: datetime
    entry_price: float
    exit_price: float
    return_percent: float
    outcome: Literal["win", "loss", "flat"]
    setup_quality: int = Field(ge=0, le=100)


class StrategySignal(BaseModel):
    timestamp: datetime
    symbol: str
    action: Literal["watch", "enter", "exit"]
    price: float
    confidence: int = Field(ge=0, le=100)
    reason: str


class StrategyEquityPoint(BaseModel):
    timestamp: datetime
    value: float


class StrategyDrawdownPoint(BaseModel):
    timestamp: datetime
    drawdown_percent: float


class StrategySymbolPerformance(BaseModel):
    symbol: str
    trades: int
    win_rate: int = Field(ge=0, le=100)
    total_return_percent: float
    max_drawdown_percent: float
    current_signal: str


class StrategyDashboard(BaseModel):
    generated_at: datetime
    data_mode: str
    data_feed: str
    selected_strategy: StrategyDefinition
    available_strategies: list[StrategyDefinition]
    symbols: list[str]
    timeframe: str
    metrics: StrategyMetrics
    equity_curve: list[StrategyEquityPoint]
    drawdown_curve: list[StrategyDrawdownPoint]
    signals: list[StrategySignal]
    trades: list[StrategyTrade]
    symbol_performance: list[StrategySymbolPerformance]
