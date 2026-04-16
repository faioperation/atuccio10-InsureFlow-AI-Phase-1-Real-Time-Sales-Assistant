import asyncio
import os
import json
import uvicorn
from fastapi import FastAPI, WebSocket
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# --- Modular Imports ---
from core.buffer import ChunkBuffer
from core.orchestrator_listener import OrchestratorListener
from nlu.intent_detector import NLUManager
from nlu.ner_extractor import EntityExtractor
from nlu.sentiment_analyzer import SentimentAnalyzer
from engine.memory import CallMemory
from engine.response_generator import ResponseEngine
from engine.state_machine import SalesStateMachine

# Load environment variables
load_dotenv()

# --- 1. COMPONENT INITIALIZATION ---
memory = CallMemory()
nlu = NLUManager()
ner = EntityExtractor()
sentiment = SentimentAnalyzer()
response_gen = ResponseEngine()
fsm = SalesStateMachine()
buffer = ChunkBuffer(window_seconds=int(os.getenv("CHUNK_BUFFER_SECONDS", 3)))

# --- 2. LIFESPAN MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Orchestrator via WebSocket
    log_url = os.getenv("ORCHESTRATOR_WS_URL")
    print(f"[SYSTEM] Connecting to Orchestrator at: {log_url}")
    
    # Initialize the Listener
    listener = OrchestratorListener(buffer, process_intelligence)
    
    # Start the listener loop as a background task
    listener_task = asyncio.create_task(listener.start())
    yield
    # Shutdown: Cleanup
    listener_task.cancel()
    print("[SYSTEM] AI Agent is shutting down...")

# --- 3. INITIALIZE APP (MUST BE BEFORE DECORATORS) ---
app = FastAPI(lifespan=lifespan)

# Dashboard Subscriber List
ai_subscribers = []

# --- 4. CORE INTELLIGENCE FUNCTION ---
async def process_intelligence(raw_text):
    """
    Main pipeline to process raw text and broadcast insights.
    """
    print(f"\n[AI BRAIN] Analyzing: '{raw_text}'")
    call_id = "test_call_123" 

    # NLU and Intelligence Steps
    try:
        cleaned_text = await nlu.contextual_correction(raw_text)
        mood_result = await sentiment.analyze_sentiment(cleaned_text)
        entities = await ner.extract_entities(cleaned_text)
        
        # Sync with Redis Memory
        memory.update_transcript(call_id, cleaned_text)
        history = memory.get_full_history(call_id)
        
        # State Tracking
        current_phase = memory.get_state(call_id)
        new_phase = fsm.determine_phase(history, current_phase)
        memory.set_state(call_id, new_phase)

        # Retrieval Augmented Generation (RAG)
        knowledge_context = await nlu.get_relevant_tactic(cleaned_text)
        advice = await response_gen.generate_advice(cleaned_text, knowledge_context)
        
        if advice:
            # Prepare JSON data for the dashboard
            payload = {
                "type": "ai_insight",
                "phase": new_phase,
                "mood": mood_result.split('|')[0].strip(),
                "entities": entities,
                "advice": advice,
                "raw_text": cleaned_text
            }
            
            # Broadcast to all connected clients
            for ws in ai_subscribers[:]:
                try:
                    await ws.send_json(payload)
                    print(f"--- SENT TO DASHBOARD: {cleaned_text[:50]} ---")
                except Exception as e:
                    print(f"[ERROR] Broadcast failed: {e}")
                    ai_subscribers.remove(ws)
            
            print(f"--- AI ADVICE SENT TO DASHBOARD ---")

    except Exception as e:
        print(f"[CRITICAL ERROR] Pipeline failed: {e}")

# --- 5. ENDPOINTS (Warning will disappear now) ---
@app.websocket("/transcript-stream")
async def transcript_stream_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for dashboard/backend connection.
    URL: ws://localhost:5051/transcript-stream
    """
    await websocket.accept()
    ai_subscribers.append(websocket)
    print(f"[SYSTEM] Client connected to Agent. Active Subscribers: {len(ai_subscribers)}")
    try:
        while True:
            try:
                # Wait for any message (including ping)
                data = await websocket.receive_text()
                # If it's a ping, respond with pong to keep connection alive
                if data == '{"type": "ping"}':
                    await websocket.send_text('{"type": "pong"}')
            except Exception:
                break
    except Exception:
        if websocket in ai_subscribers:
            ai_subscribers.remove(websocket)
        print("[SYSTEM] Client disconnected.")

# --- 6. RUNNER ---
if __name__ == "__main__":
    port = int(os.getenv("AGENT_PORT", 5051))
    uvicorn.run(app, host="0.0.0.0", port=port)