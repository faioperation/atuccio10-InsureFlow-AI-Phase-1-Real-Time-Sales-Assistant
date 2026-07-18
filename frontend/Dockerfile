# ==============================================================
# InsureFlow Frontend – Production Dockerfile (Next.js)
# ==============================================================
# Multi-stage build: deps → builder → production runner.
# Uses Next.js standalone output for minimal image size.
# ==============================================================

# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install only production node modules (+ devDeps needed for build).
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass the WebSocket URL at build time via build arg.
# At runtime NEXT_PUBLIC_ vars are baked in; override here if needed.
ARG NEXT_PUBLIC_WS_URL=ws://localhost:5051/transcript-stream
ENV NEXT_PUBLIC_WS_URL=

# Enable Next.js standalone output for minimal runtime image.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Non-root user.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only the minimal artefacts needed to run.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
