import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.elevenlabs_service import elevenlabs_service

logger = logging.getLogger("inearly.tts_endpoint")
router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize with natural ElevenLabs voice")
    voice_id: Optional[str] = Field(default=None, description="Optional custom ElevenLabs Voice ID override")


class TTSStatusResponse(BaseModel):
    configured: bool
    voice_id: str
    model_id: str
    fallback_engine: str = "Web Speech API (hi-IN / en-IN Indian voice profiles)"


@router.get(
    "/status",
    response_model=TTSStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="ElevenLabs TTS Configuration Status",
)
async def get_tts_status():
    return TTSStatusResponse(
        configured=elevenlabs_service.is_configured,
        voice_id=elevenlabs_service.default_voice_id,
        model_id=elevenlabs_service.model_id,
    )


@router.post(
    "/synthesize",
    summary="Synthesize Speech with ElevenLabs",
    description="Converts empathetic AI response text to high-fidelity natural audio using the designated ElevenLabs voice profile. Gracefully falls back to Indian browser TTS on 401/402/502 upstream errors.",
    responses={
        200: {
            "description": "Raw audio/mpeg MP3 stream for direct Web Audio / TalkingHead playback, or JSON fallback instruction.",
        },
    },
)
async def synthesize_speech(payload: TTSRequest):
    # If ElevenLabs API is not configured, inform client smoothly without raising 503 HTTP errors
    if not elevenlabs_service.is_configured:
        logger.info("ElevenLabs API key not configured; instructing client fallback to Indian browser TTS.")
        return Response(
            content=b'{"fallback": true, "reason": "unconfigured", "engine": "browser_tts"}',
            status_code=status.HTTP_200_OK,
            headers={
                "X-TTS-Status": "fallback",
                "X-TTS-Fallback-Reason": "unconfigured",
                "Content-Type": "application/json",
            },
        )

    try:
        audio_bytes = await elevenlabs_service.synthesize_speech(
            text=payload.text,
            voice_id=payload.voice_id,
        )
    except Exception as exc:
        logger.warning(f"Unexpected ElevenLabs error: {exc}. Smoothly instructing client fallback.")
        audio_bytes = None

    # If ElevenLabs returned 502, 401, 402, 429, or failed upstream, respond with clean fallback JSON
    if not audio_bytes:
        logger.info("ElevenLabs synthesis unavailable. Emitting fallback payload for client Web Speech synthesis.")
        return Response(
            content=b'{"fallback": true, "reason": "upstream_unavailable", "engine": "browser_tts"}',
            status_code=status.HTTP_200_OK,
            headers={
                "X-TTS-Status": "fallback",
                "X-TTS-Fallback-Reason": "upstream_unavailable",
                "Content-Type": "application/json",
            },
        )

    voice_id_used = payload.voice_id or elevenlabs_service.default_voice_id

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "Content-Length": str(len(audio_bytes)),
            "X-Voice-Id": voice_id_used,
            "X-TTS-Status": "ok",
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.post(
    "/stream",
    summary="Stream Speech Chunks from ElevenLabs",
    description="Streams audio chunks with low time-to-first-byte (TTFB).",
)
async def stream_speech(payload: TTSRequest):
    if not elevenlabs_service.is_configured:
        return Response(
            content=b'{"fallback": true, "reason": "unconfigured", "engine": "browser_tts"}',
            status_code=status.HTTP_200_OK,
            headers={
                "X-TTS-Status": "fallback",
                "Content-Type": "application/json",
            },
        )

    voice_id_used = payload.voice_id or elevenlabs_service.default_voice_id

    return StreamingResponse(
        elevenlabs_service.stream_speech(text=payload.text, voice_id=payload.voice_id),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=speech-stream.mp3",
            "X-Voice-Id": voice_id_used,
            "X-TTS-Status": "ok",
        },
    )

