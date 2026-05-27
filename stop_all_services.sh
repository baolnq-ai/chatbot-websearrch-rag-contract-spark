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
STOP_STALE_PROCESSES="${STOP_STALE_PROCESSES:-true}"

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

find_project_code_pids() {
  local proc pid cwd cmd
  for proc in /proc/[0-9]*; do
    pid="${proc##*/}"
    if [[ "$pid" == "$$" || "$pid" == "$BASHPID" || "$pid" == "$PPID" ]]; then
      continue
    fi

    cwd="$(readlink -f "$proc/cwd" 2>/dev/null || true)"
    if [[ "$cwd" != "$PROJECT_ROOT"* ]]; then
      continue
    fi

    cmd="$(tr '\0' ' ' < "$proc/cmdline" 2>/dev/null || true)"
    case "$cwd" in
      "$PROJECT_ROOT/backend"|"$PROJECT_ROOT/backend"/*|\
      "$PROJECT_ROOT/frontend"|"$PROJECT_ROOT/frontend"/*|\
      "$PROJECT_ROOT/parse-data"|"$PROJECT_ROOT/parse-data"/*|\
      "$PROJECT_ROOT/embedding"|"$PROJECT_ROOT/embedding"/*|\
      "$PROJECT_ROOT/prometheus-collector"|"$PROJECT_ROOT/prometheus-collector"/*)
        if [[ "$cmd" == *"main.py"* || "$cmd" == *"uvicorn"* || "$cmd" == *"next"* || "$cmd" == *"npm run start"* || "$cmd" == *"node "* ]]; then
          echo "$pid"
        fi
        ;;
    esac
  done | sort -n | uniq
}

stop_stale_code_processes() {
  local pids remaining
  pids="$(find_project_code_pids | tr '\n' ' ' || true)"
  if [[ -z "${pids// }" ]]; then
    echo "[stop] No stale project code process found"
    return 0
  fi

  echo "[stop] Stopping stale project code processes: $pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 2

  remaining="$(find_project_code_pids | tr '\n' ' ' || true)"
  if [[ -n "${remaining// }" ]]; then
    echo "[stop] Force killing remaining project code processes: $remaining"
    # shellcheck disable=SC2086
    kill -9 $remaining 2>/dev/null || true
  fi
}

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

if [[ "$STOP_STALE_PROCESSES" == "true" ]]; then
  stop_stale_code_processes
fi

if [[ "$STOP_DOCKER" == "true" ]]; then
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "ERROR: Compose file not found: $COMPOSE_FILE"
    exit 1
  fi

  echo "[stop] Stopping compose services"
  if [[ -f "$ENV_FILE" ]]; then
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans
  else
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
  fi
fi

echo "[stop] Done. Runtime data under cache/ and .runtime/ is preserved."
