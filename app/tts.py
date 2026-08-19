import os
import asyncio
import logging
import edge_tts

logger = logging.getLogger("omnidigest.tts")

DEFAULT_VOICE = os.getenv("TTS_VOICE", "en-US-ChristopherNeural")  # Deep, broadcast voice
PODCAST_DIR = os.getenv("PODCAST_DIR", "/app/data/podcasts")

async def generate_audio_podcast(text: str, filename: str, voice: str = DEFAULT_VOICE, rate: str = "+0%") -> str:
    """
    Synthesizes speech into an MP3 file using Edge Neural TTS.
    Returns the absolute path to the generated audio file.
    """
    os.makedirs(PODCAST_DIR, exist_ok=True)
    out_path = os.path.join(PODCAST_DIR, filename)

    try:
        communicate = edge_tts.Communicate(text, voice=voice, rate=rate)
        await communicate.save(out_path)
        logger.info(f"Synthesized audio digest successfully saved to {out_path}")
        return out_path
    except Exception as e:
        logger.error(f"Error synthesizing audio with edge-tts: {e}")
        # If edge-tts network fails, create a silent/empty marker or rethrow
        raise e
