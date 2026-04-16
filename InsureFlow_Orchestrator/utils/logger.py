import sys
from datetime import datetime

def log_info(message):
    """Logs general information with a timestamp."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [INFO] {message}")

def log_transcript(speaker, text):
    """
    Logs raw transcripts. 
    Removed the extra newline (\n) to keep the terminal readable 
    during high-frequency raw streaming.
    """
    timestamp = datetime.now().strftime("%H:%M:%S")
    # Using a more compact format for raw continuous data
    print(f"[{timestamp}] [{speaker}] {text}")

def log_error(message):
    """Logs error messages specifically."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [ERROR] {message}", file=sys.stderr)