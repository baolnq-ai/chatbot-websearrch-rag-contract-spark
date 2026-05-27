#!/usr/bin/env bash
set -euo pipefail

# Stop local project services without deleting runtime data volumes.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
ENV_FILE="${ENV_FILE:-}"
CODE_TMUX_SESSION="${CODE_TMUX_SESSION:-rag-chatbot-code}"
STOP_DOCKER="${STOP_DOCKER:-true}"
STOP_CODE_SERVICES="${STOP_CODE_SERVICES:-true}"

if [[ -z "$ENV_FILE" ]]; then
  if [[ "$COMPOSE_FILE" == "docker-compose.all.yml" && -f ".env.all" ]]; then
    ENV_FILE=".env.all"
  else
    ENV_FILE=".env"
  fi
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

echo "[stop] Project root: $PROJECT_ROOT"
echo "[stop] Compose file: $COMPOSE_FILE"

if [[ "$STOP_CODE_SERVICES" == "true" ]]; then
  if command -v tmux >/dev/null 2>&1; then
    if tmux has-session -t "$CODE_TMUX_SESSION" >/dev/null 2>&1; then
      echo "[stop] Killing tmux session: $CODE_TMUX_SESSION"
      tmux kill-session -t "$CODE_TMUX_SESSION"
    else
      echo "[stop] Tmux session not running: $CODE_TMUX_SESSION"
    fi
  else
    echo "[stop] tmux not found; skip code-services session"
  fi
fi

if [[ "$STOP_DOCKER" == "true" ]]; then
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "ERROR: Compose file not found: $COMPOSE_FILE"
    exit 1
  fi

  echo "[stop] Stopping compose services"
  if [[ -f "$ENV_FILE" ]]; then
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
  else
    docker compose -f "$COMPOSE_FILE" down
  fi
fi

echo "[stop] Done. Runtime data under cache/ and .runtime/ is preserved."
