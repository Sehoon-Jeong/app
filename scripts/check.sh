#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

(cd "$project_root/backend" && ./gradlew test)
(cd "$project_root/frontend" && npm run build)
