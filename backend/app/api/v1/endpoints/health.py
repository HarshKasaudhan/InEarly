import time
from typing import Dict, Any
from fastapi import APIRouter, status
from app.core.config import settings

router = APIRouter()
START_TIME = time.time()


@router.get("", status_code=status.HTTP_200_OK, summary="API Health Check")
async def health_check() -> Dict[str, Any]:
    """
    Detailed system health check endpoint for monitoring, kubernetes readiness probes,
    and platform status.
    """
    uptime_seconds = round(time.time() - START_TIME, 2)
    
    # Assess Supabase & Encryption configuration readiness
    supabase_configured = bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)
    encryption_configured = bool(settings.APP_ENCRYPTION_KEY)

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime_seconds,
        "privacy_compliance": {
            "dpdp_compliant": True,
            "zero_pii_policy": "enforced",
            "default_retention_days": settings.DEFAULT_RETENTION_DAYS,
            "envelope_encryption": "configured" if encryption_configured else "development_mode",
        },
        "database": {
            "provider": "Supabase PostgreSQL",
            "configured": supabase_configured,
        },
    }
