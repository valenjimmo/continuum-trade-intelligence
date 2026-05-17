from app.services.analysis_service import AnalysisService
from app.services.mean_reversion_service import MeanReversionService
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
