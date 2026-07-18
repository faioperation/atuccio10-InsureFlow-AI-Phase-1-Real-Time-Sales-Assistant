# ==============================================================
# InsureFlow AI Agent – Production Dockerfile
# ==============================================================
# Multi-stage build: slim runtime, non-root user, health check.
# ==============================================================

# ── Stage 1: Base ──────────────────────────────────────────────
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Stage 2: Dependencies ──────────────────────────────────────
FROM base AS dependencies

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 3: Production runtime ────────────────────────────────
FROM base AS runtime

COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Non-root user.
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

COPY --chown=appuser:appuser . .

EXPOSE 5051

# Health check – verifies the WebSocket HTTP upgrade handshake endpoint.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5051/docs')" || exit 1

CMD ["python", "main.py"]
