# Trend Continuation Intelligence Platform

MVP implementation of the TCIP design doc: a modular market analytics platform for trend continuation context, regime classification, cross-market participation, alerts, and replay review.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- API docs: http://localhost:8000/docs

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Project Layout

```text
backend/    FastAPI service, analytics engines, data repositories, tests
frontend/   Next.js dashboard, UI components, charts, state, API client
data/       Historical, processed, and replay storage placeholders
docs/       Architecture and operating notes
docker/     Reserved for Docker support files
infra/      Reserved for deployment IaC
scripts/    Local developer scripts
```

## MVP Scope

The current app uses deterministic mock market data so the full product loop works immediately. Replace `backend/app/repositories/market_data.py` with Alpaca/Yahoo/Polygon adapters when credentials and data contracts are ready.

Included endpoints:

- `GET /api/v1/health`
- `GET /api/v1/dashboard`
- `GET /api/v1/symbols/{symbol}`
- `GET /api/v1/alerts`
- `GET /api/v1/replay`

## Verification

```bash
./scripts/test.sh
```
