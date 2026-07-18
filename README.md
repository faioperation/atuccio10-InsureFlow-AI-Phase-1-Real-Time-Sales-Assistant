<div align="center">

# ⚡ InsureFlow AI – Real-Time Sales Assistant

**Live conversation intelligence for insurance sales calls.**  
Listens to every word, understands intent, detects objections, and whispers AI-powered advice to your agent — all in under 3 seconds.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai)](https://openai.com)
[![Pinecone](https://img.shields.io/badge/Pinecone-RAG-00C8C8)](https://pinecone.io)
[![Redis](https://img.shields.io/badge/Redis-Memory-DC382D?logo=redis)](https://redis.io)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2-13EF93)](https://deepgram.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Technology Stack](#4-technology-stack)
5. [Prerequisites](#5-prerequisites)
6. [Environment Setup](#6-environment-setup)
7. [Run Locally (Without Docker)](#7-run-locally-without-docker)
8. [Docker Deployment](#8-docker-deployment)
9. [Production Deployment (Linux VPS)](#9-production-deployment-linux-vps)
10. [API Documentation](#10-api-documentation)
11. [AI Pipeline Documentation](#11-ai-pipeline-documentation)
12. [Security](#12-security)
13. [Performance](#13-performance)
14. [Monitoring & Logging](#14-monitoring--logging)
15. [Troubleshooting](#15-troubleshooting)
16. [Known Issues & Improvement Roadmap](#16-known-issues--improvement-roadmap)

---

## 1. Project Overview

InsureFlow AI is a **real-time conversation intelligence system** purpose-built for insurance sales teams. When a sales agent takes a call, the system:

1. **Captures** the live audio stream from Twilio (both agent and customer tracks).
2. **Transcribes** it in real time using Deepgram Nova-2 at <300 ms latency.
3. **Processes** each transcript chunk through an AI pipeline:
   - Fixes misheared words (contextual correction)
   - Detects sentiment (Interested / Frustrated / Neutral)
   - Extracts key entities (person names, amounts, products, dates)
   - Identifies the current sales phase (Hook → Discovery → Objection → Closing)
   - Retrieves matching tactics from a RAG knowledge base (Pinecone)
4. **Generates** a concise, actionable recommendation (≤40 words) using GPT-4o-mini.
5. **Broadcasts** the insight to a live Next.js dashboard the agent watches in real time.

The result: every agent has a senior sales coach whispering optimal responses, live, on every call.

---

## 2. Architecture

```
                          ┌─────────────────────────────────────────┐
                          │            TWILIO CLOUD                  │
                          │  Incoming Call → TwiML → Audio Stream    │
                          └──────────────────┬──────────────────────┘
                                             │ WSS (mulaw, 8kHz)
                          ┌──────────────────▼──────────────────────┐
                          │       InsureFlow Orchestrator            │
                          │  FastAPI · Port 5050                     │
                          │                                          │
                          │  /voice        ← Twilio webhook          │
                          │  /media-stream ← Twilio audio WS         │
                          │  /transcript-stream → raw text WS        │
                          │                                          │
                          │  ┌────────────────────────────────┐     │
                          │  │  TranscriptionService          │     │
                          │  │  Deepgram Nova-2 (WSS)         │     │
                          │  │  diarize=True (2 speakers)     │     │
                          │  └──────────────┬─────────────────┘     │
                          │                 │ transcript text        │
                          │  asyncio.Queue → broadcast_worker        │
                          └──────────────────┬──────────────────────┘
                                             │ WS /transcript-stream
                          ┌──────────────────▼──────────────────────┐
                          │         InsureFlow AI Agent              │
                          │  FastAPI · Port 5051                     │
                          │                                          │
                          │  OrchestratorListener (WS client)        │
                          │       ↓ raw text chunks                  │
                          │  ChunkBuffer (3-second silence window)   │
                          │       ↓ batched text                     │
                          │  ┌────────────────────────────────┐     │
                          │  │  AI Pipeline (per chunk)       │     │
                          │  │  1. NLUManager.contextual_correction  │
                          │  │  2. SentimentAnalyzer.analyze_sentiment│
                          │  │  3. EntityExtractor.extract_entities  │
                          │  │  4. CallMemory (Redis) – persist      │
                          │  │  5. SalesStateMachine.determine_phase │
                          │  │  6. NLUManager.get_relevant_tactic   │
                          │  │     (Pinecone embedding + query)     │
                          │  │  7. ResponseEngine.generate_advice   │
                          │  │     (GPT-4o-mini, ≤40 words)         │
                          │  └──────────────┬─────────────────┘     │
                          │                 │ JSON ai_insight        │
                          │  WS /transcript-stream (server)          │
                          └──────────────────┬──────────────────────┘
                                             │ WSS from browser
                          ┌──────────────────▼──────────────────────┐
                          │        InsureFlow Frontend               │
                          │  Next.js 16 · Port 3000                  │
                          │                                          │
                          │  useAIWebSocket hook                     │
                          │       ↓                                  │
                          │  Dashboard · Live Transcript             │
                          │  AI Advice · Sentiment · Entities        │
                          │  Phase Indicator · Stats Panel           │
                          └─────────────────────────────────────────┘

External Services
  OpenAI API  ─── NLU correction, NER, Sentiment, Response
  Pinecone    ─── Vector DB (sales-playbook embeddings)
  Redis Cloud ─── Conversation memory & phase state
  Deepgram    ─── Real-time speech-to-text
  Twilio      ─── Phone call handling & audio streaming
```

### Data Flow Summary

| Step | Input | Process | Output |
|------|-------|---------|--------|
| 1 | Phone call | Twilio captures audio | WSS audio stream |
| 2 | Audio binary (mulaw/8kHz) | Deepgram Nova-2 transcription | Text chunks |
| 3 | Text chunks | asyncio.Queue + broadcast_worker | Raw text via WS |
| 4 | Raw text | ChunkBuffer (3s window) | Batched sentence |
| 5 | Sentence | GPT-4o-mini contextual correction | Cleaned text |
| 6 | Cleaned text | GPT-4o-mini sentiment | Label + score |
| 7 | Cleaned text | GPT-4o-mini JSON NER | Entity dict |
| 8 | Cleaned text | Redis APPEND | Persistent history |
| 9 | History | SalesStateMachine keyword rules | Phase string |
| 10 | Cleaned text | text-embedding-3-small + Pinecone | Tactics context |
| 11 | Text + context | GPT-4o-mini | ≤40-word advice |
| 12 | ai_insight JSON | WebSocket broadcast | Dashboard update |

---

## 3. Folder Structure

```
InsureFlow-AI/
├── InsureFlow_Orchestrator/       # Twilio + Deepgram bridge service
│   ├── main.py                    # FastAPI app, endpoints, broadcast worker
│   ├── requirements.txt           # Pinned Python dependencies
│   ├── Dockerfile                 # Multi-stage production image
│   ├── .env.example               # Required environment variables
│   ├── services/
│   │   ├── transcription.py       # Deepgram LiveClient wrapper
│   │   └── twilio_manager.py      # TwiML generator
│   └── utils/
│       └── logger.py              # Timestamped console logging
│
├── InsureFlow_AI_Agent/           # AI intelligence service
│   ├── main.py                    # FastAPI app, AI pipeline, WS broadcast
│   ├── requirements.txt           # Pinned Python dependencies
│   ├── Dockerfile                 # Multi-stage production image
│   ├── .env.example               # Required environment variables
│   ├── core/
│   │   ├── buffer.py              # ChunkBuffer – silence-window batching
│   │   └── orchestrator_listener.py # WS client + reconnect loop
│   ├── nlu/
│   │   ├── intent_detector.py     # Contextual correction + Pinecone RAG
│   │   ├── ner_extractor.py       # GPT-4o-mini entity extraction
│   │   └── sentiment_analyzer.py  # GPT-4o-mini sentiment analysis
│   └── engine/
│       ├── memory.py              # Redis conversation memory
│       ├── state_machine.py       # Keyword-based phase detection
│       └── response_generator.py  # GPT-4o-mini advice generation
│
├── frontend/                      # Next.js real-time dashboard
│   ├── next.config.ts             # Standalone output enabled for Docker
│   ├── package.json               # Dependencies
│   ├── Dockerfile                 # Multi-stage Next.js production image
│   ├── .env.example               # NEXT_PUBLIC_WS_URL
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root layout + ThemeProvider
│       │   ├── page.tsx           # Main dashboard page + views
│       │   └── globals.css        # Tailwind v4 + CSS variables
│       ├── components/
│       │   ├── AIAdvice.tsx       # AI recommendation card
│       │   ├── ConnectionStatus.tsx # WS status indicator
│       │   ├── EntityDisplay.tsx  # Extracted entities grid
│       │   ├── LiveTranscript.tsx # Scrolling transcript feed
│       │   ├── PhaseIndicator.tsx # Sales phase progress bar
│       │   ├── SentimentDisplay.tsx # Sentiment + score display
│       │   ├── Sidebar.tsx        # Navigation sidebar
│       │   ├── StatsPanel.tsx     # Session stats (duration, phase, sentiment)
│       │   └── ThemeToggle.tsx    # Light/Dark toggle button
│       ├── hooks/
│       │   └── useAIWebSocket.ts  # WS connection, heartbeat, reconnect
│       ├── providers/
│       │   └── ThemeProvider.tsx  # Theme context + localStorage persistence
│       ├── lib/
│       │   └── utils.ts           # cn() className utility
│       └── types/
│           └── index.ts           # TypeScript interfaces (AIInsight, CallSession)
│
├── docker-compose.yml             # Base / development compose file
├── docker-compose.prod.yml        # Production overlay (Nginx, no exposed ports)
├── docker-compose.dev.yml         # Development overlay (hot-reload volumes)
├── nginx.conf                     # Nginx reverse proxy + SSL config
└── .dockerignore                  # Files excluded from Docker build context
```

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Orchestrator** | Python | 3.11 | Runtime |
| | FastAPI | 0.110 | WebSocket server + HTTP webhook |
| | Uvicorn | 0.29 | ASGI server |
| | Twilio | 9.0.4 | Phone call handling + TwiML |
| | Deepgram SDK | 3.2.0 | Real-time STT (Nova-2) |
| | websockets | 12.0 | WS broadcast to AI Agent |
| | python-dotenv | 1.0.1 | Environment variable loading |
| **AI Agent** | Python | 3.11 | Runtime |
| | FastAPI | 0.110 | WebSocket server |
| | OpenAI SDK | 1.23.0 | GPT-4o-mini + text-embedding-3-small |
| | Pinecone | 3.2.2 | Vector DB for RAG retrieval |
| | Redis (redis-py) | 5.0.3 | Conversation memory + state |
| | websockets | 12.0 | WS client → Orchestrator |
| **Frontend** | Next.js | 16.2.4 | React framework |
| | React | 19.2.4 | UI library |
| | TypeScript | 5 | Type safety |
| | Tailwind CSS | 4 | Utility-first styling |
| | lucide-react | 1.8.0 | Icon set |
| | clsx + tailwind-merge | latest | Class name utilities |
| **Infrastructure** | Docker | — | Containerization |
| | Nginx | 1.25-alpine | Reverse proxy + TLS termination |
| | Redis Cloud | — | Managed Redis (external) |
| | Pinecone | — | Managed vector DB (external) |

**AI Models Used:**

| Model | Provider | Used For |
|-------|---------|---------|
| `gpt-4o-mini` | OpenAI | Contextual correction, NER, Sentiment, Response generation |
| `text-embedding-3-small` | OpenAI | Pinecone embedding for RAG queries |
| `nova-2` | Deepgram | Real-time speech-to-text transcription |

---

## 5. Prerequisites

### Local Development
- Python **3.11+** (`python --version`)
- Node.js **20+** + npm (`node --version`)
- Git

### External Services (All Required)
- **Twilio** account with a phone number and an **ngrok** (or tunnel) URL for local webhooks
- **Deepgram** account with an API key
- **OpenAI** account with an API key (GPT-4o-mini access)
- **Pinecone** account with:
  - An index named (e.g.) `insureflow-tactics`
  - Dimension: **1536** (matches `text-embedding-3-small`)
  - Pre-populated with your sales-playbook knowledge chunks
- **Redis** — either Redis Cloud (recommended) or a local Redis instance

---

## 6. Environment Setup

### Orchestrator
```bash
cp InsureFlow_Orchestrator/.env.example InsureFlow_Orchestrator/.env
# Edit and fill in: TWILIO_PHONE_NUMBER, TARGET_PHONE_NUMBER, DEEPGRAM_API_KEY
```

### AI Agent
```bash
cp InsureFlow_AI_Agent/.env.example InsureFlow_AI_Agent/.env
# Edit and fill in: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME,
#                   REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### Frontend
```bash
cp frontend/.env.example frontend/.env.local
# The default value (ws://localhost:5051/transcript-stream) works for local dev.
# For production, set NEXT_PUBLIC_WS_URL=wss://your-domain.com/ai/transcript-stream
```

---

## 7. Run Locally (Without Docker)

Open **three separate terminals**.

**Terminal 1 – Orchestrator**
```bash
cd InsureFlow_Orchestrator
pip install -r requirements.txt
python main.py
# Runs on http://localhost:5050
```

**Terminal 2 – AI Agent**
```bash
cd InsureFlow_AI_Agent
pip install -r requirements.txt
python main.py
# Runs on http://localhost:5051
# Automatically connects to ws://localhost:5050/transcript-stream
```

**Terminal 3 – Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Terminal 4 – ngrok (for Twilio webhook)**
```bash
ngrok http 5050
# Copy the HTTPS URL and set it as the Twilio Voice webhook:
# https://<ngrok-id>.ngrok.io/voice
```

Configure your Twilio phone number's **Voice webhook** to `https://<your-ngrok-url>/voice` (HTTP POST).

---

## 8. Docker Deployment

### Quick Start (Development)
```bash
# 1. Copy and fill in all .env files (see Section 6)
cp InsureFlow_Orchestrator/.env.example InsureFlow_Orchestrator/.env
cp InsureFlow_AI_Agent/.env.example     InsureFlow_AI_Agent/.env
cp frontend/.env.example                frontend/.env.local

# 2. Build and start all services
docker compose up --build

# Services:
#   Orchestrator: http://localhost:5050
#   AI Agent:     http://localhost:5051
#   Frontend:     http://localhost:3000
```

### Production (with Nginx + SSL)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Services exposed only via Nginx on ports 80/443.
# Set NEXT_PUBLIC_WS_URL=wss://your-domain.com/ai/transcript-stream
# before building the frontend image.
```

### Useful Commands
```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f ai_agent

# Restart a single service
docker compose restart orchestrator

# Stop everything
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild a single service
docker compose up -d --build ai_agent
```

---

## 9. Production Deployment (Linux VPS)

### Server Setup (Ubuntu 22.04)

```bash
# 1. Update and install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# 2. Clone the repository
git clone <repo-url> /opt/insureflow
cd /opt/insureflow

# 3. Configure environment files
cp InsureFlow_Orchestrator/.env.example InsureFlow_Orchestrator/.env
cp InsureFlow_AI_Agent/.env.example     InsureFlow_AI_Agent/.env
# Edit all .env files with production values

# 4. Configure Nginx (replace domain in nginx.conf)
sed -i 's/your-domain.com/api.yourcompany.com/g' nginx.conf

# 5. Obtain SSL certificate with Certbot
sudo apt install -y certbot
sudo certbot certonly --standalone -d api.yourcompany.com

# 6. Deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP (redirect to HTTPS)
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Systemd Auto-Restart (Optional)
```bash
sudo tee /etc/systemd/system/insureflow.service << 'EOF'
[Unit]
Description=InsureFlow AI Sales Assistant
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/opt/insureflow
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now insureflow
```

### Twilio Webhook
Set your Twilio number's **Voice** webhook to:
```
POST  https://your-domain.com/api/voice
```

---

## 10. API Documentation

### InsureFlow Orchestrator (Port 5050)

#### `POST/GET /voice`
Twilio webhook. Returns TwiML that starts the audio stream and bridges the call to `TARGET_PHONE_NUMBER`.

**Response:** `application/xml` (TwiML)
```xml
<Response>
  <Start>
    <Stream url="wss://your-domain.com/api/media-stream" track="both_tracks"/>
  </Start>
  <Dial callerId="+1XXXXXXXXXX" timeout="30">
    <Number>+1XXXXXXXXXX</Number>
  </Dial>
</Response>
```

#### `WS /media-stream`
Receives raw Twilio audio packets (mulaw, 8kHz, Base64-encoded). Pipes audio to Deepgram. Internal endpoint — do not expose publicly without authentication.

**Message format (inbound from Twilio):**
```json
{ "event": "media", "media": { "payload": "<base64>" } }
{ "event": "stop" }
```

#### `WS /transcript-stream`
Public endpoint. Streams raw transcript text to all connected subscribers (e.g., AI Agent).

**Messages (outbound):** plain text transcript strings.

---

### InsureFlow AI Agent (Port 5051)

#### `WS /transcript-stream`
Dashboard connection endpoint. Streams AI insights to all connected browser clients.

**Heartbeat (inbound from client):**
```json
{ "type": "ping" }
```

**Heartbeat (outbound to client):**
```json
{ "type": "pong" }
```

**AI Insight payload (outbound):**
```json
{
  "type": "ai_insight",
  "phase": "Discovery",
  "mood": "Interested",
  "entities": {
    "PERSON": ["John"],
    "AMOUNT": ["$500"],
    "DATE": ["next Monday"],
    "PRODUCT": ["Term Life"],
    "SPOUSE_NAME": ["Mary"]
  },
  "advice": "[Validation] Great concern John. [Pivot] Many families worry about coverage gaps. [Knowledge] Term life at $500/month covers 20 years. [Soft Close] Shall we check Mary's eligibility too?",
  "raw_text": "I'm not sure if I can afford the premiums right now."
}
```

---

## 11. AI Pipeline Documentation

### Models
| Model | Input | Output | Max Tokens |
|-------|-------|--------|-----------|
| `gpt-4o-mini` | Raw transcript | Corrected text | unlimited |
| `gpt-4o-mini` | Corrected text | Sentiment label + score | 20 |
| `gpt-4o-mini` | Corrected text | JSON entity dict | unlimited |
| `text-embedding-3-small` | Corrected text | 1536-dim vector | — |
| `gpt-4o-mini` | Text + RAG context | ≤40-word advice | 150 |

### Pinecone RAG
- **Index dimension:** 1536 (matches `text-embedding-3-small`)
- **Namespace:** `sales-playbook-v1`
- **Top-K:** 3 results
- **Score threshold:** 0.60 (chunks below this are discarded)
- **Knowledge chunks** should follow the format: `{ "text": "..tactic content.." }`

### Redis Memory Schema
| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `transcript:{call_id}` | String | 3600s | Full conversation history |
| `state:{call_id}` | String | none | Current sales phase |

> **Note:** `call_id` is currently hardcoded to `"test_call_123"`. See [Known Issues](#16-known-issues--improvement-roadmap).

### Sales State Machine
| Phase | Trigger Keywords |
|-------|----------------|
| `Objection` | price, cost, expensive, busy, think about |
| `Closing` | quote, meeting, sign up, ready |
| `Discovery` | transcript length > 50 words |
| (unchanged) | none of the above |

### Response Format
- **Sales domain:** [Validation] → [Pivot] → [Knowledge] → [Soft Close]
- **Technical domain:** [Analysis] → [Technical Insight] → [Verification Question]

---

## 12. Security

### Current State
| Control | Status | Notes |
|---------|--------|-------|
| Non-root Docker user | ✅ | `appuser` in all Python images, `nextjs` in frontend |
| Secrets via env vars | ✅ | `.env` files, never in source code |
| `.gitignore` | ✅ | `.env` excluded in all services |
| Pinned dependencies | ✅ | All versions pinned after this audit |
| Health checks | ✅ | All containers |
| WebSocket authentication | ❌ | No token required to connect |
| Rate limiting | ❌ | No rate limiting on any endpoint |
| CORS configuration | ❌ | FastAPI default (allow-all) |
| Twilio signature validation | ❌ | `/voice` webhook not verified |
| HTTPS / TLS | ✅ | Nginx handles TLS termination in production |

### Recommended Immediate Fixes
1. **Twilio webhook signature** – Validate `X-Twilio-Signature` header using `twilio.request_validator`.
2. **WebSocket authentication** – Require a token query parameter on `/transcript-stream`.
3. **CORS** – Restrict origins in FastAPI `CORSMiddleware` to your frontend domain.
4. **Rate limiting** – Add `slowapi` to both Python services.

---

## 13. Performance

### Latency Budget (per transcript chunk)
| Step | Typical Latency |
|------|----------------|
| Deepgram transcription | ~100–300 ms |
| Buffer accumulation | 3000 ms (configurable) |
| OpenAI correction | ~200–400 ms |
| OpenAI sentiment | ~100–200 ms |
| OpenAI NER | ~200–400 ms |
| Pinecone query | ~50–150 ms |
| OpenAI advice generation | ~300–600 ms |
| **Total E2E** | **~4–5 seconds** |

### Bottlenecks
- **Sequential OpenAI calls** – Correction, sentiment, and NER are called one after another. Running them in parallel with `asyncio.gather()` would reduce latency by ~50%.
- **ChunkBuffer default (3s)** – Configurable via `CHUNK_BUFFER_SECONDS`. Reducing to 1–2s decreases latency but may increase noise.
- **No caching** – Identical transcript segments trigger full re-processing. An LRU cache on embeddings would reduce Pinecone + OpenAI calls.

---

## 14. Monitoring & Logging

### Current Logging
All services use timestamped `print()` / `log_info()` / `log_error()` to stdout. Docker captures these via the `json-file` log driver.

```bash
# View all logs
docker compose logs -f

# Follow AI Agent logs only
docker compose logs -f ai_agent

# Search for errors
docker compose logs | grep -i error
```

### Recommended Additions
- **Structured logging** – Replace `print()` with Python `logging` module using JSON format.
- **Prometheus metrics** – Track OpenAI token usage, latency per pipeline step, WS subscriber count.
- **Grafana + Loki** – Log aggregation for multi-instance deployments.
- **Sentry** – Error tracking for the AI pipeline and frontend.

---

## 15. Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| AI Agent fails to start | `ORCHESTRATOR_WS_URL` unreachable | Start Orchestrator first; check URL |
| "Pinecone index not found" | Wrong `PINECONE_INDEX_NAME` or API key | Verify in Pinecone console |
| Redis connection refused | Wrong `REDIS_HOST`/`PORT`/`PASSWORD` | Check Redis Cloud credentials |
| Frontend shows "Waiting for Connection" | AI Agent not running or wrong port | Ensure agent is on port 5051 |
| Twilio call fails | ngrok expired or wrong webhook URL | Restart ngrok, update Twilio webhook |
| No transcript appearing | Deepgram API key invalid | Check `DEEPGRAM_API_KEY` |
| Docker health check failing | Service still starting | Increase `start_period` in compose |

---

## 16. Known Issues & Improvement Roadmap

### Known Issues (from audit)

| ID | Severity | Issue | Location |
|----|----------|-------|---------|
| KI-01 | 🔴 Critical | `call_id` hardcoded to `"test_call_123"` – all calls share one Redis key | `main.py:60` |
| KI-02 | 🔴 Critical | No Twilio webhook signature validation | `orchestrator/main.py` |
| KI-03 | 🟠 High | No WebSocket authentication | Both services |
| KI-04 | 🟠 High | Sequential OpenAI API calls add ~800ms unnecessary latency | `main.py:63-66` |
| KI-05 | 🟠 High | `@app.on_event("startup")` is deprecated in FastAPI 0.110 (use `lifespan`) | `orchestrator/main.py:50` |
| KI-06 | 🟠 High | `asyncio.ensure_future()` deprecated; use `asyncio.create_task()` | `orchestrator_listener.py:25` |
| KI-07 | 🟡 Medium | State machine uses keyword matching – fragile for real calls | `state_machine.py` |
| KI-08 | 🟡 Medium | No CORS configuration in either FastAPI service | Both services |
| KI-09 | 🟡 Medium | `import json` inside function body (minor code smell) | `ner_extractor.py:27` |
| KI-10 | 🟡 Medium | `SentimentHistory` component exported but never used | `SentimentDisplay.tsx` |
| KI-11 | 🟡 Medium | Analytics view shows hardcoded zeros (no persistence) | `page.tsx:208` |
| KI-12 | 🟡 Medium | No rate limiting on any endpoint | Both services |
| KI-13 | 🔵 Low | Logger uses `print()` instead of Python `logging` module | `utils/logger.py` |
| KI-14 | 🔵 Low | Settings view hardcodes model name & buffer (not dynamic) | `page.tsx:244` |

### Improvement Roadmap

**Phase 1 – Critical Fixes (immediate)**
- [ ] Generate unique `call_id` from Twilio `CallSid` header
- [ ] Add Twilio webhook signature validation
- [ ] Add token-based WS authentication
- [ ] Parallelize OpenAI calls with `asyncio.gather()`

**Phase 2 – Stability (within 1 sprint)**
- [ ] Replace `on_event("startup")` with `lifespan` context manager in Orchestrator
- [ ] Replace `asyncio.ensure_future()` with `asyncio.create_task()`
- [ ] Add CORS middleware with domain allowlist
- [ ] Upgrade state machine to LLM-based phase detection

**Phase 3 – Observability (within 1 month)**
- [ ] Replace `print()` logging with structured JSON logging
- [ ] Add Prometheus metrics endpoint
- [ ] Integrate Sentry for error tracking
- [ ] Add OpenAI token usage tracking to prevent cost overruns

**Phase 4 – Scale (as needed)**
- [ ] Multi-call support (unique call IDs per session)
- [ ] Call history persistence (PostgreSQL / Supabase)
- [ ] Conversation summary at call end
- [ ] Analytics backend (aggregate sentiment trends, phase distribution)
- [ ] Admin dashboard for call history replay

---

## License

Proprietary – InsureFlow AI Sales Assistant. All rights reserved.

---

<div align="center">
Built with ⚡ by the InsureFlow team
</div>
