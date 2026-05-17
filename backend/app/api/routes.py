from fastapi import APIRouter

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


@router.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dashboard", response_model=DashboardSnapshot, tags=["analysis"])
def dashboard() -> DashboardSnapshot:
    return service.dashboard()


@router.get("/overview", response_model=AppSnapshot, tags=["analysis"])
def overview() -> AppSnapshot:
    return service.app_snapshot()


@router.get("/symbols/{symbol}", response_model=SymbolAnalysis, tags=["analysis"])
def symbol_analysis(symbol: str) -> SymbolAnalysis:
    return service.analyze_symbol(symbol.upper())


@router.get("/alerts", response_model=list[AlertSummary], tags=["alerts"])
def alerts() -> list[AlertSummary]:
    return service.alerts()


@router.get("/replay", response_model=list[ReplayEvent], tags=["replay"])
def replay() -> list[ReplayEvent]:
    return service.replay_events()


@router.get("/regimes", response_model=RegimeDashboard, tags=["regimes"])
def regimes(timeframe: str = "5Min") -> RegimeDashboard:
    return regime_service.dashboard(timeframe=timeframe)


@router.get("/regimes/{symbol}", response_model=RegimeSnapshot, tags=["regimes"])
def regime(symbol: str, timeframe: str = "5Min") -> RegimeSnapshot:
    return regime_service.snapshot(symbol=symbol.upper(), timeframe=timeframe)


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
) -> list[MeanReversionTerminalSnapshot]:
    return mean_reversion_service.terminals(symbols=symbols)


@router.get(
    "/strategies/mean-reversion/{symbol}",
    response_model=MeanReversionTerminalSnapshot,
    tags=["strategies"],
)
def mean_reversion_terminal(symbol: str) -> MeanReversionTerminalSnapshot:
    return mean_reversion_service.terminal(symbol=symbol)
