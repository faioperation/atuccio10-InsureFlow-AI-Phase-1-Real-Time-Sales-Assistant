import time

class ChunkBuffer:
    def __init__(self, window_seconds=1):
        self.buffer = ""
        self.window_seconds = window_seconds
        self.last_update = time.time()

    def add_chunk(self, text):
        """Append new transcript chunk to the buffer."""
        self.buffer += " " + text
        self.last_update = time.time()

    def is_ready(self):
        """Check if buffer has data and the silence duration is met."""
        return len(self.buffer.strip()) > 0 and (time.time() - self.last_update) >= self.window_seconds

    def get_and_clear(self):
        """Retrieve the content and reset the buffer."""
        content = self.buffer.strip()
        self.buffer = ""
        return content