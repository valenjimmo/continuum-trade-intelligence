from statistics import fmean

from app.schemas.market import Bar, MarketLevels


def ema(values: list[float], period: int) -> float:
    if not values:
        return 0
    multiplier = 2 / (period + 1)
    result = values[0]
    for value in values[1:]:
        result = (value - result) * multiplier + result
    return round(result, 2)


def vwap(bars: list[Bar]) -> float:
    total_volume = sum(bar.volume for bar in bars)
    if total_volume == 0:
        return bars[-1].close if bars else 0
    weighted = sum(((bar.high + bar.low + bar.close) / 3) * bar.volume for bar in bars)
    return round(weighted / total_volume, 2)


def build_levels(bars: list[Bar]) -> MarketLevels:
    closes = [bar.close for bar in bars]
    opening = bars[:6] if len(bars) >= 6 else bars
    prior = bars[: max(6, len(bars) // 3)]
    recent = bars[-24:] if len(bars) >= 24 else bars

    return MarketLevels(
        previous_day_high=round(max(bar.high for bar in prior) + 0.85, 2),
        previous_day_low=round(min(bar.low for bar in prior) - 0.85, 2),
        prior_close=round(fmean(closes[:6]), 2),
        premarket_high=round(max(bar.high for bar in prior), 2),
        premarket_low=round(min(bar.low for bar in prior), 2),
        opening_range_high=round(max(bar.high for bar in opening), 2),
        opening_range_low=round(min(bar.low for bar in opening), 2),
        vwap=vwap(recent),
        ema_9=ema(closes, 9),
        ema_21=ema(closes, 21),
        ema_50=ema(closes, 50),
    )
