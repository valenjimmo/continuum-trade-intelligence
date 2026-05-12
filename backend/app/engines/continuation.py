from statistics import fmean

from app.schemas.market import Bar, ContinuationFactors, MarketLevels, StructureSnapshot, TrendState


class ContinuationEngine:
    def score(self, bars: list[Bar], levels: MarketLevels, structure: StructureSnapshot) -> tuple[int, ContinuationFactors]:
        recent = bars[-20:]
        last = bars[-1]
        avg_volume = fmean(bar.volume for bar in bars[-60:])
        relative_volume = min(100, int((last.volume / avg_volume) * 70))

        distance_from_vwap = abs(last.close - levels.vwap) / max(last.close, 1)
        vwap_respect = max(0, 100 - int(distance_from_vwap * 3500))

        ranges = [bar.high - bar.low for bar in recent]
        bodies = [abs(bar.close - bar.open) for bar in recent]
        pullback_quality = max(0, min(100, int(100 - (fmean(ranges) / max(last.close, 1)) * 2200)))
        candle_acceptance = 78 if "accepted" in structure.breakout_status else 48
        momentum_stability = min(100, int((fmean(bodies) / max(fmean(ranges), 0.01)) * 130))
        breakout_quality = 84 if structure.breakout_status.startswith("accepted") else 42

        if structure.trend == TrendState.bullish:
            directional = sum(1 for bar in recent if bar.close > bar.open)
        elif structure.trend == TrendState.bearish:
            directional = sum(1 for bar in recent if bar.close < bar.open)
        else:
            directional = 7
        trend_persistence = min(100, int(directional / len(recent) * 125))
        liquidity_sweeps = 72 if "rejected" in structure.breakout_status else 55

        if structure.trend in {TrendState.neutral, TrendState.compression}:
            candle_acceptance = int(candle_acceptance * 0.75)
            trend_persistence = int(trend_persistence * 0.7)

        factors = ContinuationFactors(
            vwap_respect=vwap_respect,
            relative_volume=relative_volume,
            pullback_quality=pullback_quality,
            candle_acceptance=candle_acceptance,
            momentum_stability=momentum_stability,
            breakout_quality=breakout_quality,
            trend_persistence=trend_persistence,
            liquidity_sweeps=liquidity_sweeps,
        )
        weights = {
            "vwap_respect": 0.16,
            "relative_volume": 0.12,
            "pullback_quality": 0.14,
            "candle_acceptance": 0.15,
            "momentum_stability": 0.12,
            "breakout_quality": 0.14,
            "trend_persistence": 0.12,
            "liquidity_sweeps": 0.05,
        }
        score = sum(getattr(factors, key) * weight for key, weight in weights.items())
        return max(0, min(100, int(score))), factors
