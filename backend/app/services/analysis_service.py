from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from app.analytics.indicators import build_levels
from app.core.config import Settings, get_settings
from app.engines.continuation import ContinuationEngine
from app.engines.correlation import CorrelationEngine
from app.engines.regime import MarketRegimeEngine
from app.engines.structure import MarketStructureEngine
from app.repositories.market_data import MarketDataRepository
from app.schemas.market import (
    AlertSummary,
    AppSnapshot,
    Confidence,
    DashboardSnapshot,
    ReplayEvent,
    SymbolAnalysis,
    TrendState,
)


class AnalysisService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.market_data = MarketDataRepository(self.settings)
        self.structure_engine = MarketStructureEngine()
        self.continuation_engine = ContinuationEngine()
        self.regime_engine = MarketRegimeEngine()
        self.correlation_engine = CorrelationEngine()

    def analyze_symbol(self, symbol: str) -> SymbolAnalysis:
        bars = self.market_data.get_intraday_bars(symbol)
        levels = build_levels(bars)
        structure = self.structure_engine.analyze(bars, levels)
        score, factors = self.continuation_engine.score(bars, levels, structure)
        regime = self.regime_engine.classify(bars, structure, score)
        confidence = Confidence.high if score >= 75 else Confidence.medium if score >= 55 else Confidence.low
        summary = self._summary(symbol, structure.trend, score)

        return SymbolAnalysis(
            ticker=symbol,
            timestamp=bars[-1].timestamp,
            price=bars[-1].close,
            trend=structure.trend,
            continuation_score=score,
            regime=regime,
            confidence=confidence,
            correlation_confirmation=False,
            participation_score=0,
            levels=levels,
            structure=structure,
            factors=factors,
            summary=summary,
        )

    def dashboard(self) -> DashboardSnapshot:
        analyses = [self.analyze_symbol(symbol) for symbol in self.settings.tracked_symbols]
        bias, participation = self.correlation_engine.participation(analyses)
        regimes = [item.regime for item in analyses]
        primary_regime = max(set(regimes), key=regimes.count)
        enriched = [
            item.model_copy(
                update={
                    "correlation_confirmation": item.trend == bias and bias != TrendState.neutral,
                    "participation_score": participation,
                }
            )
            for item in analyses
        ]
        return DashboardSnapshot(
            generated_at=datetime.now(timezone.utc),
            data_mode=self.settings.data_mode,
            data_feed=self.settings.alpaca_data_feed if self.settings.data_mode.lower() == "alpaca" else "mock",
            refresh_seconds=self.settings.dashboard_refresh_seconds,
            symbols=enriched,
            market_bias=bias,
            regime=primary_regime,
            participation_score=participation,
        )

    def alerts(self) -> list[AlertSummary]:
        return self.alerts_from_dashboard(self.dashboard())

    def alerts_from_dashboard(self, dashboard: DashboardSnapshot) -> list[AlertSummary]:
        alerts: list[AlertSummary] = []
        for item in dashboard.symbols:
            if item.continuation_score >= 70 and item.correlation_confirmation:
                alerts.append(
                    AlertSummary(
                        id=str(uuid4()),
                        created_at=datetime.now(timezone.utc),
                        ticker=item.ticker,
                        severity=item.confidence,
                        title=f"{item.ticker} continuation quality improving",
                        message=f"{item.trend.value.title()} structure with {item.continuation_score}/100 continuation score.",
                        score=item.continuation_score,
                    )
                )
        return alerts

    def replay_events(self) -> list[ReplayEvent]:
        return self.replay_events_from_dashboard(self.dashboard())

    def replay_events_from_dashboard(self, dashboard: DashboardSnapshot) -> list[ReplayEvent]:
        events: list[ReplayEvent] = []
        for index, item in enumerate(dashboard.symbols):
            passed = item.continuation_score >= 62
            events.append(
                ReplayEvent(
                    id=f"replay-{item.ticker.lower()}-{index}",
                    timestamp=item.timestamp,
                    ticker=item.ticker,
                    regime=item.regime,
                    continuation_score=item.continuation_score,
                    outcome="followed_through" if passed else "failed_or_choppy",
                    max_favorable_excursion=round(item.continuation_score / 100 * 1.8, 2),
                    max_adverse_excursion=round((100 - item.continuation_score) / 100 * 0.9, 2),
                    failure_reason=None if passed else "Insufficient participation or acceptance",
                )
            )
        return events

    def app_snapshot(self) -> AppSnapshot:
        dashboard = self.dashboard()
        return AppSnapshot(
            dashboard=dashboard,
            alerts=self.alerts_from_dashboard(dashboard),
            replay=self.replay_events_from_dashboard(dashboard),
        )

    @staticmethod
    def _summary(symbol: str, trend: TrendState, score: int) -> str:
        if score >= 75:
            return f"{symbol} has high-quality {trend.value} continuation conditions."
        if score >= 55:
            return f"{symbol} is constructive but needs cleaner acceptance."
        return f"{symbol} is lower quality; avoid forcing continuation entries."
