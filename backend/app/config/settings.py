"""
Configuration settings for the application.

This module handles loading and validating environment variables from the root .env file.
All configuration should be accessed via this module.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Configure logging early
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Environment Loading ---
# Determine the root directory (assuming this file is in backend/app/config)
_root_dir = Path(__file__).resolve().parent.parent.parent.parent
_env_path = _root_dir / ".env"

if _env_path.exists():
    logger.info(f"Loading environment variables from: {_env_path}")
    load_dotenv(
        dotenv_path=_env_path, override=True
    )  # Override system vars if .env exists
else:
    logger.warning(
        f".env file not found at {_env_path}. Relying solely on system environment variables."
    )
    # Attempt to load from system environment anyway
    load_dotenv(override=False)


# --- Settings Class ---
class Settings:
    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Supabase configuration
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET")

    # OpenAI API configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    OPENAI_EMBEDDING_ENDPOINT: str = os.getenv(
        "OPENAI_EMBEDDING_ENDPOINT", "/embeddings"
    )
    OPENAI_COMPLETION_ENDPOINT: str = os.getenv(
        "OPENAI_COMPLETION_ENDPOINT", "/chat/completions"
    )
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4-turbo")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "8192"))

    # Embedding configuration
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "1536"))
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "openai")

    # Vector Database (Pinecone) configuration
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_API_BASE: str = os.getenv("PINECONE_API_BASE", "https://api.pinecone.io")
    PINECONE_ENVIRONMENT: Optional[str] = os.getenv("PINECONE_ENVIRONMENT")
    PINECONE_INDEX: str = os.getenv(
        "PINECONE_INDEX", "proj"
    )  # Default to 'proj' as specified
    PINECONE_NAMESPACE: str = os.getenv(
        "PINECONE_NAMESPACE", "default"
    )  # Default namespace is ok

    # Storage configuration
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "supabase")
    STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "documents")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB

    # Derived URLs
    @property
    def OPENAI_EMBEDDINGS_URL(self) -> str:
        return f"{self.OPENAI_API_BASE.rstrip('/')}/{self.OPENAI_EMBEDDING_ENDPOINT.lstrip('/')}"

    @property
    def OPENAI_COMPLETIONS_URL(self) -> str:
        return f"{self.OPENAI_API_BASE.rstrip('/')}/{self.OPENAI_COMPLETION_ENDPOINT.lstrip('/')}"

    def __init__(self):
        # Validate required settings upon instantiation
        missing = self._validate()
        if missing:
            error_message = "Critical environment variables are missing: " + ", ".join(
                missing
            )
            logger.critical(error_message)
            # Optionally raise an exception to prevent the app from starting
            raise EnvironmentError(error_message)
        else:
            logger.info("All critical settings verified.")

    def _validate(self) -> List[str]:
        """Internal validation method."""
        required = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "OPENAI_API_KEY",
            "PINECONE_API_KEY",
            "PINECONE_ENVIRONMENT",
        ]
        missing = []
        for key in required:
            if not getattr(self, key):
                missing.append(key)
        return missing

    def get_settings_info(self) -> Dict[str, Any]:
        """
        Get a dictionary of all settings for debugging, with sensitive info redacted.
        """
        # Use vars() to get all attributes, then redact sensitive ones
        settings_dict = vars(self).copy()
        redacted_keys = [
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_JWT_SECRET",
            "OPENAI_API_KEY",
            "PINECONE_API_KEY",
        ]
        for key in redacted_keys:
            if key in settings_dict and settings_dict[key]:
                settings_dict[key] = "***REDACTED***"
        return settings_dict


# --- Instantiate Settings ---
# Single instance to be imported elsewhere
settings = Settings()

# Optional: Expose a function for FastAPI dependency injection if needed
# def get_settings() -> Settings:
#     return settings
