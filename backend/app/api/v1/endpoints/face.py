import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.face_analysis_service import face_analysis_service, EMOTION_LABELS

logger = logging.getLogger("inearly.face_endpoint")
router = APIRouter()


class FaceAnalysisRequest(BaseModel):
    image_base64: str = Field(
        ...,
        description="Single camera frame captured on-demand, encoded as base64 data URI or raw base64 string",
    )
    user_consent: bool = Field(
        default=True,
        description="Explicit user consent confirmation. Camera processing requires active permission.",
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session or conversation ID to attach affective state for empathetic adaptation.",
    )


class FaceStatusResponse(BaseModel):
    configured: bool
    models: Dict[str, str]
    supported_emotions: list[str]
    anti_spoofing_engine: str
    liveness_categories: list[str]
    disclaimer: str


@router.get(
    "/status",
    response_model=FaceStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Face Perception & Anti-Spoofing Service Status",
)
async def get_face_service_status():
    """
    Returns runtime configuration, model specifications, and clinical disclaimers.
    """
    return FaceStatusResponse(
        configured=True,
        models={
            "anti_spoofing": "garciafido/minifasnet-v2-anti-spoofing-onnx",
            "facial_emotion_recognition": "SEARO1/FER_model (Swin Transformer)",
        },
        supported_emotions=EMOTION_LABELS,
        anti_spoofing_engine="MiniFASNet v2 (ONNX Runtime, 2.7x scale crop)",
        liveness_categories=["live", "print_attack", "screen_replay"],
        disclaimer="Emotion detection and liveness evaluation are non-biometric wellness aids. They do not constitute clinical psychiatric diagnosis or identity verification.",
    )


@router.post(
    "",
    summary="Analyze Face for Liveness & Affective Emotion",
    description="Processes a single on-demand camera frame. Runs MiniFASNet v2 Anti-Spoofing first; if live, predicts emotion via Swin Transformer FER model and returns empathy guidance for companion tone adaptation.",
)
@router.post(
    "/analyze",
    summary="Analyze Face for Liveness & Affective Emotion (Alias)",
)
async def analyze_face(payload: FaceAnalysisRequest):
    """
    Dual-Model Analysis Pipeline:
    1. Requires explicit user consent.
    2. Runs MiniFASNet v2 Anti-Spoofing. If spoofing detected, halts emotion processing.
    3. Runs SEARO1/FER_model Swin Transformer for emotion classification.
    4. Computes mental wellness guidance for empathetic avatar/chat response.
    """
    if not payload.user_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit user consent is mandatory prior to camera analysis.",
        )

    try:
        result = await face_analysis_service.analyze_face_frame(
            image_base64=payload.image_base64,
            user_consent=payload.user_consent,
            session_id=payload.session_id,
        )
        return result
    except Exception as e:
        logger.error(f"Error analyzing face frame: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face analysis failed: {str(e)}",
        )
