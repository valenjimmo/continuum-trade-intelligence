# Intraday Market Regime Engine

## Purpose

The Intraday Market Regime Engine is the core intelligence layer for ETF-focused market context. It classifies changing intraday conditions, explains the evidence behind the classification, and recommends strategy families that fit the current environment.

The engine is not a buy/sell signal generator. It is a decision-support system that answers:

- What type of market are we in?
- How confident is the classification?
- Which strategy families are favored or penalized?
- Which evidence changed since the prior snapshot?

Initial coverage is `SPY`, `QQQ`, and `IWM`.

## Recommended Ownership

This module belongs in `continuum-trade-intelligence`, not the Relative Strength Dashboard or Flow Analyzer.

The Relative Strength Dashboard should consume regime outputs through API calls or persisted Supabase snapshots. The Flow Analyzer should eventually contribute options-flow features, but it should not own the regime classifier.

## Architecture

Use a modular monolith inside the FastAPI backend for the MVP:

```text
backend/app/
  analytics/        reusable indicator calculations
  features/         feature extraction from bars and external context
  engines/          regime, structure, continuation, confidence logic
  services/         orchestration across repositories and engines
  repositories/     market-data and persistence boundaries
  schemas/          public API contracts
  api/              FastAPI route boundaries
```

This keeps local development simple while preserving clear module boundaries for future extraction.

## Regime Taxonomy

MVP regimes:

| Regime | Meaning |
| --- | --- |
| `TREND_UP` | Directional upside acceptance with constructive participation |
| `TREND_DOWN` | Directional downside acceptance with constructive participation |
| `CHOP_MEAN_REVERSION` | Two-way trade, weak persistence, and mean-reverting structure |
| `COMPRESSION` | Contracting range, low momentum, and pending expansion risk |
| `EXPANSION_MOMENTUM` | Range and volume expansion with strong directional movement |

The legacy dashboard regime labels such as `TREND_DAY` and `CHOP_DAY` may continue to exist for compatibility, but new regime work should use the more precise intraday taxonomy.

## Feature Groups

MVP feature groups:

- VWAP location and respect
- Opening range acceptance or rejection
- ATR/range expansion and contraction
- EMA alignment
- Candle efficiency
- Volume expansion
- Relative strength versus tracked ETF basket
- Previous day high/low and prior-close interaction
- Multi-bar trend persistence

Future feature groups:

- Options flow positioning
- Breadth and market internals
- Volatility surface context
- Higher-timeframe regime confirmation
- News/session calendar context
- ML-derived feature importance

## Scoring Model

The engine uses weighted evidence, not hard-coded one-indicator decisions.

Each snapshot contains:

- `regime`: selected classification
- `confidence`: `LOW`, `MEDIUM`, or `HIGH`
- `confidence_score`: numeric 0-100 score
- `feature_scores`: named evidence values
- `strategy_recommendations`: strategy families ranked for the regime
- `explanation`: human-readable summary

Weights should be centralized and versioned so backtests and replay can reproduce past behavior.

## API Contracts

Initial endpoints:

```text
GET /api/v1/regimes
GET /api/v1/regimes/{symbol}
```

The dashboard can continue using `/api/v1/dashboard`; richer regime-aware experiences should consume `/api/v1/regimes`.

## Future Streaming Path

Do not make streaming a separate implementation path. The same engine should accept a list of bars and return a snapshot.

Batch path:

```text
repository -> feature extraction -> regime engine -> API response
```

Streaming path:

```text
bar event -> rolling bar store -> same feature extraction -> same regime engine -> websocket snapshot
```

This prevents a rewrite when real-time updates arrive.

## Persistence Plan

The local containerized app persists regime snapshots to its own Postgres database. Supabase is not required for this project.

```text
regime_snapshots
  id
  symbol
  timestamp
  timeframe
  regime
  confidence
  confidence_score
  feature_scores jsonb
  strategy_recommendations jsonb
  engine_version
```

Persisted snapshots unlock replay, drift analysis, alerting, and commercial auditability.

Initial history endpoint:

```text
GET /api/v1/regimes/{symbol}/history
```

## Technical Debt Guardrails

- Keep feature extraction separate from regime classification.
- Keep strategy recommendation separate from regime classification.
- Version scoring weights.
- Add fixtures for canonical market states.
- Avoid direct dashboard coupling.
- Treat options flow and breadth as optional feature providers.
- Do not introduce live execution behavior into this module.

## MVP Roadmap

1. Add API-ready regime snapshot contracts.
2. Implement weighted ETF regime classification from current bars.
3. Add strategy recommendations per regime.
4. Persist snapshots to Supabase.
5. Add replay/backtest runner using the same engine.
6. Add streaming transport using the same engine contract.
7. Add options flow and breadth feature providers.
