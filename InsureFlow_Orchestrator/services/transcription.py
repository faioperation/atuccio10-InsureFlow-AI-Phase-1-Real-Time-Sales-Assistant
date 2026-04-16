import os
from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

class TranscriptionService:
    def __init__(self, on_transcript_callback):
        """
        Initializes the Deepgram client and sets the callback for handling results.
        The callback expects two arguments: speaker_id and transcript_text.
        """
        self.client = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))
        self.on_transcript_callback = on_transcript_callback
        self.connection = None

    async def start(self):
        """
        Establishes a real-time WebSocket connection with Deepgram 
        optimized for Twilio's mulaw 8000Hz audio stream.
        """
        self.connection = self.client.listen.live.v("1")

        # Configuration optimized for Paid Twilio accounts
        options = LiveOptions(
            model="nova-2",
            language="en-US",
            encoding="mulaw",
            sample_rate=8000,
            interim_results=True,  # Set to True for continuous raw streaming
            endpointing=100,       # Quick end-of-sentence detection (100ms)
            diarize=True,          # Essential for distinguishing between Agent and Customer
            smart_format=True,     # Adds punctuation and formatting automatically
            filler_words=False     # Filters out 'um' and 'uh' for a cleaner AI prompt later
        )

        def on_message(self_dg, result, **kwargs):
            """
            Triggered whenever Deepgram sends back a transcript packet.
            """
            alternatives = result.channel.alternatives[0]
            transcript = alternatives.transcript
            
            if transcript:
                # Extract Speaker ID from word metadata
                # Deepgram identifies different voice profiles as 0, 1, 2, etc.
                words = alternatives.words
                speaker_id = words[0].speaker if words else 0
                
                # Pass the identified speaker and the text back to the Orchestrator
                self.on_transcript_callback(speaker_id, transcript)

        def on_error(self_dg, error, **kwargs):
            """
            Error handling for the Deepgram connection.
            """
            print(f"[Deepgram Error] {error}")

        # Register event listeners
        self.connection.on(LiveTranscriptionEvents.Transcript, on_message)
        self.connection.on(LiveTranscriptionEvents.Error, on_error)

        # Start the live connection
        if self.connection.start(options) is False:
            print("Failed to initialize Deepgram connection.")
            return

    def send_audio(self, audio_data):
        """
        Pipes binary audio chunks received from Twilio directly to Deepgram.
        """
        if self.connection:
            self.connection.send(audio_data)

    def stop(self):
        """
        Gracefully closes the Deepgram connection when the call ends.
        """
        if self.connection:
            self.connection.finish()
            print("Deepgram transcription session finished.")