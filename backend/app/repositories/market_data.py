from datetime import datetime, timedelta, timezone
import logging
from math import sin
from random import Random
from typing import Optional

import httpx

from app.core.config import Settings, get_settings
from app.schemas.market import Bar

logger = logging.getLogger(__name__)


class MarketDataRepository:
    """Boundary for market data providers."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()

    def get_intraday_bars(self, symbol: str, periods: int = 96) -> list[Bar]:
        if self.settings.data_mode.lower() == "alpaca":
            try:
                return self._get_alpaca_bars(symbol, min(periods, self.settings.alpaca_bars_limit))
            except Exception as exc:
                logger.warning("Falling back to mock bars for %s after Alpaca error: %s", symbol, exc)

        return self._get_mock_bars(symbol, periods)

    def _get_alpaca_bars(self, symbol: str, periods: int) -> list[Bar]:
        if not self.settings.alpaca_api_key_id or not self.settings.alpaca_api_secret_key:
            raise ValueError("Missing Alpaca API credentials")

        end = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        start = end - timedelta(days=5)
        url = f"https://data.alpaca.markets/v2/stocks/{symbol}/bars"
        headers = {
            "APCA-API-KEY-ID": self.settings.alpaca_api_key_id,
            "APCA-API-SECRET-KEY": self.settings.alpaca_api_secret_key,
        }
        params = {
            "timeframe": self.settings.alpaca_bar_timeframe,
            "start": start.isoformat().replace("+00:00", "Z"),
            "end": end.isoformat().replace("+00:00", "Z"),
            "limit": periods,
            "adjustment": "raw",
            "feed": self.settings.alpaca_data_feed,
            "sort": "asc",
        }

        with httpx.Client(timeout=10) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            payload = response.json()

        raw_bars = payload.get("bars", [])
        if not raw_bars:
            raise ValueError("Alpaca returned no bars")

        return [
            Bar(
                timestamp=datetime.fromisoformat(item["t"].replace("Z", "+00:00")),
                symbol=symbol,
                open=round(float(item["o"]), 2),
                high=round(float(item["h"]), 2),
                low=round(float(item["l"]), 2),
                close=round(float(item["c"]), 2),
                volume=int(item["v"]),
            )
            for item in raw_bars[-periods:]
        ]

    def _get_mock_bars(self, symbol: str, periods: int) -> list[Bar]:
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
