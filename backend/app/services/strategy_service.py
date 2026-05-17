from datetime import datetime, timezone
from statistics import mean, pstdev
from typing import Optional

from app.core.config import Settings, get_settings
from app.repositories.market_data import MarketDataRepository
from app.schemas.market import Bar
from app.schemas.strategy import (
    StrategyDashboard,
    StrategyDefinition,
    StrategyDrawdownPoint,
    StrategyEquityPoint,
    StrategyMetrics,
    StrategySignal,
    StrategySymbolPerformance,
    StrategyTrade,
)


class StrategyService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.market_data = MarketDataRepository(self.settings)
        self._strategies = [
            StrategyDefinition(
                id="ema_9_21",
                name="EMA 9/21 Continuation",
                family="Trend following",
                description="Tracks pullbacks that hold above the 9/21 EMA stack.",
                supported_timeframes=["5Min", "15Min", "1D"],
                default_symbols=self.settings.tracked_symbols,
            ),
            StrategyDefinition(
                id="vwap_pullback",
                name="VWAP Pullback",
                family="Intraday continuation",
                description="Scores continuation attempts that reclaim or respect VWAP.",
                supported_timeframes=["5Min", "15Min"],
                default_symbols=self.settings.tracked_symbols,
            ),
            StrategyDefinition(
                id="opening_range_breakout",
                name="Opening Range Breakout",
                family="Breakout",
                description="Evaluates expansion away from the early-session range.",
                supported_timeframes=["5Min", "15Min"],
                default_symbols=self.settings.tracked_symbols,
            ),
        ]

    def list_strategies(self) -> list[StrategyDefinition]:
        return self._strategies

    def dashboard(self, strategy_id: str = "ema_9_21", timeframe: str = "5Min") -> StrategyDashboard:
        strategy = self._find_strategy(strategy_id)
        selected_timeframe = timeframe if timeframe in strategy.supported_timeframes else strategy.supported_timeframes[0]
        symbols = strategy.default_symbols
        trades: list[StrategyTrade] = []
        signals: list[StrategySignal] = []
        performance: list[StrategySymbolPerformance] = []

        for symbol in symbols:
            bars = self.market_data.get_intraday_bars(symbol)
            symbol_trades = self._build_trades(strategy.id, bars)
            trades.extend(symbol_trades)
            signals.append(self._current_signal(strategy.id, bars, symbol_trades))
            performance.append(self._symbol_performance(symbol, symbol_trades, signals[-1]))

        ordered_trades = sorted(trades, key=lambda trade: trade.exit_time)
        equity_curve, drawdown_curve = self._equity_curves(ordered_trades)

        return StrategyDashboard(
            generated_at=datetime.now(timezone.utc),
            data_mode=self.settings.data_mode,
            data_feed=self.settings.alpaca_data_feed if self.settings.data_mode.lower() == "alpaca" else "mock",
            selected_strategy=strategy,
            available_strategies=self._strategies,
            symbols=symbols,
            timeframe=selected_timeframe,
            metrics=self._metrics(ordered_trades, drawdown_curve),
            equity_curve=equity_curve,
            drawdown_curve=drawdown_curve,
            signals=signals,
            trades=ordered_trades[-24:],
            symbol_performance=performance,
        )

    def _find_strategy(self, strategy_id: str) -> StrategyDefinition:
        for strategy in self._strategies:
            if strategy.id == strategy_id:
                return strategy
        return self._strategies[0]

    def _build_trades(self, strategy_id: str, bars: list[Bar]) -> list[StrategyTrade]:
        window = 18 if strategy_id == "opening_range_breakout" else 16
        step = 14 if strategy_id == "vwap_pullback" else 16
        trades: list[StrategyTrade] = []

        for trade_index, start in enumerate(range(8, max(len(bars) - window, 9), step)):
            segment = bars[start : start + window]
            if len(segment) < window:
                continue

            entry = segment[0]
            exit_bar = segment[-1]
            side = self._side_for_strategy(strategy_id, bars[: start + 1])
            raw_return = ((exit_bar.close - entry.close) / entry.close) * 100
            return_percent = raw_return if side == "long" else -raw_return
            setup_quality = self._setup_quality(strategy_id, segment, return_percent)
            outcome = "win" if return_percent > 0.05 else "loss" if return_percent < -0.05 else "flat"
            trades.append(
                StrategyTrade(
                    id=f"{strategy_id}-{entry.symbol.lower()}-{trade_index}",
                    symbol=entry.symbol,
                    side=side,
                    entry_time=entry.timestamp,
                    exit_time=exit_bar.timestamp,
                    entry_price=entry.close,
                    exit_price=exit_bar.close,
                    return_percent=round(return_percent, 2),
                    outcome=outcome,
                    setup_quality=setup_quality,
                )
            )

        return trades

    def _side_for_strategy(self, strategy_id: str, bars: list[Bar]) -> str:
        closes = [bar.close for bar in bars]
        if strategy_id == "opening_range_breakout":
            early_high = max(bar.high for bar in bars[: min(len(bars), 6)])
            return "long" if closes[-1] >= early_high else "short"

        if strategy_id == "vwap_pullback":
            vwap = self._vwap(bars)
            return "long" if closes[-1] >= vwap else "short"

        fast = self._ema(closes, 9)[-1]
        slow = self._ema(closes, 21)[-1]
        return "long" if fast >= slow else "short"

    def _current_signal(
        self, strategy_id: str, bars: list[Bar], trades: list[StrategyTrade]
    ) -> StrategySignal:
        last = bars[-1]
        recent_return = ((bars[-1].close - bars[-8].close) / bars[-8].close) * 100
        confidence = min(95, max(35, int(58 + abs(recent_return) * 14)))
        action = "enter" if confidence >= 72 else "watch"
        if trades and trades[-1].outcome == "loss" and confidence < 62:
            action = "exit"

        return StrategySignal(
            timestamp=last.timestamp,
            symbol=last.symbol,
            action=action,
            price=last.close,
            confidence=confidence,
            reason=self._signal_reason(strategy_id, action),
        )

    def _signal_reason(self, strategy_id: str, action: str) -> str:
        if action == "exit":
            return "Setup quality deteriorated after the last completed trade."
        if strategy_id == "vwap_pullback":
            return "Price is testing VWAP continuation conditions."
        if strategy_id == "opening_range_breakout":
            return "Range expansion is developing from the opening balance."
        return "Fast EMA structure is aligned with trend continuation."

    def _setup_quality(self, strategy_id: str, bars: list[Bar], return_percent: float) -> int:
        range_percent = ((max(bar.high for bar in bars) - min(bar.low for bar in bars)) / bars[0].close) * 100
        volume_change = (bars[-1].volume - bars[0].volume) / max(bars[0].volume, 1)
        base = 58 + min(18, abs(return_percent) * 8) + min(14, abs(volume_change) * 10)
        if strategy_id == "opening_range_breakout":
            base += min(10, range_percent * 2)
        if strategy_id == "vwap_pullback":
            base += 6 if bars[-1].close >= self._vwap(bars) else -4
        return min(100, max(0, round(base)))

    def _symbol_performance(
        self, symbol: str, trades: list[StrategyTrade], signal: StrategySignal
    ) -> StrategySymbolPerformance:
        metrics = self._metrics(trades, self._equity_curves(trades)[1])
        return StrategySymbolPerformance(
            symbol=symbol,
            trades=len(trades),
            win_rate=metrics.win_rate,
            total_return_percent=metrics.total_return_percent,
            max_drawdown_percent=metrics.max_drawdown_percent,
            current_signal=f"{signal.action}: {signal.confidence}",
        )

    def _metrics(
        self, trades: list[StrategyTrade], drawdown_curve: list[StrategyDrawdownPoint]
    ) -> StrategyMetrics:
        returns = [trade.return_percent for trade in trades]
        wins = [value for value in returns if value > 0]
        losses = [abs(value) for value in returns if value < 0]
        total_return = sum(returns)
        win_rate = int(round((len(wins) / len(returns)) * 100)) if returns else 0
        profit_factor = round(sum(wins) / sum(losses), 2) if losses else round(sum(wins), 2)
        max_drawdown = abs(min((point.drawdown_percent for point in drawdown_curve), default=0))
        volatility = pstdev(returns) if len(returns) > 1 else 0
        risk_adjusted = (mean(returns) / volatility) if volatility else mean(returns) if returns else 0
        risk_score = min(100, max(0, int(round(55 + risk_adjusted * 18 - max_drawdown * 2))))

        return StrategyMetrics(
            total_return_percent=round(total_return, 2),
            win_rate=win_rate,
            profit_factor=profit_factor,
            max_drawdown_percent=round(max_drawdown, 2),
            average_trade_return_percent=round(mean(returns), 2) if returns else 0,
            risk_score=risk_score,
            trade_count=len(trades),
        )

    def _equity_curves(
        self, trades: list[StrategyTrade]
    ) -> tuple[list[StrategyEquityPoint], list[StrategyDrawdownPoint]]:
        equity = 100.0
        peak = equity
        equity_curve: list[StrategyEquityPoint] = []
        drawdown_curve: list[StrategyDrawdownPoint] = []

        for trade in trades:
            equity *= 1 + trade.return_percent / 100
            peak = max(peak, equity)
            drawdown = ((equity - peak) / peak) * 100
            equity_curve.append(StrategyEquityPoint(timestamp=trade.exit_time, value=round(equity, 2)))
            drawdown_curve.append(
                StrategyDrawdownPoint(timestamp=trade.exit_time, drawdown_percent=round(drawdown, 2))
            )

        return equity_curve, drawdown_curve

    def _ema(self, values: list[float], period: int) -> list[float]:
        if not values:
            return []
        multiplier = 2 / (period + 1)
        output = [values[0]]
        for value in values[1:]:
            output.append((value - output[-1]) * multiplier + output[-1])
        return output

    def _vwap(self, bars: list[Bar]) -> float:
        volume = sum(bar.volume for bar in bars)
        if volume == 0:
            return bars[-1].close
        return sum(((bar.high + bar.low + bar.close) / 3) * bar.volume for bar in bars) / volume
