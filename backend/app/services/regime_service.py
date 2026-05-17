from datetime import datetime, timezone
from statistics import fmean
from typing import Optional

from app.analytics.indicators import build_levels
from app.core.config import Settings, get_settings
from app.engines.continuation import ContinuationEngine
from app.engines.regime import MarketRegimeEngine
from app.engines.structure import MarketStructureEngine
from app.repositories.market_data import MarketDataRepository
from app.repositories.regime_snapshots import RegimeSnapshotRepository
from app.schemas.market import Bar, Confidence
from app.schemas.regime import RegimeDashboard, RegimeSnapshot


class RegimeService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.market_data = MarketDataRepository(self.settings)
        self.structure_engine = MarketStructureEngine()
        self.continuation_engine = ContinuationEngine()
        self.regime_engine = MarketRegimeEngine()
        self.snapshots = RegimeSnapshotRepository()

    def snapshot(self, symbol: str, timeframe: str = "5Min", persist: bool = True) -> RegimeSnapshot:
        bars = self.market_data.get_intraday_bars(symbol)
        peer_bars = {
            tracked_symbol: self.market_data.get_intraday_bars(tracked_symbol)
            for tracked_symbol in self.settings.tracked_symbols
            if tracked_symbol != symbol
        }
        snapshot = self._snapshot_from_bars(symbol=symbol, bars=bars, peer_bars=peer_bars, timeframe=timeframe)
        if persist:
            self.snapshots.save(snapshot)
        return snapshot

    def dashboard(self, timeframe: str = "5Min", persist: bool = True) -> RegimeDashboard:
        bars_by_symbol = {
            symbol: self.market_data.get_intraday_bars(symbol)
            for symbol in self.settings.tracked_symbols
        }
        snapshots = [
            self._snapshot_from_bars(
                symbol=symbol,
                bars=bars,
                peer_bars={
                    peer_symbol: peer_bars
                    for peer_symbol, peer_bars in bars_by_symbol.items()
                    if peer_symbol != symbol
                },
                timeframe=timeframe,
            )
            for symbol, bars in bars_by_symbol.items()
        ]
        if persist:
            for snapshot in snapshots:
                self.snapshots.save(snapshot)

        primary_regime = max(set(item.regime for item in snapshots), key=[item.regime for item in snapshots].count)
        market_confidence_score = int(round(fmean(item.confidence_score for item in snapshots)))

        return RegimeDashboard(
            generated_at=datetime.now(timezone.utc),
            timeframe=timeframe,
            symbols=snapshots,
            primary_regime=primary_regime,
            market_confidence=self._confidence_label(market_confidence_score),
            market_confidence_score=market_confidence_score,
        )

    def history(self, symbol: str, limit: int = 50) -> list[RegimeSnapshot]:
        return self.snapshots.recent(symbol=symbol, limit=limit)

    def _snapshot_from_bars(
        self,
        symbol: str,
        bars: list[Bar],
        peer_bars: dict[str, list[Bar]],
        timeframe: str,
    ) -> RegimeSnapshot:
        levels = build_levels(bars)
        structure = self.structure_engine.analyze(bars, levels)
        continuation_score, _ = self.continuation_engine.score(bars, levels, structure)
        relative_strength = self._relative_strength_score(bars, list(peer_bars.values()))
        return self.regime_engine.analyze(
            bars=bars,
            levels=levels,
            structure=structure,
            continuation_score=continuation_score,
            relative_strength_score=relative_strength,
            timeframe=timeframe,
        )

    def _relative_strength_score(self, bars: list[Bar], peers: list[list[Bar]]) -> int:
        own_return = self._return_percent(bars)
        peer_returns = [self._return_percent(peer) for peer in peers if peer]
        if not peer_returns:
            return 50

        spread = own_return - fmean(peer_returns)
        return max(0, min(100, int(round(50 + spread * 18))))

    def _return_percent(self, bars: list[Bar]) -> float:
        if len(bars) < 2:
            return 0
        return ((bars[-1].close - bars[0].open) / max(bars[0].open, 0.01)) * 100

    def _confidence_label(self, score: int) -> Confidence:
        if score >= 72:
            return Confidence.high
        if score >= 52:
            return Confidence.medium
        return Confidence.low
