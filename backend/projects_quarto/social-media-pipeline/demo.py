#!/usr/bin/env python3
"""
Interactive Social Media Pipeline Demo
=====================================

A simple CLI interface to test the social media pipeline functionality.
Run this script to see the system in action with sample content.
"""

import asyncio
import os
import sys
from social_media_pipeline import SocialMediaPipeline, ProcessingResult

def print_header():
    """Print a fancy header for the demo."""
    print("\n" + "="*70)
    print("🚀 SOCIAL MEDIA PIPELINE - INTERACTIVE DEMO")
    print("   Authentic Voice, Enhanced Impact")
    print("="*70)

def print_separator(title=""):
    """Print a section separator."""
    if title:
        print(f"\n{'─'*20} {title} {'─'*20}")
    else:
        print("\n" + "─"*50)

async def run_demo():
    """Run the interactive demo."""
    print_header()
    
    # Check for API keys
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("Please set your OpenAI API key and try again.")
        return
    
    if not os.getenv('DEEPL_API_KEY'):
        print("⚠️  Warning: DEEPL_API_KEY not set - Spanish translation will be disabled")
    
    # Initialize pipeline
    print("\n🔧 Initializing Social Media Pipeline...")
    pipeline = SocialMediaPipeline()
    print("✅ Pipeline ready!")
    
    # Demo examples
    examples = [
        {
            'title': '📱 Short Content (Tweet Mode)',
            'description': 'Perfect for Twitter/X posts under 280 characters',
            'text': "been thinking about this whole AI thing and honestly its kinda scary but also exciting like we're literally living through a revolution",
            'language': 'en'
        },
        {
            'title': '🧵 Long Content (Thread Mode)', 
            'description': 'Generates threads, reel scripts, and multiple captions',
            'text': "Just realized something about code reviews. Everyone talks about catching bugs but the real value is knowledge transfer. When a senior dev reviews junior code, both people learn. The junior learns better patterns, the senior learns about new approaches and different perspectives. It's not just quality control, it's collaborative learning.",
            'language': 'both' if os.getenv('DEEPL_API_KEY') else 'en'
        },
        {
            'title': '💼 Professional Content',
            'description': 'Business/career focused content with LinkedIn optimization',
            'text': "After 5 years as a software engineer I've learned that the most important skill isn't coding its communication. You can write the most elegant code in the world but if you can't explain why it matters or how it solves real problems then you're just writing expensive poetry. The engineers who advance fastest are the ones who can translate technical complexity into business value.",
            'language': 'en'
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print_separator(f"DEMO {i}/3: {example['title']}")
        print(f"📝 {example['description']}")
        print(f"\n💭 Original Input ({len(example['text'])} chars):")
        print(f'"{example["text"][:100]}{"..." if len(example["text"]) > 100 else ""}"')
        
        print(f"\n⚡ Processing with language='{example['language']}'...")
        
        try:
            # Process the content
            result = await pipeline.process_content(
                example['text'], 
                example['language']
            )
            
            # Display results
            print(f"✅ Processed in {result.processing_time:.2f}s")
            print(f"🎯 Mode: {result.mode.value.upper()}")
            
            # Show English content
            print(f"\n🇺🇸 ENHANCED ENGLISH CONTENT:")
            print("─" * 40)
            print(result.english_content['refined'])
            
            # Show reel script if available
            if result.english_content.get('reel_script'):
                print(f"\n🎬 REEL SCRIPT:")
                print("─" * 30)
                acts = result.english_content['reel_script'].split('\n\n')
                for j, act in enumerate(acts):
                    print(f"[ACT {j+1}] {act.strip()}")
                    if j < len(acts) - 1:
                        print()
            
            # Show captions
            if result.english_content.get('captions'):
                print(f"\n📝 CAPTION OPTIONS:")
                print("─" * 30)
                for j, caption in enumerate(result.english_content['captions'], 1):
                    print(f"{j}. {caption}")
                    print()
            
            # Show Spanish content if available
            if result.spanish_content:
                print(f"\n🇪🇸 SPANISH VERSION:")
                print("─" * 40)
                print(result.spanish_content['refined'])
                
                if result.spanish_content.get('captions'):
                    print(f"\n📝 SPANISH CAPTIONS:")
                    print("─" * 30)
                    for j, caption in enumerate(result.spanish_content['captions'], 1):
                        print(f"{j}. {caption}")
                        print()
            
            # Show metadata
            print(f"\n🏷️  METADATA:")
            print("─" * 20)
            print(f"Category: {result.metadata['category']}")
            print(f"Emotions: {', '.join(result.metadata['emotions'])}")
            print(f"Processing Time: {result.processing_time:.2f}s")
            
        except Exception as e:
            print(f"❌ Error processing content: {e}")
            print("Please check your API keys and try again.")
        
        # Wait before next example
        if i < len(examples):
            print(f"\n⏳ Moving to next example in 2 seconds...")
            await asyncio.sleep(2)
    
    print_separator("DEMO COMPLETE")
    print("🎉 Social Media Pipeline Demo finished!")
    print("\n💡 Key Features Demonstrated:")
    print("   ✅ Automatic mode selection (Tweet vs Thread)")
    print("   ✅ Voice preservation with enhancement")
    print("   ✅ Multi-format generation (Thread, Reel, Captions)")
    print("   ✅ Bilingual support (English + Spanish)")
    print("   ✅ Real-time processing with metadata")
    print("\n🔗 Ready to integrate into your content workflow!")

async def interactive_mode():
    """Run interactive mode where user can input their own content."""
    print_header()
    print("🎮 INTERACTIVE MODE - Test with your own content!")
    
    # Check API keys
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        return
    
    pipeline = SocialMediaPipeline()
    
    while True:
        print("\n" + "─"*50)
        print("📝 Enter your content (or 'quit' to exit):")
        user_input = input("> ")
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("👋 Thanks for trying the Social Media Pipeline!")
            break
        
        if not user_input.strip():
            print("⚠️  Please enter some content to process.")
            continue
        
        # Ask for language preference
        print("\n🌐 Language preference:")
        print("1. English only")
        print("2. Spanish only (requires DeepL API key)")  
        print("3. Both languages")
        
        lang_choice = input("Choose (1-3): ").strip()
        language_map = {'1': 'en', '2': 'es', '3': 'both'}
        language = language_map.get(lang_choice, 'en')
        
        if language in ['es', 'both'] and not os.getenv('DEEPL_API_KEY'):
            print("⚠️  DeepL API key not found, using English only")
            language = 'en'
        
        print(f"\n⚡ Processing your content...")
        
        try:
            result = await pipeline.process_content(user_input, language)
            output = pipeline.format_output(result, 'en')
            print(output)
            
            if result.spanish_content:
                print("\n🌐 SPANISH VERSION:")
                spanish_output = pipeline.format_output(result, 'es')
                print(spanish_output)
                
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    """Main function with menu selection."""
    if len(sys.argv) > 1 and sys.argv[1] == '--interactive':
        asyncio.run(interactive_mode())
    else:
        print("\n🚀 Social Media Pipeline Demo")
        print("Choose an option:")
        print("1. Run demo with sample content")
        print("2. Interactive mode (test your own content)")
        
        choice = input("\nEnter choice (1-2): ").strip()
        
        if choice == '2':
            asyncio.run(interactive_mode())
        else:
            asyncio.run(run_demo())

if __name__ == "__main__":
    main()