from app.schemas.market import SymbolAnalysis, TrendState


class CorrelationEngine:
    def participation(self, analyses: list[SymbolAnalysis]) -> tuple[TrendState, int]:
        directional = [item for item in analyses if item.trend in {TrendState.bullish, TrendState.bearish}]
        bullish = sum(1 for item in directional if item.trend == TrendState.bullish)
        bearish = sum(1 for item in directional if item.trend == TrendState.bearish)

        if bullish > bearish:
            bias = TrendState.bullish
            aligned = bullish
        elif bearish > bullish:
            bias = TrendState.bearish
            aligned = bearish
        else:
            bias = TrendState.neutral
            aligned = 0

        score = int(aligned / max(len(analyses), 1) * 100)
        return bias, score
