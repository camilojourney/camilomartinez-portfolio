"""
OpenAI Client Service for GPT-4 chat completions and text embeddings.
Replaces TypeScript OpenAI integration with async Python implementation.
"""

import asyncio
import logging
from typing import Any

import openai
from openai import AsyncOpenAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config.settings import settings

logger = logging.getLogger(__name__)


class OpenAIError(Exception):
    """Custom exception for OpenAI service errors."""
    pass


class OpenAIService:
    """
    Async OpenAI client service for chat completions and embeddings.

    Features:
    - GPT-4 chat completions with proper prompt engineering
    - text-embedding-3-small for vector embeddings
    - Automatic retry with exponential backoff
    - Comprehensive error handling and logging
    - Token usage tracking and cost monitoring
    """

    def __init__(self):
        """Initialize OpenAI client with configuration."""
        self.client: AsyncOpenAI | None = None

        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                timeout=30.0,  # 30 second timeout
                max_retries=3,  # Built-in retry mechanism
            )

        # Model configurations
        self.chat_model = "gpt-4"
        self.embedding_model = "text-embedding-3-small"
        self.max_tokens_chat = 1000
        self.max_tokens_embedding = 8191  # text-embedding-3-small limit

        if self.client:
            logger.info(
                "OpenAI client initialized with models: %s, %s",
                self.chat_model,
                self.embedding_model,
            )
        else:
            logger.warning("OPENAI_API_KEY not configured; OpenAIService is disabled.")

    @retry(
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def create_chat_completion(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        user_id: str | None = None,
        model: str | None = None,
        **kwargs
    ) -> dict[str, Any]:
        """
        Create a chat completion using GPT-4.

        Args:
            messages: List of message objects with 'role' and 'content'
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens in response
            user_id: User identifier for tracking
            **kwargs: Additional OpenAI parameters

        Returns:
            Dict containing response content, usage stats, and metadata

        Raises:
            OpenAIError: For API errors or invalid responses
        """
        try:
            if self.client is None:
                raise OpenAIError("OPENAI_API_KEY not configured")

            # Validate messages format
            if not messages or not isinstance(messages, list):
                raise OpenAIError("Messages must be a non-empty list")

            for msg in messages:
                if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                    raise OpenAIError("Each message must have 'role' and 'content' keys")

            # Set default max_tokens
            if max_tokens is None:
                max_tokens = self.max_tokens_chat

            logger.info(f"Creating chat completion for user {user_id or 'anonymous'} with {len(messages)} messages")

            response = await self.client.chat.completions.create(
                model=model or self.chat_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                user=user_id,
                **kwargs
            )

            # Extract response data
            choice = response.choices[0]
            usage = response.usage

            result = {
                "content": choice.message.content,
                "role": choice.message.role,
                "finish_reason": choice.finish_reason,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                },
                "model": response.model,
                "created": response.created,
            }

            logger.info(f"Chat completion successful: {usage.total_tokens} tokens used")
            return result

        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            raise OpenAIError(f"Authentication failed: {e}") from e

        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise OpenAIError(f"Rate limit exceeded: {e}") from e

        except openai.APITimeoutError as e:
            logger.error(f"OpenAI API timeout: {e}")
            raise OpenAIError(f"API timeout: {e}") from e

        except openai.BadRequestError as e:
            logger.error(f"OpenAI bad request: {e}")
            raise OpenAIError(f"Invalid request: {e}") from e

        except Exception as e:
            logger.error(f"Unexpected error in chat completion: {e}")
            raise OpenAIError(f"Chat completion failed: {e}") from e

    @retry(
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def create_embedding(
        self,
        text: str | list[str],
        user_id: str | None = None,
        dimensions: int | None = None,
    ) -> dict[str, Any]:
        """
        Create text embeddings using text-embedding-3-small.

        Args:
            text: Single text string or list of texts to embed
            user_id: User identifier for tracking
            dimensions: Output dimensions (default: model default)

        Returns:
            Dict containing embeddings, usage stats, and metadata

        Raises:
            OpenAIError: For API errors or invalid inputs
        """
        try:
            if self.client is None:
                raise OpenAIError("OPENAI_API_KEY not configured")

            # Validate input
            if not text:
                raise OpenAIError("Text input cannot be empty")

            # Convert single string to list
            input_texts = [text] if isinstance(text, str) else text

            # Validate text length
            for txt in input_texts:
                if len(txt) > self.max_tokens_embedding:
                    logger.warning(f"Text length {len(txt)} exceeds max tokens {self.max_tokens_embedding}")

            logger.info(f"Creating embeddings for {len(input_texts)} text(s) for user {user_id or 'anonymous'}")

            # Prepare embedding parameters
            embed_params = {
                "model": self.embedding_model,
                "input": input_texts,
            }

            # Only add user parameter if user_id is provided
            if user_id:
                embed_params["user"] = user_id

            if dimensions:
                embed_params["dimensions"] = dimensions

            response = await self.client.embeddings.create(**embed_params)

            # Extract embeddings and metadata
            embeddings = [data.embedding for data in response.data]
            usage = response.usage

            result = {
                "embeddings": embeddings[0] if isinstance(text, str) else embeddings,
                "model": response.model,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "total_tokens": usage.total_tokens,
                },
                "dimensions": len(embeddings[0]) if embeddings else 0,
                "object": response.object,
            }

            logger.info(f"Embeddings created successfully: {usage.total_tokens} tokens used")
            return result

        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            raise OpenAIError(f"Authentication failed: {e}") from e

        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise OpenAIError(f"Rate limit exceeded: {e}") from e

        except openai.APITimeoutError as e:
            logger.error(f"OpenAI API timeout: {e}")
            raise OpenAIError(f"API timeout: {e}") from e

        except openai.BadRequestError as e:
            logger.error(f"OpenAI bad request: {e}")
            raise OpenAIError(f"Invalid request: {e}") from e

        except Exception as e:
            logger.error(f"Unexpected error in embedding creation: {e}")
            raise OpenAIError(f"Embedding creation failed: {e}") from e

    async def create_embeddings_batch(
        self,
        texts: list[str],
        batch_size: int = 100,
        user_id: str | None = None,
    ) -> list[list[float]]:
        """
        Create embeddings for a large batch of texts with automatic batching.

        Args:
            texts: List of texts to embed
            batch_size: Maximum texts per API call
            user_id: User identifier for tracking

        Returns:
            List of embedding vectors

        Raises:
            OpenAIError: For API errors
        """
        if not texts:
            return []

        logger.info(f"Creating embeddings for {len(texts)} texts in batches of {batch_size}")

        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.debug(f"Processing batch {i//batch_size + 1}: {len(batch)} texts")

            try:
                result = await self.create_embedding(batch, user_id=user_id)
                embeddings = result["embeddings"]
                all_embeddings.extend(embeddings)

                # Small delay between batches to avoid rate limits
                if i + batch_size < len(texts):
                    await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Failed to process batch {i//batch_size + 1}: {e}")
                raise OpenAIError(f"Batch embedding failed at batch {i//batch_size + 1}: {e}") from e

        logger.info(f"Successfully created {len(all_embeddings)} embeddings")
        return all_embeddings

    async def estimate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int = 0,
        embedding_tokens: int = 0,
    ) -> dict[str, float]:
        """
        Estimate API costs based on token usage.

        Args:
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
            embedding_tokens: Number of embedding tokens

        Returns:
            Dict with cost breakdown in USD
        """
        # GPT-4 pricing (as of 2024)
        gpt4_prompt_cost = 0.03 / 1000  # $0.03 per 1K tokens
        gpt4_completion_cost = 0.06 / 1000  # $0.06 per 1K tokens

        # text-embedding-3-small pricing
        embedding_cost = 0.00002 / 1000  # $0.00002 per 1K tokens

        chat_cost = (prompt_tokens * gpt4_prompt_cost) + (completion_tokens * gpt4_completion_cost)
        embed_cost = embedding_tokens * embedding_cost
        total_cost = chat_cost + embed_cost

        return {
            "chat_cost": round(chat_cost, 6),
            "embedding_cost": round(embed_cost, 6),
            "total_cost": round(total_cost, 6),
            "currency": "USD"
        }

    async def health_check(self) -> dict[str, Any]:
        """
        Verify OpenAI API connectivity and model availability.

        Returns:
            Dict with health status and model information
        """
        try:
            if self.client is None:
                return {
                    "status": "unhealthy",
                    "error": "OPENAI_API_KEY not configured",
                    "chat_model": self.chat_model,
                    "embedding_model": self.embedding_model,
                    "api_accessible": False,
                }

            # Test with a minimal embedding request
            test_result = await self.create_embedding("test", user_id="health_check")

            return {
                "status": "healthy",
                "chat_model": self.chat_model,
                "embedding_model": self.embedding_model,
                "api_accessible": True,
                "test_embedding_dimensions": test_result["dimensions"],
                "timestamp": test_result.get("created", "unknown")
            }

        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "chat_model": self.chat_model,
                "embedding_model": self.embedding_model,
                "api_accessible": False,
            }

    async def close(self):
        """Close the OpenAI client connection."""
        if self.client and hasattr(self.client, "close"):
            await self.client.close()
        logger.info("OpenAI client closed")


# Global service instance
openai_service = OpenAIService()
