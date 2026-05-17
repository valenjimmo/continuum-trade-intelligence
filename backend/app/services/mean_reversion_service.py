from datetime import datetime, timedelta, timezone
from math import sqrt
from statistics import fmean, pstdev
from typing import Literal, Optional

from app.core.config import Settings, get_settings
from app.repositories.market_data import MarketDataRepository
from app.schemas.market import Bar
from app.schemas.mean_reversion import (
    BollingerPoint,
    MeanReversionTerminalSnapshot,
    SelectedOptionContract,
    TerminalCandle,
    TerminalMetric,
)


SignalState = Literal["bullish", "bearish", "neutral"]


class MeanReversionService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.market_data = MarketDataRepository(self.settings)

    def terminal(self, symbol: str = "SPY") -> MeanReversionTerminalSnapshot:
        ticker = symbol.upper().replace("-", "").replace("/", "")
        bars_1h = self._resample(self.market_data.get_intraday_bars(ticker, periods=960), group_size=12)
        bars_4h = self._resample(bars_1h, group_size=4)
        if len(bars_1h) < 72:
            bars_1h = self._extend_hourly_bars(ticker, bars_1h)
            bars_4h = self._resample(bars_1h, group_size=4)

        closes_1h = [bar.close for bar in bars_1h]
        rsi_1h = self._rsi_series(closes_1h)
        adx_1h_series = self._adx_series(bars_1h)
        rsi_4h = self._last(self._rsi_series([bar.close for bar in bars_4h]), 50.0)
        adx_4h = self._last(self._adx_series(bars_4h), 20.0)
        adx_1h = self._last(adx_1h_series, 20.0)
        bands = self._bollinger_bands(bars_1h)
        latest_band = bands[-1]
        price = bars_1h[-1].close
        bb_distance = self._band_distance(price, latest_band)
        iv_rank = self._synthetic_iv_rank(ticker, bars_1h)
        contract = self._select_contract(ticker, price, rsi_4h, bb_distance, iv_rank)
        metrics = [
            self._metric_4h_rsi(rsi_4h),
            self._metric_4h_adx(adx_4h),
            self._metric_1h_adx(adx_1h),
            self._metric_iv_rank(iv_rank),
            self._metric_bb_distance(bb_distance),
            self._metric_delta(contract.delta),
        ]
        signal_state, signal, signal_intensity = self._signal(metrics, contract)

        return MeanReversionTerminalSnapshot(
            generated_at=datetime.now(timezone.utc),
            symbol=ticker,
            price=price,
            data_mode=self.settings.data_mode,
            data_feed=self.settings.alpaca_data_feed if self.settings.data_mode.lower() == "alpaca" else "mock",
            candles_1h=[
                TerminalCandle(
                    timestamp=bar.timestamp,
                    open=bar.open,
                    high=bar.high,
                    low=bar.low,
                    close=bar.close,
                )
                for bar in bars_1h[-36:]
            ],
            bollinger_bands=bands[-36:],
            rsi_1h=rsi_1h[-36:],
            adx_1h_series=adx_1h_series[-36:],
            metrics=metrics,
            selected_contract=contract,
            signal=signal,
            signal_state=signal_state,
            signal_intensity=signal_intensity,
        )

    def _resample(self, bars: list[Bar], group_size: int) -> list[Bar]:
        if not bars:
            return []
        output: list[Bar] = []
        for index in range(0, len(bars), group_size):
            group = bars[index : index + group_size]
            if len(group) < group_size:
                continue
            output.append(
                Bar(
                    timestamp=group[-1].timestamp,
                    symbol=group[-1].symbol,
                    open=group[0].open,
                    high=round(max(bar.high for bar in group), 2),
                    low=round(min(bar.low for bar in group), 2),
                    close=group[-1].close,
                    volume=sum(bar.volume for bar in group),
                )
            )
        return output

    def _extend_hourly_bars(self, symbol: str, bars: list[Bar]) -> list[Bar]:
        if not bars:
            return self._resample(self.market_data.get_intraday_bars(symbol, periods=480), group_size=12)
        output = list(bars)
        while len(output) < 72:
            first = output[0]
            drift = 0.9985 if len(output) % 3 else 1.001
            output.insert(
                0,
                Bar(
                    timestamp=first.timestamp - timedelta(hours=1),
                    symbol=first.symbol,
                    open=round(first.open * drift, 2),
                    high=round(first.high * max(drift, 1), 2),
                    low=round(first.low * min(drift, 1), 2),
                    close=round(first.close * drift, 2),
                    volume=first.volume,
                ),
            )
        return output

    def _rsi_series(self, closes: list[float], period: int = 14) -> list[float]:
        if len(closes) < 2:
            return [50.0 for _ in closes]
        values: list[float] = []
        for index in range(len(closes)):
            if index < period:
                values.append(50.0)
                continue
            changes = [closes[item] - closes[item - 1] for item in range(index - period + 1, index + 1)]
            gains = [max(change, 0) for change in changes]
            losses = [abs(min(change, 0)) for change in changes]
            avg_gain = fmean(gains) if gains else 0
            avg_loss = fmean(losses) if losses else 0
            if avg_loss == 0:
                values.append(100.0)
            else:
                relative_strength = avg_gain / avg_loss
                values.append(round(100 - (100 / (1 + relative_strength)), 1))
        return values

    def _adx_series(self, bars: list[Bar], period: int = 14) -> list[float]:
        if len(bars) < 2:
            return [20.0 for _ in bars]

        true_ranges: list[float] = []
        plus_dm: list[float] = []
        minus_dm: list[float] = []
        for index in range(1, len(bars)):
            current = bars[index]
            previous = bars[index - 1]
            high_move = current.high - previous.high
            low_move = previous.low - current.low
            true_ranges.append(
                max(current.high - current.low, abs(current.high - previous.close), abs(current.low - previous.close))
            )
            plus_dm.append(high_move if high_move > low_move and high_move > 0 else 0)
            minus_dm.append(low_move if low_move > high_move and low_move > 0 else 0)

        values = [20.0]
        dx_values: list[float] = []
        for index in range(len(true_ranges)):
            if index < period:
                values.append(20.0)
                continue
            tr_sum = sum(true_ranges[index - period + 1 : index + 1])
            plus = 100 * sum(plus_dm[index - period + 1 : index + 1]) / tr_sum if tr_sum else 0
            minus = 100 * sum(minus_dm[index - period + 1 : index + 1]) / tr_sum if tr_sum else 0
            dx = 100 * abs(plus - minus) / (plus + minus) if plus + minus else 0
            dx_values.append(dx)
            values.append(round(fmean(dx_values[-period:]), 1))
        return values

    def _bollinger_bands(self, bars: list[Bar], period: int = 20, deviations: float = 2.0) -> list[BollingerPoint]:
        closes = [bar.close for bar in bars]
        output: list[BollingerPoint] = []
        for index, bar in enumerate(bars):
            window = closes[max(0, index - period + 1) : index + 1]
            middle = fmean(window)
            spread = pstdev(window) if len(window) > 1 else 0
            output.append(
                BollingerPoint(
                    timestamp=bar.timestamp,
                    upper=round(middle + spread * deviations, 2),
                    middle=round(middle, 2),
                    lower=round(middle - spread * deviations, 2),
                )
            )
        return output

    def _band_distance(self, price: float, band: BollingerPoint) -> float:
        half_width = max((band.upper - band.lower) / 2, 0.01)
        distance_from_mid = abs(price - band.middle)
        return round(min(100, (distance_from_mid / half_width) * 100), 1)

    def _synthetic_iv_rank(self, symbol: str, bars: list[Bar]) -> float:
        returns = [
            abs((bars[index].close - bars[index - 1].close) / bars[index - 1].close)
            for index in range(1, len(bars))
            if bars[index - 1].close
        ]
        realized = (pstdev(returns) * sqrt(252 * 6.5)) if len(returns) > 1 else 0.12
        symbol_bias = (sum(ord(char) for char in symbol) % 19) - 9
        return round(min(88, max(8, realized * 100 + 18 + symbol_bias)), 1)

    def _select_contract(
        self, symbol: str, price: float, rsi_4h: float, bb_distance: float, iv_rank: float
    ) -> SelectedOptionContract:
        side: Literal["call", "put"] = "call" if rsi_4h >= 50 else "put"
        strike_step = 1 if price < 100 else 5
        strike = round(round(price / strike_step) * strike_step, 2)
        delta_base = 0.52 + min(0.14, bb_distance / 1000)
        delta = round(delta_base if side == "call" else -delta_base, 2)
        expiration = (datetime.now(timezone.utc).date() + timedelta(days=14)).isoformat()
        suffix = "C" if side == "call" else "P"
        contract_symbol = f"{symbol}{expiration.replace('-', '')}{suffix}{int(strike * 1000):08d}"
        return SelectedOptionContract(
            symbol=contract_symbol,
            side=side,
            expiration=expiration,
            strike=strike,
            delta=delta,
            implied_volatility=round((iv_rank + 20) / 100, 2),
        )

    def _metric_4h_rsi(self, value: float) -> TerminalMetric:
        state: SignalState = "bullish" if value >= 55 else "bearish" if value <= 45 else "neutral"
        intensity = round(min(100, abs(value - 50) * 4))
        return TerminalMetric(
            label="4H RSI",
            value=f"{value:.1f}",
            numeric_value=round(value, 1),
            state=state,
            intensity=intensity,
            sub_label="BULLISH FILTER" if state == "bullish" else "BEARISH FILTER" if state == "bearish" else "RANGE FILTER",
        )

    def _metric_4h_adx(self, value: float) -> TerminalMetric:
        state: SignalState = "neutral" if value < 18 else "bullish" if value <= 32 else "bearish"
        intensity = round(min(100, value * 2.2))
        return TerminalMetric(
            label="4H ADX",
            value=f"{value:.1f}",
            numeric_value=round(value, 1),
            state=state,
            intensity=intensity,
            sub_label="TREND USABLE" if state == "bullish" else "TREND HOT" if state == "bearish" else "LOW TREND",
        )

    def _metric_1h_adx(self, value: float) -> TerminalMetric:
        state: SignalState = "bullish" if 18 <= value <= 28 else "bearish" if value > 38 else "neutral"
        intensity = round(min(100, value * 2.4))
        return TerminalMetric(
            label="1H ADX",
            value=f"{value:.1f}",
            numeric_value=round(value, 1),
            state=state,
            intensity=intensity,
            sub_label="EXECUTION OK" if state == "bullish" else "MOMENTUM RISK" if state == "bearish" else "WAIT",
        )

    def _metric_iv_rank(self, value: float) -> TerminalMetric:
        state: SignalState = "bullish" if value <= 30 else "bearish" if value >= 55 else "neutral"
        intensity = round(100 - value if state == "bullish" else value)
        return TerminalMetric(
            label="IV RANK",
            value=f"{value:.0f}%",
            numeric_value=round(value, 1),
            state=state,
            intensity=intensity,
            sub_label="OPTIONS CHEAP" if state == "bullish" else "OPTIONS RICH" if state == "bearish" else "FAIR PREMIUM",
        )

    def _metric_bb_distance(self, value: float) -> TerminalMetric:
        state: SignalState = "bullish" if value >= 78 else "neutral"
        return TerminalMetric(
            label="1H BB DIST",
            value=f"{value:.0f}%",
            numeric_value=round(value, 1),
            state=state,
            intensity=round(value),
            sub_label="ENTRY PROXIMITY" if state == "bullish" else "NOT AT BAND",
        )

    def _metric_delta(self, value: float) -> TerminalMetric:
        magnitude = abs(value)
        state: SignalState = "bullish" if 0.45 <= magnitude <= 0.65 else "neutral"
        return TerminalMetric(
            label="DELTA",
            value=f"{value:.2f}",
            numeric_value=value,
            state=state,
            intensity=round(min(100, magnitude * 140)),
            sub_label="CONTRACT TARGET" if state == "bullish" else "SENSITIVITY OFF",
        )

    def _signal(
        self, metrics: list[TerminalMetric], contract: SelectedOptionContract
    ) -> tuple[SignalState, str, int]:
        bullish = sum(metric.state == "bullish" for metric in metrics)
        bearish = sum(metric.state == "bearish" for metric in metrics)
        if bearish >= 2:
            return "bearish", "STRATEGY: WAIT", min(100, bearish * 28)
        if bullish >= 5:
            action = "LONG CALL" if contract.side == "call" else "LONG PUT"
            return "bullish", f"STRATEGY: {action}", min(100, bullish * 18)
        return "neutral", "STRATEGY: WAIT", max(20, bullish * 16)

    def _last(self, values: list[float], fallback: float) -> float:
        return values[-1] if values else fallback
