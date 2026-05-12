from app.schemas.market import Bar, MarketLevels, StructureSnapshot, TrendState


class MarketStructureEngine:
    def analyze(self, bars: list[Bar], levels: MarketLevels) -> StructureSnapshot:
        recent = bars[-18:]
        higher_highs = sum(1 for prev, cur in zip(recent, recent[1:]) if cur.high > prev.high)
        higher_lows = sum(1 for prev, cur in zip(recent, recent[1:]) if cur.low > prev.low)
        lower_highs = sum(1 for prev, cur in zip(recent, recent[1:]) if cur.high < prev.high)
        lower_lows = sum(1 for prev, cur in zip(recent, recent[1:]) if cur.low < prev.low)
        last = bars[-1]
        ema_stack_bullish = levels.ema_9 >= levels.ema_21 >= levels.ema_50
        ema_stack_bearish = levels.ema_9 <= levels.ema_21 <= levels.ema_50
        range_width = max(bar.high for bar in recent) - min(bar.low for bar in recent)
        compression_score = max(0, min(100, int(100 - range_width / max(last.close, 1) * 1800)))

        if compression_score > 72:
            trend = TrendState.compression
        elif last.close > levels.vwap and ema_stack_bullish and higher_highs >= lower_highs:
            trend = TrendState.bullish
        elif last.close < levels.vwap and ema_stack_bearish and lower_lows >= higher_lows:
            trend = TrendState.bearish
        else:
            trend = TrendState.neutral

        if last.close > levels.opening_range_high:
            breakout_status = "accepted_above_orb"
        elif last.close < levels.opening_range_low:
            breakout_status = "accepted_below_orb"
        elif last.high > levels.opening_range_high and last.close <= levels.opening_range_high:
            breakout_status = "rejected_above_orb"
        elif last.low < levels.opening_range_low and last.close >= levels.opening_range_low:
            breakout_status = "rejected_below_orb"
        else:
            breakout_status = "inside_opening_range"

        return StructureSnapshot(
            trend=trend,
            higher_highs=higher_highs,
            higher_lows=higher_lows,
            lower_highs=lower_highs,
            lower_lows=lower_lows,
            breakout_status=breakout_status,
            compression_score=compression_score,
        )
