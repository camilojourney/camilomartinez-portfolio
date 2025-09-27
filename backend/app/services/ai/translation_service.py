"""Utility service for translating text using the DeepL API."""

import logging
from typing import Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class TranslationServiceError(Exception):
    """Raised when the translation service encounters an error."""


class TranslationService:
    """Lightweight async client for the DeepL translation API."""

    def __init__(self) -> None:
        self._api_key: Optional[str] = getattr(settings, "DEEPL_API_KEY", None)
        self._endpoint = "https://api-free.deepl.com/v2/translate"
        self._timeout = httpx.Timeout(15.0, connect=5.0)

    async def translate(self, text: str, target_lang: str = "ES") -> str:
        """Translate text to the target language. Returns original if translation unavailable."""

        if not text:
            return text

        if not self._api_key:
            logger.debug("DEEPL_API_KEY not configured; returning original text")
            return text

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    self._endpoint,
                    data={"text": text, "target_lang": target_lang},
                    headers={
                        "Authorization": f"DeepL-Auth-Key {self._api_key}",
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                )

            response.raise_for_status()
            payload = response.json()
            translations = payload.get("translations", [])
            if not translations:
                raise TranslationServiceError("No translations returned from DeepL")

            translated_text = translations[0].get("text")
            if not translated_text:
                raise TranslationServiceError("Translation payload missing text field")

            return translated_text

        except httpx.HTTPStatusError as exc:
            logger.warning("DeepL API request failed: %s", exc.response.text)
            return text
        except (httpx.RequestError, TranslationServiceError) as exc:
            logger.warning("DeepL translation error: %s", exc)
            return text


translation_service = TranslationService()
