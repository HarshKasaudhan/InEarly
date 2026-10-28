from typing import List, Optional
from fastapi import APIRouter, Query, status
from app.schemas.memory import WellnessRecommendation
from app.services.wellness_plans import get_tailored_recommendations

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=List[WellnessRecommendation],
    status_code=status.HTTP_200_OK,
    summary="Get Evidence-Informed Wellness Coping Steps",
    description="Surfaces 1-2 small, practical, evidence-informed coping steps grounded in a reviewed resource library.",
)
async def get_recommendations(
    category: Optional[str] = Query(None, description="Theme slug e.g. academic_stress, sleep_concern"),
    limit: int = Query(2, ge=1, le=4, description="Number of recommendations to surface"),
) -> List[WellnessRecommendation]:
    return get_tailored_recommendations(category=category, limit=limit)
