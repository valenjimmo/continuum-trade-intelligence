from typing import Optional

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.market import AlertSummary, AppSnapshot, DashboardSnapshot, ReplayEvent, SymbolAnalysis
from app.schemas.mean_reversion import MeanReversionTerminalSnapshot
from app.schemas.regime import RegimeDashboard, RegimeSnapshot
from app.schemas.strategy import StrategyDashboard, StrategyDefinition
from app.services.analysis_service import AnalysisService
from app.services.mean_reversion_service import MeanReversionService
from app.services.regime_service import RegimeService
from app.services.strategy_service import StrategyService

router = APIRouter()
service = AnalysisService()
strategy_service = StrategyService()
mean_reversion_service = MeanReversionService()
regime_service = RegimeService()


COMMON_TIMEFRAMES = {"1Min", "5Min", "15Min", "30Min", "1Hour"}


def normalized_timeframe(timeframe: Optional[str] = None) -> str:
    return timeframe if timeframe in COMMON_TIMEFRAMES else "5Min"


def settings_for_request(data_mode: Optional[str] = None, timeframe: Optional[str] = None):
    settings = get_settings()
    updates = {"alpaca_bar_timeframe": normalized_timeframe(timeframe)}
    if data_mode and data_mode.lower() in {"mock", "alpaca"}:
        updates["data_mode"] = data_mode.lower()
    return settings.model_copy(update=updates)


def analysis_for_request(data_mode: Optional[str] = None, timeframe: Optional[str] = None) -> AnalysisService:
    if data_mode or timeframe:
        return AnalysisService(settings_for_request(data_mode, timeframe))
    return service


def regimes_for_request(data_mode: Optional[str] = None, timeframe: Optional[str] = None) -> RegimeService:
    if data_mode or timeframe:
        return RegimeService(settings_for_request(data_mode, timeframe))
    return regime_service


@router.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dashboard", response_model=DashboardSnapshot, tags=["analysis"])
def dashboard(data_mode: Optional[str] = None, timeframe: Optional[str] = None) -> DashboardSnapshot:
    return analysis_for_request(data_mode, timeframe).dashboard()


@router.get("/overview", response_model=AppSnapshot, tags=["analysis"])
def overview(data_mode: Optional[str] = None, timeframe: Optional[str] = None) -> AppSnapshot:
    return analysis_for_request(data_mode, timeframe).app_snapshot()


@router.get("/symbols/{symbol}", response_model=SymbolAnalysis, tags=["analysis"])
def symbol_analysis(symbol: str, data_mode: Optional[str] = None, timeframe: Optional[str] = None) -> SymbolAnalysis:
    return analysis_for_request(data_mode, timeframe).analyze_symbol(symbol.upper())


@router.get("/alerts", response_model=list[AlertSummary], tags=["alerts"])
def alerts() -> list[AlertSummary]:
    return service.alerts()


@router.get("/replay", response_model=list[ReplayEvent], tags=["replay"])
def replay() -> list[ReplayEvent]:
    return service.replay_events()


@router.get("/regimes", response_model=RegimeDashboard, tags=["regimes"])
def regimes(timeframe: str = "5Min", data_mode: Optional[str] = None) -> RegimeDashboard:
    selected_timeframe = normalized_timeframe(timeframe)
    return regimes_for_request(data_mode, selected_timeframe).dashboard(timeframe=selected_timeframe)


@router.get("/regimes/{symbol}", response_model=RegimeSnapshot, tags=["regimes"])
def regime(symbol: str, timeframe: str = "5Min", data_mode: Optional[str] = None) -> RegimeSnapshot:
    selected_timeframe = normalized_timeframe(timeframe)
    return regimes_for_request(data_mode, selected_timeframe).snapshot(
        symbol=symbol.upper(),
        timeframe=selected_timeframe,
    )


@router.get("/regimes/{symbol}/history", response_model=list[RegimeSnapshot], tags=["regimes"])
def regime_history(symbol: str, limit: int = 50) -> list[RegimeSnapshot]:
    return regime_service.history(symbol=symbol.upper(), limit=limit)


@router.get("/strategies", response_model=list[StrategyDefinition], tags=["strategies"])
def strategies() -> list[StrategyDefinition]:
    return strategy_service.list_strategies()


@router.get("/strategies/{strategy_id}/dashboard", response_model=StrategyDashboard, tags=["strategies"])
def strategy_dashboard(strategy_id: str, timeframe: str = "5Min") -> StrategyDashboard:
    return strategy_service.dashboard(strategy_id=strategy_id, timeframe=timeframe)


@router.get(
    "/strategies/mean-reversion",
    response_model=list[MeanReversionTerminalSnapshot],
    tags=["strategies"],
)
def mean_reversion_terminals(
    symbols: str = "SPY,QQQ,IWM,AAPL,MSFT,NVDA,AMZN,META,GOOGL,TSLA",
    data_mode: Optional[str] = None,
) -> list[MeanReversionTerminalSnapshot]:
    if data_mode:
        return MeanReversionService(settings_for_request(data_mode)).terminals(symbols=symbols)
    return mean_reversion_service.terminals(symbols=symbols)


@router.get(
    "/strategies/mean-reversion/{symbol}",
    response_model=MeanReversionTerminalSnapshot,
    tags=["strategies"],
)
def mean_reversion_terminal(symbol: str, data_mode: Optional[str] = None) -> MeanReversionTerminalSnapshot:
    if data_mode:
        return MeanReversionService(settings_for_request(data_mode)).terminal(symbol=symbol)
    return mean_reversion_service.terminal(symbol=symbol)
