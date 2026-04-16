# InsureFlow AI Agent

Real-time conversation intelligence system for insurance sales calls. Processes live transcripts and provides AI-generated advice to sales agents.

## Architecture

```
InsureFlow_AI_Agent/
├── main.py                 # FastAPI app + WebSocket endpoint
├── .env                    # Configuration
├── requirements.txt        # Dependencies
├── core/                   # Core infrastructure
│   ├── orchestrator_listener.py  # WebSocket client to receive live transcripts
│   └── buffer.py                  # ChunkBuffer (3s window) accumulates transcript chunks
├── nlu/                   # Natural Language Understanding
│   ├── intent_detector.py         # Contextual correction + Pinecone RAG
│   ├── ner_extractor.py           # Entity extraction (PERSON, AMOUNT, DATE, etc.)
│   └── sentiment_analyzer.py      # Sentiment analysis (Interested/Frustrated/Neutral)
└── engine/                # AI Processing Engine
    ├── memory.py          # Redis-based conversation memory
    ├── state_machine.py   # Sales phase tracking (Hook → Discovery → Objection → Closing)
    └── response_generator.py  # GPT-4o-mini generates AI advice
```

## Data Flow

1. **Input**: WebSocket connects to Orchestrator (`ORCHESTRATOR_WS_URL`) receiving raw transcripts
2. **Buffer**: `ChunkBuffer` accumulates chunks for 3 seconds before processing
3. **NLU Pipeline**:
   - `contextual_correction`: Fixes misheard words (e.g., "psp" → "premium")
   - `analyze_sentiment`: Determines customer mood
   - `extract_entities`: Extracts PERSON, AMOUNT, DATE, PRODUCT, SPOUSE_NAME
4. **Memory**: Redis stores transcript history + current sales phase
5. **RAG**: Pinecone retrieves relevant tactics based on embeddings
6. **Generation**: GPT-4o-mini generates contextual advice (max 40 words)
7. **Output**: WebSocket broadcasts to dashboard via `/transcript-stream`

## Requirements

- Python 3.8+
- Redis Cloud (already configured in `.env`)
- Pinecone (already configured in `.env`)
- OpenAI API (already configured in `.env`)

## How to Run

```bash
cd InsureFlow_AI_Agent

# Install dependencies
pip install -r requirements.txt

# Run the AI Agent
python main.py
```

The agent will:
1. Connect to Orchestrator via WebSocket
2. Listen for live transcript chunks
3. Process and broadcast AI insights to dashboard on `ws://localhost:5051/transcript-stream`

## Configuration (.env)

| Variable | Description |
|----------|-------------|
| `AGENT_PORT` | FastAPI server port (default: 5051) |
| `OPENAI_API_KEY` | OpenAI GPT-4o-mini key |
| `PINECONE_API_KEY` | Pinecone RAG database key |
| `PINECONE_INDEX_NAME` | Pinecone index (insureflow-tactics) |
| `REDIS_HOST/PORT/PASSWORD` | Redis Cloud connection |
| `ORCHESTRATOR_WS_URL` | WebSocket URL to receive transcripts |
| `CHUNK_BUFFER_SECONDS` | Silence window before processing (default: 3) |