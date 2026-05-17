from fastapi import APIRouter

from app.schemas.market import AlertSummary, AppSnapshot, DashboardSnapshot, ReplayEvent, SymbolAnalysis
from app.schemas.strategy import StrategyDashboard, StrategyDefinition
from app.services.analysis_service import AnalysisService
from app.services.strategy_service import StrategyService

router = APIRouter()
service = AnalysisService()
strategy_service = StrategyService()


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


@router.get("/strategies", response_model=list[StrategyDefinition], tags=["strategies"])
def strategies() -> list[StrategyDefinition]:
    return strategy_service.list_strategies()


@router.get("/strategies/{strategy_id}/dashboard", response_model=StrategyDashboard, tags=["strategies"])
def strategy_dashboard(strategy_id: str, timeframe: str = "5Min") -> StrategyDashboard:
    return strategy_service.dashboard(strategy_id=strategy_id, timeframe=timeframe)
