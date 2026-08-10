#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
api_port="${SKN_API_PORT:-8080}"

mkdir -p "$project_root/backend/data"

cleanup() {
  if [[ -n "${backend_pid:-}" ]]; then
    kill "$backend_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

(
  cd "$project_root/backend"
  SERVER_PORT="$api_port" TEST_HARNESS_ENABLED=true ./gradlew bootRun
) &
backend_pid=$!

cd "$project_root/frontend"
VITE_API_PROXY="http://127.0.0.1:$api_port" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
