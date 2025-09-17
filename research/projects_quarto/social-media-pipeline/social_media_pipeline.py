#!/usr/bin/env python3
"""
Social Media Pipeline - Python Implementation
============================================

An AI-powered content refinement system that transforms authentic thoughts
into engaging, platform-optimized content while preserving your unique voice.

This implementation uses OpenAI GPT-4o-mini and DeepL for high-quality
bilingual content generation across multiple social media platforms.
"""

import json
import os
import re
import asyncio
import aiohttp
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

import openai
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ContentMode(Enum):
    """Content processing modes based on character count."""
    TWEET = "tweet"
    THREAD = "thread"

@dataclass
class ProcessingResult:
    """Structure for content processing results."""
    original_text: str
    character_count: int
    mode: ContentMode
    english_content: Dict[str, Any]
    spanish_content: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]
    processing_time: float

class SocialMediaPipeline:
    """
    Main class for the Social Media Pipeline system.
    
    Handles content processing, AI integration, and bilingual translation
    while preserving authentic voice and optimizing for engagement.
    """
    
    def __init__(self):
        """Initialize the pipeline with API keys and configuration."""
        self.openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.deepl_api_key = os.getenv('DEEPL_API_KEY')
        self.deepl_url = "https://api-free.deepl.com/v2/translate"
        
        # Character threshold for determining processing mode
        self.character_threshold = 280
        
        # System prompts (exact copies from the original implementation)
        self.system_prompt_short = self._get_short_content_prompt()
        self.system_prompt_threads = self._get_long_content_prompt()
    
    def _get_short_content_prompt(self) -> str:
        """Get the system prompt for short content (≤280 characters)."""
        return """You are an expert at refining short scripts while meticulously preserving the author's exact voice, tone, and meaning. Your primary goal is to enhance impact through subtle improvements, logical completion, and generating derivative content.
Write in the SAME language as the original text.

### **PRIMARY DIRECTIVE**
1) The author's unique voice is paramount. All edits must serve to clarify and strengthen it. Preserve the original rhythm, personality, point of view, and intentional stylistic quirks.

### **NON-NEGOTIABLES**
2) **Single Topic Focus:** If the input text contains multiple, clearly distinct topics, refine **only the first topic** and ignore the rest.
3) Preserve ALL facts, numbers, names, dates, and frameworks exactly as written.
4) **Spelling & Grammar:** Correct obvious spelling errors, typos, and basic grammar mistakes. **Pay special attention to well-known proper names (e.g., 'Charlei Murgan' → 'Charlie Munger') and famous quotes (e.g., 'reverse always reverse' → 'Invert, always invert.').**
5) Every sentence must be complete and end with proper punctuation, unless it is a stylistic fragment.
6) **Creative Completion:** Smooth awkward phrasing to improve clarity. If an idea is clearly unfinished, you may add a single, concise sentence to logically complete the thought.

### **STRUCTURE & FORMATTING**
7) **Impactful Opening:** The first line should be clear and engaging.
8) **Paragraphs:** Structure the output into short, clear paragraphs of 2-3 sentences each. Use double line breaks between paragraphs.
9) **Length:** Keep the script within ±10% of the original word count.
10) **Character Count:** The total length must **NOT exceed 280 characters.**
11) **Isolate Punchlines:** Identify short, impactful phrases and separate them into their own paragraph for emphasis.

### **CAPTION GENERATION**
Generate three short caption options (2-4 lines each) based on the core message:
1. **Option 1: The Bold Statement** - Direct and provocative
2. **Option 2: The Insightful Reflection** - Philosophical or inspirational
3. **Option 3: The Engaging Question** - Frame as a question to audience

### **OUTPUT (JSON ONLY):**
{
  "improved_script": "<final script under 280 chars>",
  "captions": [
    "<Caption 1: Bold Statement>",
    "<Caption 2: Insightful Reflection>",
    "<Caption 3: Engaging Question>"
  ],
  "emotions": ["Primary","Secondary"],
  "category": "Label"
}"""

    def _get_long_content_prompt(self) -> str:
        """Get the system prompt for long content (>280 characters)."""
        return """You are an expert content strategist specializing in adapting long-form text for high-impact social media platforms.

### PRIMARY DIRECTIVE
Your absolute priority is to preserve the author's original voice, tone, and meaning across all formats.

### PROCESSING & TASKS
Execute three tasks based on the source text:

#### Task 1: Generate Twitter/X Thread
1. **The Hook (Tweet 1):** Powerful, scroll-stopping hook (≤ 260 characters)
2. **The Body (Tweets 2 to N-1):** Sequential tweets (≤ 270 characters each) with number indicators
3. **The Conclusion (Tweet N):** Satisfying conclusion (≤ 260 characters), no numbering

#### Task 2: Generate Instagram Reel Script
**Structure (Based on ~130 WPM pace):**
- **Act I: The Hook (2-7 words):** Scroll-stopping opening
- **Act II: Value Proposition (7-22 words):** Clear promise
- **Act III: Key Content (22-99 words):** Main explanation
- **Act IV: Call-to-Action (Conditional):** Based on content type

#### Task 3: Generate Short Caption Options
1. **Option 1: Bold Statement** - Direct, punchy truth
2. **Option 2: Insightful Reflection** - Philosophical take
3. **Option 3: Engaging Question** - Spark discussion

### OUTPUT (JSON ONLY):
{
  "thread": ["<Hook Tweet 1>", "<Body Tweet 2>", "..."],
  "reel_script": "<Full script with acts separated by \\n\\n>",
  "captions": ["<Caption 1>", "<Caption 2>", "<Caption 3>"],
  "emotions": ["Primary", "Secondary"],
  "category": "Label"
}"""

    def _select_prompt(self, character_count: int) -> Tuple[str, ContentMode]:
        """
        Select appropriate prompt based on character count.
        
        Args:
            character_count: Number of characters in input text
            
        Returns:
            Tuple of (system_prompt, content_mode)
        """
        if character_count >= self.character_threshold:
            return self.system_prompt_threads, ContentMode.THREAD
        else:
            return self.system_prompt_short, ContentMode.TWEET

    def _strip_code_fences(self, content: str) -> str:
        """Remove markdown code fences from AI response."""
        # Remove ```json and ``` markers
        content = re.sub(r'^```json\s*', '', content, flags=re.MULTILINE)
        content = re.sub(r'^```\s*$', '', content, flags=re.MULTILINE)
        return content.strip()

    async def _translate_to_spanish(self, text: str) -> str:
        """
        Translate text to Spanish using DeepL API.
        
        Args:
            text: Text to translate
            
        Returns:
            Translated text or original text if translation fails
        """
        try:
            headers = {
                'Authorization': f'DeepL-Auth-Key {self.deepl_api_key}',
                'Content-Type': 'application/x-www-form-urlencoded',
            }
            
            data = {
                'text': text,
                'target_lang': 'ES',
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.deepl_url, 
                    headers=headers, 
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result['translations'][0]['text']
                    else:
                        print(f"DeepL API error: {response.status}")
                        return text
                        
        except Exception as error:
            print(f"Translation error: {error}")
            return text

    async def _process_with_openai(self, text: str, system_prompt: str) -> Dict[str, Any]:
        """
        Process content with OpenAI GPT-4o-mini.
        
        Args:
            text: Input text to process
            system_prompt: System prompt to use
            
        Returns:
            Parsed JSON response from OpenAI
        """
        try:
            completion = await self.openai_client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': text}
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            
            raw_content = completion.choices[0].message.content
            if not raw_content:
                raise ValueError('Empty response from OpenAI')
            
            # Clean and parse JSON response
            clean_content = self._strip_code_fences(raw_content)
            return json.loads(clean_content)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from OpenAI: {e}")
        except Exception as e:
            raise ValueError(f"OpenAI processing error: {e}")

    async def _translate_content_parallel(self, english_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Translate English content to Spanish in parallel.
        
        Args:
            english_content: Content structure with English text
            
        Returns:
            Content structure with Spanish translations
        """
        # Prepare translation tasks
        tasks = [
            self._translate_to_spanish(english_content['refined'])
        ]
        
        # Add reel script translation if it exists
        if english_content.get('reel_script'):
            tasks.append(self._translate_to_spanish(english_content['reel_script']))
        else:
            tasks.append(asyncio.coroutine(lambda: None)())
        
        # Add caption translations
        caption_tasks = [
            self._translate_to_spanish(caption) 
            for caption in english_content.get('captions', [])
        ]
        
        # Execute all translations in parallel
        translated_results = await asyncio.gather(*tasks)
        translated_captions = await asyncio.gather(*caption_tasks)
        
        return {
            'refined': translated_results[0],
            'reel_script': translated_results[1],
            'captions': translated_captions
        }

    async def process_content(
        self, 
        text: str, 
        language: str = 'en'
    ) -> ProcessingResult:
        """
        Main method to process content through the pipeline.
        
        Args:
            text: Raw input text to process
            language: Language preference ('en', 'es', or 'both')
            
        Returns:
            ProcessingResult with all generated content
        """
        start_time = time.time()
        
        if not text or not text.strip():
            raise ValueError('Text input is required')
        
        # Analyze input and select processing mode
        character_count = len(text)
        system_prompt, mode = self._select_prompt(character_count)
        
        print(f"Processing {character_count} characters with {mode.value.upper()} prompt")
        
        # Process with OpenAI
        ai_result = await self._process_with_openai(text, system_prompt)
        
        # Structure English content
        if mode == ContentMode.THREAD:
            english_refined = '\n\n'.join(ai_result.get('thread', []))
        else:
            english_refined = ai_result.get('improved_script', '')
        
        english_content = {
            'refined': english_refined,
            'reel_script': ai_result.get('reel_script'),
            'captions': ai_result.get('captions', []),
            'emotions': ai_result.get('emotions', []),
            'category': ai_result.get('category', 'Other')
        }
        
        # Handle Spanish translation if requested
        spanish_content = None
        if language in ['both', 'es']:
            print('Translating content to Spanish...')
            spanish_content = await self._translate_content_parallel(english_content)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Create result object
        return ProcessingResult(
            original_text=text,
            character_count=character_count,
            mode=mode,
            english_content=english_content,
            spanish_content=spanish_content,
            metadata={
                'emotions': ai_result.get('emotions', []),
                'category': ai_result.get('category', 'Other'),
                'processed_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
                'processing_time': round(processing_time, 2)
            },
            processing_time=processing_time
        )

    def format_output(self, result: ProcessingResult, language: str = 'en') -> str:
        """
        Format processing result for display.
        
        Args:
            result: ProcessingResult to format
            language: Language to display ('en' or 'es')
            
        Returns:
            Formatted string output
        """
        content = result.spanish_content if language == 'es' and result.spanish_content else result.english_content
        
        output = f"""
🎯 SOCIAL MEDIA PIPELINE RESULTS
{'='*50}

📊 ORIGINAL INPUT:
   Text: "{result.original_text[:100]}{'...' if len(result.original_text) > 100 else ''}"
   Length: {result.character_count} characters
   Mode: {result.mode.value.upper()}
   Language: {language.upper()}

⚡ PROCESSING TIME: {result.processing_time:.2f}s

🚀 ENHANCED CONTENT:
{content['refined']}

"""
        
        if content.get('reel_script'):
            output += f"""
🎬 REEL SCRIPT:
{content['reel_script']}

"""
        
        if content.get('captions'):
            output += "📝 CAPTION OPTIONS:\n"
            for i, caption in enumerate(content['captions'], 1):
                output += f"\n{i}. {caption}\n"
        
        output += f"""
🏷️ METADATA:
   Category: {result.metadata['category']}
   Emotions: {', '.join(result.metadata['emotions'])}
   Processed: {result.metadata['processed_at']}
"""
        
        return output

# CLI Interface for testing
async def main():
    """Main function for CLI testing."""
    print("🚀 Social Media Pipeline - Python Implementation")
    print("=" * 60)
    
    # Initialize pipeline
    pipeline = SocialMediaPipeline()
    
    # Test examples
    test_cases = [
        {
            'name': 'Short Content Example',
            'text': "been thinking about this whole AI thing and honestly its kinda scary but also exciting like we're literally living through a revolution",
            'language': 'en'
        },
        {
            'name': 'Long Content Example',
            'text': "Just realized something about code reviews. Everyone talks about catching bugs but the real value is knowledge transfer. When a senior dev reviews junior code, both people learn. The junior learns better patterns, the senior learns about new approaches and different perspectives. It's not just quality control, it's collaborative learning.",
            'language': 'both'
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 TESTING: {test_case['name']}")
        print("-" * 40)
        
        try:
            result = await pipeline.process_content(
                test_case['text'], 
                test_case['language']
            )
            
            # Display English results
            print(pipeline.format_output(result, 'en'))
            
            # Display Spanish results if available
            if result.spanish_content:
                print("\n🌐 SPANISH VERSION:")
                print("-" * 30)
                print(pipeline.format_output(result, 'es'))
                
        except Exception as e:
            print(f"❌ Error processing content: {e}")

if __name__ == "__main__":
    asyncio.run(main())