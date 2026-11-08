#!/usr/bin/env bash
# image-smoke.sh — build the production image and prove it runs (ADR-0048).
#
# Usage:
#   npm run docker:smoke
#   SMOKE_IMAGE=some:tag npm run docker:smoke   # test an existing image, skip the build
#
# What it checks:
#   1. The production Dockerfile builds, and refuses to without its build arguments.
#   2. The image runs as a non-root user.
#   3. It carries no devDependencies.
#   4. Its Node major version is the one .nvmrc pins (ADR-0018).
#   5. The pages answer 200 with a nonce in their Content Security Policy, so src/proxy.ts runs
#      in the standalone server (ADR-0026).
#   6. The static assets a page links are served.
#   7. Docker reports the image's own health check as healthy.
#   8. It stops cleanly on SIGTERM.
#
# It needs only Docker and curl. No backend runs: the pages it requests render without one. The
# app is published on a random localhost port, and everything is removed on exit, pass or fail.
# Modelled on lakira-backend's scripts/image-smoke.sh (its ADR-0055).

set -euo pipefail

cd "$(dirname "$0")/.."

APP="image-smoke-$$"
IMAGE="${SMOKE_IMAGE:-}"
WAIT_SECONDS="${SMOKE_WAIT_SECONDS:-60}"

# Local values: the build inlines them, and nothing here leaves the machine.
BUILD_ARGS=(
  --build-arg "NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000"
  --build-arg "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001/api/v1"
)

cleanup() {
  docker rm -fv "$APP" >/dev/null 2>&1 || true
}
trap cleanup EXIT

pass() {
  echo "[image-smoke] PASS  $1"
}

fail() {
  echo "[image-smoke] FAIL  $1" >&2
  if [[ -n "${2:-}" ]]; then
    echo "$2" >&2
  fi
  if docker inspect "$APP" >/dev/null 2>&1; then
    echo "[image-smoke] ---- app container log (last 60 lines) ----" >&2
    docker logs --tail 60 "$APP" >&2 2>&1 || true
  fi
  exit 1
}

# Any command that fails outside a check still ends in a FAIL line and the app log. Deliberately
# without `set -E`, so the failures the checks below expect do not fire it.
trap 'fail "unexpected error at line ${LINENO}"' ERR

in_image() {
  docker run --rm --entrypoint sh "$IMAGE" -c "$1"
}

# ---------------------------------------------------------------------------
# 1. Build
# ---------------------------------------------------------------------------
if [[ -z "$IMAGE" ]]; then
  # Left in place afterwards on purpose: the next build reuses its layers. --pull, so a cached
  # node:24-alpine never holds back a Node security release.
  IMAGE="lakira-frontend-image-smoke:local"
  echo "[image-smoke] building ${IMAGE} from ./Dockerfile"
  docker build --pull "${BUILD_ARGS[@]}" -t "$IMAGE" . || fail "1. image builds"
  pass "1. image builds"

  # Stops at the argument check, before any install, so it costs seconds. It must fail with the
  # guard's own message: any other failure (a pull, a daemon error) is not the guard working.
  if noargs_output="$(docker build --target build -t "${IMAGE}-noargs" . 2>&1)"; then
    docker image rm "${IMAGE}-noargs" >/dev/null 2>&1 || true
    fail "1. build refuses missing build arguments" "it built without NEXT_PUBLIC_APP_URL"
  fi
  grep -q "build argument NEXT_PUBLIC_APP_URL is required" <<<"$noargs_output" ||
    fail "1. build refuses missing build arguments" "it failed for another reason:
$(tail -n 20 <<<"$noargs_output")"
  pass "1. build refuses missing build arguments"
else
  docker image inspect "$IMAGE" >/dev/null 2>&1 ||
    fail "1. image exists" "SMOKE_IMAGE=${IMAGE} is not a local image"
  pass "1. image exists (SMOKE_IMAGE=${IMAGE}, build skipped)"
fi

# ---------------------------------------------------------------------------
# 2. Non-root
# ---------------------------------------------------------------------------
uid="$(in_image 'id -u')"
[[ "$uid" != "0" ]] || fail "2. runs as a non-root user" "id -u is 0"
pass "2. runs as a non-root user (uid ${uid})"

# ---------------------------------------------------------------------------
# 3. No devDependencies
# ---------------------------------------------------------------------------
# The traced node_modules holds next itself; a full install would also hold these.
in_image "test -d node_modules/next" || fail "3. carries the traced server" "node_modules/next is missing"
for dev_package in typescript jest eslint cypress; do
  if in_image "test -e node_modules/${dev_package}"; then
    fail "3. carries no devDependencies" "node_modules/${dev_package} is in the image"
  fi
done
pass "3. carries no devDependencies"

# ---------------------------------------------------------------------------
# 4. Node version
# ---------------------------------------------------------------------------
want_node="$(tr -d '[:space:]v' <.nvmrc)"
have_node="$(in_image 'node -p "process.versions.node.split(\".\")[0]"')"
[[ "$have_node" == "${want_node%%.*}" ]] ||
  fail "4. Node matches .nvmrc" "image runs Node ${have_node}, .nvmrc pins ${want_node}"
pass "4. Node matches .nvmrc (${have_node})"

# ---------------------------------------------------------------------------
# 5. Pages, with a nonce
# ---------------------------------------------------------------------------
docker run -d --name "$APP" -p 127.0.0.1::3000 "$IMAGE" >/dev/null
port="$(docker port "$APP" 3000/tcp | head -n 1 | sed 's/.*://')"
base="http://127.0.0.1:${port}"

ready=""
for _ in $(seq 1 "$WAIT_SECONDS"); do
  if curl -fsS -o /dev/null "${base}/"; then
    ready="yes"
    break
  fi
  sleep 1
done
[[ -n "$ready" ]] || fail "5. serves pages" "${base}/ did not answer within ${WAIT_SECONDS}s"

for route in / /login; do
  headers="$(curl -sS -D - -o /dev/null "${base}${route}")"
  status="$(head -n 1 <<<"$headers" | awk '{print $2}')"
  [[ "$status" == "200" ]] || fail "5. ${route} answers 200" "status ${status}"
  grep -qiE "^content-security-policy:.*'nonce-" <<<"$headers" ||
    fail "5. ${route} carries a nonce" "no nonce in its Content-Security-Policy"
done
pass "5. / and /login answer 200 with a nonce"

# ---------------------------------------------------------------------------
# 6. Static assets
# ---------------------------------------------------------------------------
asset="$(curl -fsS "${base}/" | grep -oE '/_next/static/[^"]+\.(css|js)' | head -n 1 || true)"
[[ -n "$asset" ]] || fail "6. serves static assets" "the home page links no /_next/static asset"
curl -fsS -o /dev/null "${base}${asset}" || fail "6. serves static assets" "${asset} did not answer"
pass "6. serves static assets (${asset})"

# ---------------------------------------------------------------------------
# 7. Health check
# ---------------------------------------------------------------------------
health=""
for _ in $(seq 1 "$WAIT_SECONDS"); do
  health="$(docker inspect -f '{{.State.Health.Status}}' "$APP")"
  [[ "$health" == "starting" ]] || break
  sleep 1
done
[[ "$health" == "healthy" ]] || fail "7. health check passes" "status ${health}"
pass "7. health check passes"

# ---------------------------------------------------------------------------
# 8. SIGTERM
# ---------------------------------------------------------------------------
docker stop -t 10 "$APP" >/dev/null
exit_code="$(docker inspect -f '{{.State.ExitCode}}' "$APP")"
# dumb-init exits with the status its child ended on. 143 is 128 + SIGTERM: Next ended on the signal
# it handles, within the timeout. 137 would be SIGKILL, sent when the timeout ran out.
[[ "$exit_code" == "0" || "$exit_code" == "143" ]] ||
  fail "8. stops on SIGTERM" "exit code ${exit_code}; 137 means it was killed after the timeout"
pass "8. stops on SIGTERM (exit ${exit_code})"

echo "[image-smoke] all checks passed for ${IMAGE}"
