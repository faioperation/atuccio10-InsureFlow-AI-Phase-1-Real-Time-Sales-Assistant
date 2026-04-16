import asyncio
import websockets
import os
import time
from dotenv import load_dotenv

load_dotenv()

class OrchestratorListener:
    def __init__(self, buffer, processor_callback):
        self.url = os.getenv("ORCHESTRATOR_WS_URL")
        self.buffer = buffer
        self.processor_callback = processor_callback

    async def buffer_checker(self):
        """
        Background task that checks the buffer every 300ms.
        This ensures processing happens even if no new words are coming.
        """
        while True:
            if self.buffer.is_ready():
                meaningful_text = self.buffer.get_and_clear()
                print(f"[BUFFER] Ready to process: '{meaningful_text}'")
                # Use ensure_future to run processor in background without blocking the timer
                asyncio.ensure_future(self.processor_callback(meaningful_text))
            await asyncio.sleep(0.3)

    async def start(self):
        """Connect to the orchestrator and listen for live transcripts."""
        # Start the background timer
        asyncio.create_task(self.buffer_checker())
        
        while True:
            try:
                print(f"[SYSTEM] Attempting to connect to {self.url}...")
                async with websockets.connect(self.url, ping_interval=30, ping_timeout=10) as websocket:
                    print(f"[CONNECTED] AI Agent linked with Orchestrator.")
                    while True:
                        raw_transcript = await websocket.recv()
                        print(f"[RECEIVED] Raw transcript: '{raw_transcript}'")
                        # Immediately add to buffer
                        self.buffer.add_chunk(raw_transcript)
                                
            except Exception as e:
                print(f"[ERROR] Connection lost: {e}. Retrying in 3s...")
                await asyncio.sleep(3)