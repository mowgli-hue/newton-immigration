#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Applying PostgreSQL schema..."
psql "$DATABASE_URL" -f ./db/schema.sql
echo "Schema applied."

