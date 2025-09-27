"""
Tools router for content processing and productivity utilities.
Includes social media pipeline for content optimization and thread generation.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from app.services.ai.openai_client import openai_service, OpenAIError

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic Models

class SocialMediaRequest(BaseModel):
    """Social media pipeline request model."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text content to process")
    language: str = Field("en", pattern="^(en|es|both)$", description="Output language: en, es, or both")


class SocialMediaContent(BaseModel):
    """Processed social media content."""
    refined: str = Field(..., description="Optimized text content")
    reelScript: Optional[str] = Field(None, description="Instagram reel script")
    captions: List[str] = Field(default_factory=list, description="Caption variations")
    emotions: List[str] = Field(default_factory=list, description="Content emotions")
    category: str = Field("Other", description="Content category")


class SocialMediaMetadata(BaseModel):
    """Content processing metadata."""
    emotions: List[str] = Field(default_factory=list)
    category: str = Field("Other")
    processedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SocialMediaResponse(BaseModel):
    """Social media pipeline response."""
    success: bool = Field(True)
    data: Dict[str, Any] = Field(...)
    error: Optional[str] = Field(None)


# Social Media Processing Prompts

SYSTEM_PROMPT_SHORT = """You are an expert social media content optimizer. Your task is to refine short-form text content (under 280 characters) while preserving the author's authentic voice and core message.

### **TEXT REFINEMENT RULES**
1) **Preserve Original Voice:** Maintain the author's unique tone, style, and personality.
2) **Single Topic Focus:** If the input contains multiple topics, focus only on the first topic.
3) Preserve ALL facts, numbers, names, dates, and frameworks exactly as written.
4) **Spelling & Grammar:** Correct obvious errors and improve clarity.
5) Every sentence must be complete with proper punctuation.
6) **Creative Completion:** Smooth awkward phrasing and complete unfinished thoughts naturally.

### **STRUCTURE & FORMATTING**
7) Use **short paragraphs** (1-2 sentences max) for social media readability.
8) **Remove filler words** like "um," "like," "you know," "basically."
9) **Strengthen weak language:** Replace "I think," "maybe," "kind of" with confident assertions.
10) **Active voice preferred** over passive voice when possible.
11) **Preserve intentional fragments** and punchy phrases for emphasis.
12) **Isolate impactful phrases** into separate lines for emphasis.

### **CAPTION GENERATION**
Generate three short caption options (2-4 lines each) based on the core message:
1. **Option 1: The Bold Statement** - Direct and provocative
2. **Option 2: The Insightful Reflection** - Philosophical and inspirational  
3. **Option 3: The Engaging Question** - Designed to spark comments

### **OUTPUT (JSON ONLY):**
{
  "improved_script": "<refined content>",
  "reel_script": "<4-act Instagram reel script>",
  "captions": ["<Bold Statement>", "<Insightful Reflection>", "<Engaging Question>"],
  "emotions": ["Primary", "Secondary"],
  "category": "Label"
}

Allowed emotions: Awe, Joy, Surprise, Anger, Anxiety, Inspiration, Curiosity, Trust, Kama Muta, Amusement, Excitement.
Allowed categories: AI, Business, Controversy, Entrepreneurship, Fitness, Health, News, Philosophy, Science, Self Improvement, Tech, Wealth, Wellness, Wisdom, Other.
"""

SYSTEM_PROMPT_THREADS = """You are an expert Twitter/X thread creator. Transform longer content (280+ characters) into engaging Twitter threads while preserving the author's authentic voice.

### **TEXT REFINEMENT RULES**
1) **Preserve Original Voice:** Maintain the author's unique tone and personality.
2) **Single Topic Focus:** Focus on the first topic if multiple topics are present.
3) Preserve ALL facts, numbers, names, dates, and frameworks exactly.
4) **Spelling & Grammar:** Correct errors while preserving the author's style.
5) **Creative Completion:** Complete unfinished thoughts naturally.

### **THREAD STRUCTURE & RULES**

1. **The Hook (Tweet 1):** Powerful opening (≤ 260 characters) with compelling ending phrase:
   - Personal Story: "It all started with a simple realization:" or "Here's what I learned:"
   - Framework/How-To: "Here's the framework I use: 🧵" or "Let's break down how it works."
   - Contrarian: "But what if there's a better way? 👇" or "Here's what I learned by doing the opposite."
   - Analysis: "Let's break down how it works." or "This is the core idea:"

2. **The Body (Tweets 2 to N-1):** Break main points into focused tweets (≤ 270 characters each).
   - Start each with simple number (2/, 3/, 4/)
   - Each tweet must be complete and logical

3. **The Conclusion (Tweet N):** Satisfying conclusion (≤ 260 characters).
   - Don't number the final tweet

4. **Character Limits:** Strictly adhere to limits. No hashtags unless in original.

### **REEL SCRIPT STRUCTURE**
Generate 4-act Instagram reel script:
- **Act I: The Hook (2-7 words)** - Scroll-stopping opener
- **Act II: Value Proposition (7-22 words)** - Clear promise  
- **Act III: Key Content (22-99 words)** - Main explanation
- **Act IV: Call-to-Action (Conditional)** - Only for educational/opinion content

### **OUTPUT (JSON ONLY):**
{
  "thread": ["<Hook Tweet 1>", "<Body Tweet 2>", "..."],
  "reel_script": "<4-act script with acts separated by \\n\\n>",
  "captions": ["<Bold Statement>", "<Insightful Reflection>", "<Engaging Question>"],
  "emotions": ["Primary", "Secondary"], 
  "category": "Label"
}
"""


def strip_code_fences(text: str) -> str:
    """Remove code fence markers from text."""
    lines = text.split('\n')
    if lines and lines[0].strip().startswith('```'):
        lines = lines[1:]
    if lines and lines[-1].strip() == '```':
        lines = lines[:-1]
    return '\n'.join(lines)


def select_prompt(character_count: int) -> str:
    """Select appropriate prompt based on content length."""
    return SYSTEM_PROMPT_THREADS if character_count >= 280 else SYSTEM_PROMPT_SHORT


async def translate_to_spanish(text: str) -> str:
    """Translate text to Spanish using OpenAI."""
    try:
        messages = [
            {
                "role": "system", 
                "content": "You are a professional translator. Translate the following text to natural, engaging Spanish while preserving the original tone and style. Return only the translation."
            },
            {"role": "user", "content": text}
        ]
        
        response = await openai_service.create_chat_completion(
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )
        
        return response.get("content", text)
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text  # Return original if translation fails


# Router Endpoints

@router.post("/social-media-pipeline", response_model=SocialMediaResponse)
async def process_social_media_content(request: SocialMediaRequest = Body(...)):
    """
    Process text content for social media optimization.
    
    Transforms raw thoughts into polished social media content including:
    - Optimized tweets or thread creation
    - Instagram reel scripts  
    - Caption variations
    - Multilingual support (English/Spanish)
    """
    try:
        text = request.text.strip()
        language = request.language
        
        if not text:
            raise HTTPException(status_code=400, detail="Text input is required")
        
        # Select appropriate prompt based on character count
        character_count = len(text)
        system_prompt = select_prompt(character_count)
        
        logger.info(f"Processing {character_count} characters with {'THREADS' if character_count >= 280 else 'SHORT'} prompt")
        
        # Generate content with OpenAI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        response = await openai_service.create_chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        raw_content = response.get("content")
        if not raw_content:
            raise HTTPException(status_code=500, detail="No response from OpenAI")
        
        # Parse JSON response
        clean_content = strip_code_fences(raw_content)
        
        try:
            parsed_result = json.loads(clean_content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}, content: {clean_content}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        # Prepare English content
        english_content = {
            "refined": (
                parsed_result.get("thread", [""])[0] if character_count >= 280 and parsed_result.get("thread") 
                else parsed_result.get("improved_script", "")
            ),
            "reelScript": parsed_result.get("reel_script"),
            "captions": parsed_result.get("captions", []),
            "emotions": parsed_result.get("emotions", []),
            "category": parsed_result.get("category", "Other")
        }
        
        # If thread mode, join all tweets
        if character_count >= 280 and parsed_result.get("thread"):
            english_content["refined"] = "\n\n".join(parsed_result["thread"])
        
        # Translate to Spanish if requested
        spanish_content = None
        if language in ["both", "es"]:
            logger.info("Translating content to Spanish...")
            
            refined_sp = await translate_to_spanish(english_content["refined"])
            reel_script_sp = await translate_to_spanish(english_content["reelScript"]) if english_content["reelScript"] else None
            captions_sp = []
            
            for caption in english_content["captions"]:
                translated_caption = await translate_to_spanish(caption)
                captions_sp.append(translated_caption)
            
            spanish_content = {
                "refined": refined_sp,
                "reelScript": reel_script_sp,
                "captions": captions_sp
            }
        
        # Return structured response
        return SocialMediaResponse(
            success=True,
            data={
                "original": {
                    "text": text,
                    "characterCount": character_count,
                    "mode": "thread" if character_count >= 280 else "tweet"
                },
                "english": english_content,
                "spanish": spanish_content,
                "metadata": {
                    "emotions": parsed_result.get("emotions", []),
                    "category": parsed_result.get("category", "Other"),
                    "processedAt": datetime.utcnow().isoformat()
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social media pipeline error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process content: {str(e)}"
        )


@router.get("/social-media-pipeline")
async def get_social_media_info():
    """Get social media pipeline tool information."""
    return {
        "name": "Social Media Pipeline",
        "description": "AI-powered content optimization for social media platforms",
        "features": [
            "Tweet optimization and thread creation",
            "Instagram reel script generation", 
            "Caption variations",
            "Multilingual support (English/Spanish)",
            "Emotion and category analysis"
        ],
        "usage": {
            "endpoint": "POST /api/tools/social-media-pipeline",
            "parameters": {
                "text": "Content to process (required)",
                "language": "Output language: 'en', 'es', or 'both' (default: 'en')"
            }
        }
    }