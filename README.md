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

## Data Modes

The app supports two data modes:

- `DATA_MODE=mock`: deterministic generated bars so the full product loop works without API keys.
- `DATA_MODE=alpaca`: pulls recent Alpaca market-data bars for the tracked ETFs on each dashboard refresh.

For Alpaca, add these values to `.env`:

```env
DATA_MODE=alpaca
ALPACA_API_KEY_ID=your_key_here
ALPACA_API_SECRET_KEY=your_secret_here
ALPACA_DATA_FEED=iex
ALPACA_BAR_TIMEFRAME=5Min
DASHBOARD_REFRESH_SECONDS=15
```

Use `ALPACA_DATA_FEED=iex` for the free/basic Alpaca data plan. Use `sip` only if your Alpaca account has SIP access.

## MVP Scope

Included endpoints:

- `GET /api/v1/health`
- `GET /api/v1/overview`
- `GET /api/v1/dashboard`
- `GET /api/v1/symbols/{symbol}`
- `GET /api/v1/alerts`
- `GET /api/v1/replay`

## Verification

```bash
./scripts/test.sh
```
