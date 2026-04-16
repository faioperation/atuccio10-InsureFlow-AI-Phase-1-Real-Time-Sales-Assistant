import os
from twilio.twiml.voice_response import VoiceResponse, Dial, Start
from dotenv import load_dotenv

load_dotenv()

class TwilioManager:
    def __init__(self):
        self.target_number = os.getenv("TARGET_PHONE_NUMBER", "").strip()
        self.twilio_number = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    def generate_twiml(self, host: str):
        response = VoiceResponse()
        
        start = Start()
        stream_url = f"wss://{host}/media-stream"
        
        # CHANGED: Use 'both_tracks' to transcribe both the Caller and the Agent
        start.stream(url=stream_url, track="both_tracks")
        response.append(start)

        if self.target_number:
            # Using callerId to ensure the bridge stays open for 2-way audio
            dial = Dial(callerId=self.twilio_number, timeout=30)
            dial.number(self.target_number)
            response.append(dial)
        
        return str(response)