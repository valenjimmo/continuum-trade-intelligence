from app.services.analysis_service import AnalysisService


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
