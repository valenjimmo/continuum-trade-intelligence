# TCIP MVP Architecture

TCIP is split into a FastAPI analytics API and a Next.js dashboard.

## Backend

- `app/repositories` owns data boundaries. The MVP ships with deterministic mock bars, so the platform runs without vendor keys.
- `app/analytics` contains reusable indicator calculations.
- `app/engines` contains market structure, continuation scoring, regime classification, and correlation logic.
- `app/services` orchestrates repositories and engines into API-ready snapshots.
- `app/api` exposes dashboard, symbol, alert, replay, and health endpoints.

## Frontend

- `app` contains the dashboard route.
- `components` contains reusable UI panels.
- `charts` contains TradingView Lightweight Charts integrations.
- `lib` contains API clients, shared types, and helpers.
- `stores` is reserved for client-side workflow state with Zustand.

## Deployment

Use `docker-compose.yml` for local/full-stack deployment. The frontend is also Vercel-ready; set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.

The backend container is ready for a single Ubuntu host or any Docker-based platform. Set `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, and alert provider credentials through environment variables.
