#!/usr/bin/env bash
set -euo pipefail

(
  cd backend
  PYTHON_BIN="python3"
  if [ -x ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
  fi
  PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 "$PYTHON_BIN" -m pytest
)

(
  cd frontend
  npm run typecheck
  npm run build
)
