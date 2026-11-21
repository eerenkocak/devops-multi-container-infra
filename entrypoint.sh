#!/bin/sh
set -e

echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"INFO\",\"service\":\"entrypoint\",\"message\":\"Initializing container pre-flight checks...\"}"

# 1. Validate critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"ERROR\",\"service\":\"entrypoint\",\"message\":\"FATAL: DATABASE_URL environment variable is missing!\"}" >&2
    exit 1
fi

# 2. Extract DB host and port from DATABASE_URL and wait until reachable
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|^.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|^.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"INFO\",\"service\":\"entrypoint\",\"message\":\"Verifying database network reachability at ${DB_HOST}:${DB_PORT}...\"}"

MAX_RETRIES=15
COUNT=0
until nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
        echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"ERROR\",\"service\":\"entrypoint\",\"message\":\"Database unreachable after ${MAX_RETRIES} attempts. Aborting.\"}" >&2
        exit 1
    fi
    sleep 1
done

echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"level\":\"INFO\",\"service\":\"entrypoint\",\"message\":\"Pre-flight checks passed. Handing over control to main process (PID 1)...\"}"

# 3. Execute main CMD while preserving PID 1 for graceful SIGTERM shutdown
exec "$@"
