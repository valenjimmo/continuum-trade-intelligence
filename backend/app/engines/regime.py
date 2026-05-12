from app.schemas.market import Bar, RegimeType, StructureSnapshot, TrendState


class MarketRegimeEngine:
    def classify(self, bars: list[Bar], structure: StructureSnapshot, continuation_score: int) -> RegimeType:
        recent = bars[-24:]
        day_range = max(bar.high for bar in recent) - min(bar.low for bar in recent)
        price = bars[-1].close
        range_percent = day_range / max(price, 1)

        if structure.trend == TrendState.compression:
            return RegimeType.balanced_day
        if continuation_score >= 72 and structure.trend in {TrendState.bullish, TrendState.bearish}:
            return RegimeType.trend_day
        if range_percent >= 0.018:
            return RegimeType.expansion_day
        if "rejected" in structure.breakout_status:
            return RegimeType.reversal_day
        return RegimeType.chop_day
