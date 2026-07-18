# ==============================================================
# InsureFlow Orchestrator – Production Dockerfile
# ==============================================================
# Multi-stage build: slim runtime image, non-root user, no dev
# dependencies, health-check ready.
# ==============================================================

# ── Stage 1: Base image ────────────────────────────────────────
FROM python:3.11-slim AS base

# Disable .pyc files and enable unbuffered stdout (important for
# container log streaming).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Stage 2: Dependencies ──────────────────────────────────────
FROM base AS dependencies

# Install system libs needed to compile any C extensions.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 3: Production runtime ────────────────────────────────
FROM base AS runtime

# Copy installed packages from the dependencies stage.
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Create and switch to a non-root user for security.
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

# Copy application source.
COPY --chown=appuser:appuser . .

# Expose the Orchestrator port (overridden by PORT env var at runtime).
EXPOSE 5050

# Health check – verifies the HTTP server is responsive.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5050/docs')" || exit 1

# Graceful shutdown is handled by Uvicorn's SIGTERM handler.
CMD ["python", "main.py"]
