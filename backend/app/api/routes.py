from fastapi import APIRouter

from app.schemas.market import AlertSummary, DashboardSnapshot, ReplayEvent, SymbolAnalysis
from app.services.analysis_service import AnalysisService

router = APIRouter()
service = AnalysisService()


@router.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dashboard", response_model=DashboardSnapshot, tags=["analysis"])
def dashboard() -> DashboardSnapshot:
    return service.dashboard()


@router.get("/symbols/{symbol}", response_model=SymbolAnalysis, tags=["analysis"])
def symbol_analysis(symbol: str) -> SymbolAnalysis:
    return service.analyze_symbol(symbol.upper())


@router.get("/alerts", response_model=list[AlertSummary], tags=["alerts"])
def alerts() -> list[AlertSummary]:
    return service.alerts()


@router.get("/replay", response_model=list[ReplayEvent], tags=["replay"])
def replay() -> list[ReplayEvent]:
    return service.replay_events()
