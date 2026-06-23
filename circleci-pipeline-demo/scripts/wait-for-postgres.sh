#!/usr/bin/env bash
set -euo pipefail

host="${DB_HOST:-localhost}"
port="${DB_PORT:-5432}"
max_attempts="${DB_WAIT_ATTEMPTS:-30}"

attempt=0
until pg_isready -h "$host" -p "$port" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "postgres at ${host}:${port} not ready after ${max_attempts} attempts" >&2
    exit 1
  fi
  echo "waiting for postgres at ${host}:${port} (attempt ${attempt}/${max_attempts})..."
  sleep 1
done

echo "postgres is ready, starting application"
exec "$@"
