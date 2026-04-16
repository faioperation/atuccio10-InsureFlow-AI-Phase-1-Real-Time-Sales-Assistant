import os
import json
import base64
import asyncio
from fastapi import FastAPI, WebSocket, Request, Response
from dotenv import load_dotenv

# Import our custom services
from services.twilio_manager import TwilioManager
from services.transcription import TranscriptionService
from utils.logger import log_info, log_transcript

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# Initialize Twilio Manager
twilio_mgr = TwilioManager()

# List to keep track of connected testers or future UI dashboards
ai_subscribers = [] 

# High-speed Queue to handle rapid-fire raw transcripts without data loss
transcript_queue = asyncio.Queue()

async def broadcast_worker():
    """
    Continuous worker that broadcasts pure raw transcript text to all subscribers.
    This ensures thread-safety and prevents any data drops.
    """
    while True:
        # Wait for a raw transcript chunk to arrive in the queue
        raw_text = await transcript_queue.get()
        
        # Log the raw data to terminal for live monitoring
        log_transcript("RAW-STREAM", raw_text)
        
        # Send pure text to all connected subscribers (e.g., WebSocket King)
        for ws in ai_subscribers[:]:
            try:
                await ws.send_text(raw_text)
            except Exception:
                # Remove inactive or disconnected subscribers
                ai_subscribers.remove(ws)
        
        # Mark the task as done
        transcript_queue.task_done()

@app.on_event("startup")
async def startup_event():
    """
    Launch the broadcast_worker as a background task when the server starts.
    """
    asyncio.create_task(broadcast_worker())

@app.api_route("/voice", methods=["GET", "POST"])
async def handle_voice(request: Request):
    """
    Twilio Webhook: Entry point for incoming calls.
    Generates TwiML to start audio streaming and redirect the call.
    """
    log_info(f"Incoming call received via {request.method} request...")
    
    # Generate TwiML instructions
    twiml_xml = twilio_mgr.generate_twiml(request.url.hostname)
    
    return Response(content=twiml_xml, media_type="application/xml")

@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    """
    Heart of the Orchestrator:
    Receives raw audio packets from Twilio and pipes them to Deepgram.
    """
    await websocket.accept()
    log_info("Twilio Audio Stream Connected.")

    def handle_dg_transcript(speaker_id, text):
        """
        UPDATED: This callback now ignores the speaker_id.
        It pushes only the pure raw text into the broadcast queue.
        """
        transcript_queue.put_nowait(text)

    # Initialize the Transcription Service
    # Note: TranscriptionService still passes speaker_id, but we ignore it here
    dg_service = TranscriptionService(on_transcript_callback=handle_dg_transcript)
    await dg_service.start()

    try:
        while True:
            # Receive real-time audio data chunks from Twilio
            data = await websocket.receive_text()
            packet = json.loads(data)

            if packet['event'] == 'media':
                # Decode Twilio's Base64 audio payload to binary for Deepgram
                payload = packet['media']['payload']
                audio_binary = base64.b64decode(payload)
                
                # Push the audio chunk to Deepgram immediately
                dg_service.send_audio(audio_binary)
            
            elif packet['event'] == 'stop':
                log_info("Twilio Stream Stopped.")
                break
                
    except Exception as e:
        log_info(f"WebSocket Loop Error: {e}")
    finally:
        # Ensure Deepgram connection is closed safely
        dg_service.stop()
        if not websocket.client_state.name == "DISCONNECTED":
            await websocket.close()

# --- PUBLIC ENDPOINT FOR DATA CONSUMPTION ---
@app.websocket("/transcript-stream")
async def transcript_stream_endpoint(websocket: WebSocket):
    """
    Your AI agent or any UI can connect to this endpoint 
    to receive the continuous live raw transcript stream.
    """
    await websocket.accept()
    ai_subscribers.append(websocket)
    log_info("A subscriber has connected to the Transcript Stream.")
    
    try:
        while True:
            # Keep the connection open indefinitely to receive broadcasts
            await asyncio.sleep(3600) 
    except Exception:
        if websocket in ai_subscribers:
            ai_subscribers.remove(websocket)
        log_info("Subscriber disconnected.")

if __name__ == "__main__":
    import uvicorn
    # Use the port defined in .env or default to 5050
    port = int(os.getenv("PORT", 5050))
    log_info(f"Orchestrator starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)