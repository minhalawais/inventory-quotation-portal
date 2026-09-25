#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/inventory-quotation-portal}"
APP_NAME="${APP_NAME:-inventory-quotation-portal}"
BRANCH="${BRANCH:-main}"
COMMIT_SHA="${GITHUB_SHA:-}"

cd "$APP_DIR"

echo "Fetching latest code..."
git fetch --prune origin "$BRANCH"

if [ -n "$COMMIT_SHA" ]; then
  git checkout --force "$COMMIT_SHA"
else
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

echo "Cleaning previous dependency install..."
rm -rf node_modules

echo "Installing production dependencies..."
npm ci

echo "Building Next.js app..."
npm run build

echo "Running database migrations..."
npm run db:migrate

echo "Restarting PM2 service..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --only "$APP_NAME"
fi

pm2 save

echo "Checking local application health..."
for attempt in {1..20}; do
  if curl -fsS "http://127.0.0.1:3000/auth/signin" >/dev/null; then
    echo "Deployment complete."
    exit 0
  fi
  echo "Waiting for app to respond... ($attempt/20)"
  sleep 3
done

echo "Application did not respond after deployment." >&2
pm2 logs "$APP_NAME" --lines 80 --nostream || true
exit 1
