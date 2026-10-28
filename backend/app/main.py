from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.v1.endpoints import health, consents, chat, plans, memory, account, psychiatrists, tts, face

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="India-First AI Mental Wellness Platform API - Built with zero-PII data minimization & DPDP Act compliance.",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Root-level health check for load-balancers & container orchestrators
@app.get("/health", tags=["Health"], summary="Basic liveness check")
async def basic_liveness():
    return {"status": "ok"}

# Versioned API Routes
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])

# Consents Endpoints
app.include_router(consents.router, prefix="/v1/consents", tags=["Consents"])
app.include_router(consents.router, prefix=f"{settings.API_V1_STR}/consents", tags=["Consents"])

# Core Chat Interaction Endpoints (Gemini A1 Empathy & A2 Concern Classifier)
app.include_router(chat.router, prefix="/v1/chat", tags=["Chat"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chat"])

# Wellness Recommendations & Plans
app.include_router(plans.router, prefix="/v1/plans", tags=["Wellness Plans"])
app.include_router(plans.router, prefix=f"{settings.API_V1_STR}/plans", tags=["Wellness Plans"])

# Memory & Check-in Controls
app.include_router(memory.router, prefix="/v1/memories", tags=["Memory Controls"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memories", tags=["Memory Controls"])

# Account Erasure (DPDP Act 2023 Right to be Forgotten)
app.include_router(account.router, prefix="/v1/account-data", tags=["Account Erasure"])
app.include_router(account.router, prefix=f"{settings.API_V1_STR}/account-data", tags=["Account Erasure"])

# Nearby & Online Psychiatrists and Clinics
app.include_router(psychiatrists.router, prefix="/v1/psychiatrists", tags=["Psychiatrists"])
app.include_router(psychiatrists.router, prefix=f"{settings.API_V1_STR}/psychiatrists", tags=["Psychiatrists"])

# ElevenLabs Natural Voice Text-to-Speech
app.include_router(tts.router, prefix="/v1/tts", tags=["TTS"])
app.include_router(tts.router, prefix=f"{settings.API_V1_STR}/tts", tags=["TTS"])

# Dual-Model Face Perception & MiniFASNet v2 Anti-Spoofing
app.include_router(face.router, prefix="/v1/face", tags=["Face Perception"])
app.include_router(face.router, prefix=f"{settings.API_V1_STR}/face", tags=["Face Perception"])
app.include_router(face.router, prefix="/api/analyze-face", tags=["Face Perception"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
