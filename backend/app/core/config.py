from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Inearly Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = Field(default=True)

    # Allowed CORS Origins for Frontend
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://inearly.onrender.com",
            "https://inearly-frontend.onrender.com",
        ],
        description="Allowed CORS origins (comma-separated or JSON array in .env)",
    )
    CORS_ORIGIN_REGEX: str = Field(
        default=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.onrender\.com$|^https://.*\.vercel\.app$",
        description="Regex pattern for dynamic preview & production deployment origins (Render, Vercel)",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://inearly.onrender.com",
            "https://inearly-frontend.onrender.com",
        ]
        if isinstance(v, str):
            clean = v.strip()
            if clean.startswith("[") and clean.endswith("]"):
                import json
                try:
                    parsed = json.loads(clean)
                    if isinstance(parsed, list):
                        # Merge defaults with parsed items preserving order
                        combined = list(dict.fromkeys([str(i).strip() for i in parsed if str(i).strip()] + default_origins))
                        return combined
                except Exception:
                    pass
            parsed_list = [i.strip() for i in clean.split(",") if i.strip()]
            return list(dict.fromkeys(parsed_list + default_origins))
        elif isinstance(v, list):
            return list(dict.fromkeys([str(i).strip() for i in v if str(i).strip()] + default_origins))
        return default_origins

    # Supabase Configuration
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase client anon key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase service role secret key")

    # Cryptography / Data Minimization
    # 256-bit AES encryption key for confidential message payload envelope encryption
    APP_ENCRYPTION_KEY: str = Field(
        default="",
        description="32-byte Base64 key for envelope encryption of messages under DPDP Act requirements",
    )

    # Gemini AI Configuration
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", description="Gemini model identifier")

    # Groq AI Configuration (Multi-model Fallback)
    GROQ_API_KEY: str = Field(default="", description="Groq API Key for fast Llama 3 fallback")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", description="Groq Llama model identifier")

    # Privacy & Retention Configuration
    DEFAULT_RETENTION_DAYS: int = Field(default=30, description="Default session retention period in days")

    # ElevenLabs Audio TTS Configuration
    ELEVENLABS_API_KEY: str = Field(default="", description="ElevenLabs API Key for voice synthesis")
    ELEVENLABS_VOICE_ID: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="ElevenLabs Voice ID (Rachel - Soft Warm Female Voice)")
    ELEVENLABS_MODEL_ID: str = Field(default="eleven_multilingual_v2", description="ElevenLabs Model ID")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
