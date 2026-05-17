from app.services.analysis_service import AnalysisService
from app.services.mean_reversion_service import MeanReversionService
from app.services.regime_service import RegimeService
from app.services.strategy_service import StrategyService


def test_dashboard_snapshot_contains_core_symbols() -> None:
    snapshot = AnalysisService().dashboard()

    assert {item.ticker for item in snapshot.symbols} == {"SPY", "QQQ", "IWM"}
    assert 0 <= snapshot.participation_score <= 100
    assert all(0 <= item.continuation_score <= 100 for item in snapshot.symbols)


def test_symbol_analysis_exposes_engine_outputs() -> None:
    analysis = AnalysisService().analyze_symbol("SPY")

    assert analysis.ticker == "SPY"
    assert analysis.levels.vwap > 0
    assert analysis.structure.breakout_status
    assert analysis.summary


def test_regime_dashboard_exposes_weighted_intraday_snapshots() -> None:
    dashboard = RegimeService().dashboard(persist=False)

    assert {item.symbol for item in dashboard.symbols} == {"SPY", "QQQ", "IWM"}
    assert 0 <= dashboard.market_confidence_score <= 100
    assert dashboard.primary_regime
    assert all(item.engine_version == "intraday-regime-v1" for item in dashboard.symbols)
    assert all(item.strategy_recommendations for item in dashboard.symbols)


def test_single_regime_snapshot_exposes_evidence_and_recommendations() -> None:
    snapshot = RegimeService().snapshot("SPY", persist=False)

    assert snapshot.symbol == "SPY"
    assert 0 <= snapshot.confidence_score <= 100
    assert -100 <= snapshot.direction_score <= 100
    assert snapshot.feature_scores.vwap_alignment >= 0
    assert snapshot.strategy_recommendations[0].suitability_score >= snapshot.strategy_recommendations[-1].suitability_score
    assert "SPY is classified" in snapshot.explanation


def test_regime_history_uses_snapshot_repository() -> None:
    service = RegimeService()
    snapshot = service.snapshot("SPY", persist=False)

    class StubRepository:
        def recent(self, symbol: str, limit: int = 50) -> list:
            assert symbol == "SPY"
            assert limit == 3
            return [snapshot]

    service.snapshots = StubRepository()

    assert service.history("SPY", limit=3) == [snapshot]


def test_strategy_dashboard_exposes_metrics_and_trades() -> None:
    dashboard = StrategyService().dashboard("ema_9_21")

    assert dashboard.selected_strategy.id == "ema_9_21"
    assert dashboard.metrics.trade_count > 0
    assert dashboard.equity_curve
    assert {item.symbol for item in dashboard.symbol_performance} == {"SPY", "QQQ", "IWM"}


def test_mean_reversion_terminal_exposes_single_ticker_strip() -> None:
    snapshot = MeanReversionService().terminal("SPY")

    assert snapshot.symbol == "SPY"
    assert snapshot.candles_1h
    assert len(snapshot.metrics) == 6
    assert snapshot.signal.startswith("STRATEGY:")
    assert snapshot.selected_contract.symbol.startswith("SPY")


def test_mean_reversion_terminals_accept_multiple_tickers() -> None:
    snapshots = MeanReversionService().terminals("SPY, QQQ, SPY")

    assert [snapshot.symbol for snapshot in snapshots] == ["SPY", "QQQ"]
