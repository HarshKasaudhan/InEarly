# Inearly Backend (FastAPI)

FastAPI backend service powering the Inearly platform.

## Architecture & Features

- **Framework:** FastAPI with Python 3.13+
- **Configuration:** Pydantic v2 Settings (`pydantic-settings`)
- **Security Middleware:** Strict-Transport-Security, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, CORS middleware
- **Zero-PII Privacy Posture:** DPDP Act (2023) alignment with envelope encryption capability (`cryptography` AES-GCM)
- **Endpoints:**
  - `GET /health`: Fast liveness probe for orchestrators & load balancers
  - `GET /api/v1/health`: Detailed readiness probe with telemetry, privacy compliance status, and database connectivity flags
  - `POST /v1/consents` (and `/api/v1/consents`): Registers explicit user consent, purpose, version, coarse age-band, pseudonym, and code-switching language preference in Supabase `consents` table under DPDP Act (2023) requirements.
  - `POST /v1/chat` (and `/api/v1/chat`): Core conversational endpoint orchestrating Google Gemini API with A1 Empathy Agent, A2 Concern Classifier, mode switching ('Just Listen' vs 'Help Me Plan'), and 24/7 crisis safety guardrails.
  - `GET /v1/plans/recommendations`: Surfaces 1-2 small evidence-informed coping steps from reviewed wellness library.
  - `GET /v1/memories`: Retrieves user-owned check-in summaries, active retention countdowns, and opted-in wellness goals.
  - `DELETE /v1/memories/{id}`: Permanently purges a specific conversation check-in and associated transcripts.
  - `DELETE /v1/account-data`: Irreversible hard account data erasure under DPDP Act 2023 (Right to Erasure / Right to be Forgotten).
  - `POST /v1/tts/synthesize`: ElevenLabs female voice TTS service with automatic fallback to client-side browser synthesis.
  - `POST /v1/face/analyze` (and `/api/analyze-face`): Dual-model camera perception pipeline:
    - **Step 1 - MiniFASNet v2 Anti-Spoofing:** ONNX Runtime model (`garciafido/minifasnet-v2-anti-spoofing-onnx`) with 2.7x scale face crop, 80x80 BGR normalization. Detects print attacks and screen replay presentation attacks.
    - **Security Rule:** Liveness verification executes first. If spoofing is detected, sensitive clinical affect interpretation is immediately halted.
    - **Step 2 - Swin Transformer FER:** PyTorch Swin Transformer (`SEARO1/FER_model`) classifying 7 discrete emotions (`angry`, `disgust`, `fear`, `happy`, `neutral`, `sad`, `surprise`) and generating empathetic companion affect guidance.
    - **Non-Biometric Notice:** Completely separate from identity verification; no continuous video streaming or biometric templates stored.
  - `GET /v1/face/status`: Telemetry, model card specifications, and clinical disclaimers.

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── account.py   # DPDP account erasure router
│   │           ├── chat.py      # Core chat & agent interaction router
│   │           ├── consents.py  # Consent registration & pseudonymous onboarding
│   │           ├── health.py    # Readiness & telemetry router
│   │           ├── memory.py    # Memory controls & check-in management router
│   │           └── plans.py     # Wellness recommendations router
│   ├── core/
│   │   └── config.py            # Pydantic BaseSettings & env loader
│   ├── db/
│   │   └── supabase.py          # Supabase client helper with graceful fallback
│   ├── schemas/
│   │   ├── chat.py              # Pydantic models for chat, modes & tags
│   │   ├── consent.py           # Pydantic models & pseudonym generator
│   │   └── memory.py            # Pydantic models for memory, goals & erasure
│   ├── services/
│   │   ├── agents.py            # Gemini A1 Empathy & A2 Concern Classifier orchestrator
│   │   ├── safety_interceptor.py # Deterministic safety triage, Indian helplines & audit logger
│   │   └── wellness_plans.py    # Reviewed evidence-informed coping library
│   └── main.py                  # App entrypoint & security middleware
├── tests/
│   ├── test_chat.py             # Test suite for Gemini chat & modes
│   ├── test_consents.py         # Test suite for consent operations
│   ├── test_health.py           # Test suite for health endpoints
│   ├── test_memory_and_plans.py # Test suite for memory & wellness plans
│   └── test_safety_interceptor.py # Deterministic safety interceptor & audit log tests
├── requirements.txt             # Locked core dependencies
├── .env.example                 # Environment blueprint
└── README.md
```

## Running Locally

1. Create and activate virtual environment:
   ```bash
   python -m venv .venv
   # Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Setup environment variables:
   ```bash
   copy .env.example .env
   ```

4. Start development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Access interactive OpenAPI documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - Health check: `http://localhost:8000/health` or `http://localhost:8000/api/v1/health`
