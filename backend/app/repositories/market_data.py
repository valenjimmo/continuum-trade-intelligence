from datetime import datetime, timedelta, timezone
from math import sin
from random import Random

from app.schemas.market import Bar


class MarketDataRepository:
    """Boundary for market data. Swap this class for Alpaca/Yahoo-backed data later."""

    def get_intraday_bars(self, symbol: str, periods: int = 96) -> list[Bar]:
        seed = sum(ord(char) for char in symbol)
        rng = Random(seed)
        base = {"SPY": 522.0, "QQQ": 445.0, "IWM": 205.0, "VIX": 17.4, "DXY": 104.2, "TNX": 4.45}.get(
            symbol, 100.0
        )
        now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        start = now - timedelta(minutes=5 * (periods - 1))
        bars: list[Bar] = []
        price = base + rng.uniform(-1.5, 1.5)

        for index in range(periods):
            drift = (index / periods) * rng.uniform(0.4, 2.6)
            wave = sin(index / 7) * rng.uniform(0.15, 0.9)
            shock = rng.uniform(-0.35, 0.35)
            open_price = price
            close = base + drift + wave + shock
            high = max(open_price, close) + rng.uniform(0.05, 0.55)
            low = min(open_price, close) - rng.uniform(0.05, 0.55)
            volume = int(450_000 + (index % 12) * 22_000 + rng.randint(0, 140_000))
            bars.append(
                Bar(
                    timestamp=start + timedelta(minutes=5 * index),
                    symbol=symbol,
                    open=round(open_price, 2),
                    high=round(high, 2),
                    low=round(low, 2),
                    close=round(close, 2),
                    volume=volume,
                )
            )
            price = close

        return bars
