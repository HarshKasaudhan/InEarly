import logging
import re
from typing import AsyncGenerator, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("inearly.elevenlabs")

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"


def clean_text_for_tts(text: str) -> str:
    """
    Sanitizes markdown, URLs, emojis, and special symbols before sending to ElevenLabs.
    Ensures crisp pronunciation and prevents reading out formatting characters.
    """
    if not text:
        return ""
    
    cleaned = text
    # Remove code blocks and inline code
    cleaned = re.sub(r"```[\s\S]*?```", " ", cleaned)
    cleaned = re.sub(r"`.*?`", " ", cleaned)
    # Remove URLs
    cleaned = re.sub(r"https?://\S+", " ", cleaned)
    cleaned = re.sub(r"www\.\S+", " ", cleaned)
    # Remove Markdown links [Anchor](url) -> Anchor
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    # Remove markdown headers and blockquotes
    cleaned = re.sub(r"^\s{0,3}[>#]+\s*", " ", cleaned, flags=re.MULTILINE)
    # Remove bullet markers
    cleaned = re.sub(r"^\s*[-*•]\s+", " ", cleaned, flags=re.MULTILINE)
    # Expand helpline numbers for crystal-clear spoken digits
    cleaned = re.sub(r"\b14416\b", "1, 4, 4, 1, 6", cleaned)
    cleaned = re.sub(r"\b112\b", "1, 1, 2", cleaned)
    # Remove markdown symbols (*, _, ~, #)
    cleaned = re.sub(r"[*_~`#|\\/\[\]{}()]", " ", cleaned)
    # Remove all emojis and pictographs
    cleaned = re.sub(
        r"[\U00010000-\U0010ffff\u2600-\u26ff\u2700-\u27bf\ufe0f]",
        "",
        cleaned,
    )
    # Normalize excessive punctuation
    cleaned = re.sub(r"\.{2,}", ", ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


class ElevenLabsService:
    # Rachel official pre-made female voice ID
    DEFAULT_RACHEL_VOICE = "21m00Tcm4TlvDq8ikWAM"
    # Pre-made verified female voice 100% active on all ElevenLabs free keys
    FREE_TIER_FEMALE_VOICE = "EXAVITQu4vr4xnSDxMaL"  # Bella / Sarah (Gentle, empathetic female)

    def __init__(self):
        self.default_voice_id = settings.ELEVENLABS_VOICE_ID or self.DEFAULT_RACHEL_VOICE
        self.model_id = settings.ELEVENLABS_MODEL_ID or "eleven_multilingual_v2"

    @property
    def api_key(self) -> str:
        return (settings.ELEVENLABS_API_KEY or "").strip()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("your-"))

    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesizes speech using ElevenLabs API and returns raw audio/mpeg bytes.
        Explicitly reads configured ELEVENLABS_VOICE_ID (Rachel 21m00Tcm4TlvDq8ikWAM)
        and sends it in the ElevenLabs API request.
        If a community/library restriction (HTTP 402) occurs, automatically retries
        with a verified warm female voice (Bella/Sarah EXAVITQu4vr4xnSDxMaL) so the
        voice remains consistently female and never crashes.
        """
        if not self.is_configured:
            logger.info("ElevenLabs API key is not configured, signaling client fallback.")
            return None

        clean_text = clean_text_for_tts(text)
        if not clean_text:
            return None

        target_voice = voice_id or self.default_voice_id or self.DEFAULT_RACHEL_VOICE

        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload = {
            "text": clean_text,
            "model_id": self.model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{target_voice}"
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    logger.info(
                        f"ElevenLabs TTS succeeded ({len(response.content)} bytes) using female voice={target_voice}"
                    )
                    return response.content

                # If voice is a library voice restricted on free tier (HTTP 402) or not found (404),
                # seamlessly retry with verified free-tier female voice (Bella) to maintain female gender
                if response.status_code in (402, 404) and target_voice != self.FREE_TIER_FEMALE_VOICE:
                    logger.warning(
                        f"ElevenLabs voice {target_voice} returned HTTP {response.status_code}. "
                        f"Seamlessly retrying with verified free-tier female voice ({self.FREE_TIER_FEMALE_VOICE})..."
                    )
                    retry_url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{self.FREE_TIER_FEMALE_VOICE}"
                    retry_res = await client.post(retry_url, json=payload, headers=headers)
                    if retry_res.status_code == 200:
                        logger.info(
                            f"ElevenLabs verified female voice succeeded ({len(retry_res.content)} bytes)"
                        )
                        return retry_res.content

                # If authentication failed (401), rate limited (429), or 502 Bad Gateway from upstream:
                logger.warning(
                    f"ElevenLabs TTS unavailable: HTTP {response.status_code}. "
                    f"Instructing frontend to smoothly fallback to Indian browser TTS."
                )
                return None
        except httpx.TimeoutException:
            logger.warning("ElevenLabs upstream timed out; falling back to Indian browser TTS.")
            return None
        except Exception as e:
            logger.warning(f"ElevenLabs connection issue: {e}; falling back to Indian browser TTS.")
            return None

    async def stream_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> AsyncGenerator[bytes, None]:
        """
        Streams audio chunks from ElevenLabs /stream endpoint with female voice ID.
        """
        if not self.is_configured:
            logger.warning("ElevenLabs API key is not configured for streaming.")
            return

        clean_text = clean_text_for_tts(text)
        if not clean_text:
            return

        target_voice = voice_id or self.default_voice_id or self.DEFAULT_RACHEL_VOICE
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{target_voice}/stream"

        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload = {
            "text": clean_text,
            "model_id": self.model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    if response.status_code == 200:
                        async for chunk in response.aiter_bytes():
                            if chunk:
                                yield chunk
                    else:
                        logger.warning(f"ElevenLabs stream failed with HTTP {response.status_code}")
        except Exception as e:
            logger.error(f"ElevenLabs streaming error: {e}")


elevenlabs_service = ElevenLabsService()
