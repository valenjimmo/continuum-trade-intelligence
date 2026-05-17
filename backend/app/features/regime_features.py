from statistics import fmean

from app.schemas.market import Bar, MarketLevels, StructureSnapshot, TrendState
from app.schemas.regime import RegimeFeatureScores


class RegimeFeatureExtractor:
    def extract(
        self,
        bars: list[Bar],
        levels: MarketLevels,
        structure: StructureSnapshot,
        relative_strength_score: int,
    ) -> RegimeFeatureScores:
        recent = bars[-24:]
        last = bars[-1]
        recent_range = max(bar.high for bar in recent) - min(bar.low for bar in recent)
        prior = bars[-48:-24] if len(bars) >= 48 else bars[: max(1, len(bars) // 2)]
        prior_range = max(bar.high for bar in prior) - min(bar.low for bar in prior)
        avg_volume = fmean(bar.volume for bar in bars[-60:])
        body_ratios = [
            abs(bar.close - bar.open) / max(bar.high - bar.low, 0.01)
            for bar in recent
        ]

        return RegimeFeatureScores(
            vwap_alignment=self._vwap_alignment(last, levels, structure),
            opening_range_acceptance=self._opening_range_acceptance(structure),
            ema_alignment=self._ema_alignment(last, levels),
            candle_efficiency=self._bounded(fmean(body_ratios) * 125),
            volume_expansion=self._bounded((last.volume / max(avg_volume, 1)) * 72),
            range_expansion=self._bounded((recent_range / max(prior_range, 0.01)) * 64),
            trend_persistence=self._trend_persistence(recent, structure.trend),
            compression=structure.compression_score,
            relative_strength=self._bounded(relative_strength_score),
        )

    def _vwap_alignment(
        self, last: Bar, levels: MarketLevels, structure: StructureSnapshot
    ) -> int:
        if structure.trend == TrendState.bearish:
            return self._bounded(50 + ((levels.vwap - last.close) / max(last.close, 1)) * 3000)
        return self._bounded(50 + ((last.close - levels.vwap) / max(last.close, 1)) * 3000)

    def _opening_range_acceptance(self, structure: StructureSnapshot) -> int:
        if structure.breakout_status == "accepted_above_orb":
            return 86
        if structure.breakout_status == "accepted_below_orb":
            return 84
        if structure.breakout_status.startswith("rejected"):
            return 34
        return 50

    def _ema_alignment(self, last: Bar, levels: MarketLevels) -> int:
        if levels.ema_9 >= levels.ema_21 >= levels.ema_50:
            return 86 if last.close >= levels.ema_9 else 68
        if levels.ema_9 <= levels.ema_21 <= levels.ema_50:
            return 82 if last.close <= levels.ema_9 else 64
        return 42

    def _trend_persistence(self, recent: list[Bar], trend: TrendState) -> int:
        if trend == TrendState.bearish:
            directional = sum(1 for bar in recent if bar.close < bar.open)
        elif trend == TrendState.bullish:
            directional = sum(1 for bar in recent if bar.close > bar.open)
        else:
            directional = sum(
                1 for bar in recent if abs(bar.close - bar.open) >= (bar.high - bar.low) * 0.35
            )
        return self._bounded((directional / max(len(recent), 1)) * 125)

    def _bounded(self, value: float) -> int:
        return max(0, min(100, int(round(value))))
