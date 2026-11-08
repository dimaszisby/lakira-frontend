# The production image (ADR-0048), run as a service in lakira-backend's Compose stacks
# (ADR-0047). Its contract is docs/reference/production-image.md; scripts/image-smoke.sh proves it.
#
# The node:24 tag follows .nvmrc (ADR-0018); the smoke test fails when they disagree.

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* values are inlined by `next build`, the API origin into the Content Security
# Policy too, so they are build arguments and an image serves one environment. Without the app's
# own URL, every page that loads its data on the server renders 404.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
RUN for name in NEXT_PUBLIC_APP_URL NEXT_PUBLIC_API_BASE_URL; do \
    eval "value=\${$name}"; \
    case "$value" in \
      http://*|https://*) ;; \
      *) echo "build argument $name is required, as an http(s):// URL" >&2; exit 1 ;; \
    esac; \
  done

# Nothing here runs Cypress, whose install script would download its binary (ADR-0019).
ENV CYPRESS_INSTALL_BINARY=0 \
  NEXT_TELEMETRY_DISABLED=1 \
  NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
  NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN NEXT_OUTPUT=standalone npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3000
# Node as PID 1 ignores SIGTERM unless it installs a handler; dumb-init forwards it.
RUN apk add --no-cache dumb-init
WORKDIR /app

# The standalone server, plus the two folders it serves but does not copy itself.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
# Alpine has no curl; Node's fetch does the same job. --start-interval needs Docker Engine 25+.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --start-interval=2s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
