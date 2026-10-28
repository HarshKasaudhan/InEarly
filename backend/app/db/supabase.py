import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("inearly.db")

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Returns an initialized Supabase Client if valid credentials are provided.
    Returns None if credentials are unset, placeholder, or invalid, enabling graceful local development fallback.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = (settings.SUPABASE_URL or "").strip()
    key = (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or "").strip()

    # Detect unconfigured or placeholder credentials
    if not url or "your-project-id" in url or "example.com" in url:
        return None

    if not key or "your-" in key:
        return None

    try:
        _supabase_client = create_client(url, key)
        logger.info("Supabase client successfully initialized.")
        return _supabase_client
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to resilient dev mode.")
        return None

