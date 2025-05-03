"""
Configuration module for the application.

This module centralizes all environment variables and settings for the application.
Import settings from this module to ensure consistent access to environment variables.

Example:
    from app.config import settings

    api_key = settings.OPENAI_API_KEY
    api_url = settings.OPENAI_EMBEDDINGS_URL
"""

from app.config.settings import settings

# Export the settings object
__all__ = ["settings"]
