from statistics import fmean
from typing import Optional

from app.features.regime_features import RegimeFeatureExtractor
from app.schemas.market import Bar, Confidence, MarketLevels, RegimeType, StructureSnapshot, TrendState
from app.schemas.regime import (
    IntradayRegime,
    RegimeFeatureScores,
    RegimeSnapshot,
    StrategyRecommendation,
)


ENGINE_VERSION = "intraday-regime-v1"


class MarketRegimeEngine:
    def __init__(self, feature_extractor: Optional[RegimeFeatureExtractor] = None) -> None:
        self.feature_extractor = feature_extractor or RegimeFeatureExtractor()

    def analyze(
        self,
        bars: list[Bar],
        levels: MarketLevels,
        structure: StructureSnapshot,
        continuation_score: int,
        relative_strength_score: int = 50,
        timeframe: str = "5Min",
    ) -> RegimeSnapshot:
        last = bars[-1]
        feature_scores = self.feature_extractor.extract(
            bars=bars,
            levels=levels,
            structure=structure,
            relative_strength_score=relative_strength_score,
        )
        direction_score = self._direction_score(feature_scores, structure)
        regime = self._intraday_regime(feature_scores, direction_score, structure)
        confidence_score = self._confidence_score(feature_scores, continuation_score, regime)

        return RegimeSnapshot(
            symbol=last.symbol,
            timestamp=last.timestamp,
            timeframe=timeframe,
            price=last.close,
            regime=regime,
            confidence=self._confidence_label(confidence_score),
            confidence_score=confidence_score,
            direction_score=direction_score,
            feature_scores=feature_scores,
            strategy_recommendations=self._strategy_recommendations(regime, confidence_score),
            explanation=self._explanation(last.symbol, regime, confidence_score, feature_scores),
            engine_version=ENGINE_VERSION,
        )

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

    def _intraday_regime(
        self,
        features: RegimeFeatureScores,
        direction_score: int,
        structure: StructureSnapshot,
    ) -> IntradayRegime:
        expansion_score = fmean(
            [
                features.range_expansion,
                features.volume_expansion,
                features.candle_efficiency,
                features.opening_range_acceptance,
            ]
        )
        trend_quality = fmean(
            [
                features.vwap_alignment,
                features.ema_alignment,
                features.trend_persistence,
                features.relative_strength,
            ]
        )

        if features.compression >= 72 and expansion_score < 62:
            return IntradayRegime.compression
        if expansion_score >= 72 and abs(direction_score) >= 36:
            return IntradayRegime.expansion_momentum
        if trend_quality >= 66 and direction_score >= 24:
            return IntradayRegime.trend_up
        if trend_quality >= 66 and direction_score <= -24:
            return IntradayRegime.trend_down
        if structure.breakout_status.startswith("rejected"):
            return IntradayRegime.chop_mean_reversion
        return IntradayRegime.chop_mean_reversion

    def _direction_score(self, features: RegimeFeatureScores, structure: StructureSnapshot) -> int:
        if structure.trend == TrendState.bullish:
            base = 32
        elif structure.trend == TrendState.bearish:
            base = -32
        else:
            base = 0

        acceptance = 18 if features.opening_range_acceptance >= 75 else -10 if features.opening_range_acceptance <= 40 else 0
        persistence = int((features.trend_persistence - 50) * 0.45)
        relative_strength = int((features.relative_strength - 50) * 0.35)
        direction = base + acceptance + persistence + relative_strength
        if structure.trend == TrendState.bearish:
            direction -= max(0, features.ema_alignment - 55) // 4
        elif structure.trend == TrendState.bullish:
            direction += max(0, features.ema_alignment - 55) // 4
        return max(-100, min(100, direction))

    def _confidence_score(
        self,
        features: RegimeFeatureScores,
        continuation_score: int,
        regime: IntradayRegime,
    ) -> int:
        if regime == IntradayRegime.compression:
            raw = fmean([features.compression, 100 - features.range_expansion, 100 - features.volume_expansion])
        elif regime == IntradayRegime.chop_mean_reversion:
            raw = fmean([100 - features.trend_persistence, 100 - features.opening_range_acceptance, features.compression])
        else:
            raw = fmean(
                [
                    continuation_score,
                    features.vwap_alignment,
                    features.ema_alignment,
                    features.opening_range_acceptance,
                    features.volume_expansion,
                ]
            )
        return self._bounded(raw)

    def _strategy_recommendations(
        self, regime: IntradayRegime, confidence_score: int
    ) -> list[StrategyRecommendation]:
        recommendations = {
            IntradayRegime.trend_up: [
                ("ema_9_21", "EMA 9/21 Continuation", "Upside structure favors pullback continuation."),
                ("vwap_pullback", "VWAP Pullback", "VWAP respect can define risk during trend continuation."),
            ],
            IntradayRegime.trend_down: [
                ("ema_9_21", "EMA 9/21 Continuation", "Downside structure favors continuation in the trend direction."),
                ("vwap_pullback", "VWAP Pullback", "Failed VWAP reclaim can help frame bearish continuation."),
            ],
            IntradayRegime.chop_mean_reversion: [
                ("mean_reversion", "Mean Reversion", "Two-way trade favors fading extremes over chasing breakouts."),
                ("opening_range_fade", "Opening Range Fade", "Rejected range expansion supports tactical fades."),
            ],
            IntradayRegime.compression: [
                ("compression_breakout_watch", "Compression Breakout Watch", "Compression favors preparation, not early chase."),
                ("opening_range_breakout", "Opening Range Breakout", "Wait for confirmed expansion from the balance area."),
            ],
            IntradayRegime.expansion_momentum: [
                ("opening_range_breakout", "Opening Range Breakout", "Range expansion supports momentum continuation."),
                ("ema_9_21", "EMA 9/21 Continuation", "Momentum is cleaner when fast trend structure remains aligned."),
            ],
        }
        return [
            StrategyRecommendation(
                strategy_id=strategy_id,
                name=name,
                suitability_score=max(0, min(100, confidence_score - index * 8)),
                rationale=rationale,
            )
            for index, (strategy_id, name, rationale) in enumerate(recommendations[regime])
        ]

    def _explanation(
        self,
        symbol: str,
        regime: IntradayRegime,
        confidence_score: int,
        features: RegimeFeatureScores,
    ) -> str:
        strongest = max(features.model_dump().items(), key=lambda item: item[1])
        return (
            f"{symbol} is classified as {regime.value} with {confidence_score}/100 confidence; "
            f"strongest evidence is {strongest[0].replace('_', ' ')} at {strongest[1]}/100."
        )

    def _confidence_label(self, score: int) -> Confidence:
        if score >= 72:
            return Confidence.high
        if score >= 52:
            return Confidence.medium
        return Confidence.low

    def _bounded(self, value: float) -> int:
        return max(0, min(100, int(round(value))))
