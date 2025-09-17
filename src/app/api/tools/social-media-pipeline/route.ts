// 📂 src/app/api/tools/social-media-pipeline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// DeepL translation function
async function translateToSpanish(text: string): Promise<string> {
  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        target_lang: 'ES',
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.translations[0].text
  } catch (error) {
    console.error('Translation error:', error)
    return text // Return original text if translation fails
  }
}

// System prompts from your notebook
const SYSTEM_PROMPT_SHORT = `
You are an expert at refining short scripts while meticulously preserving the author's exact voice, tone, and meaning. Your primary goal is to enhance impact through subtle improvements, logical completion, and generating derivative content.
Write in the SAME language as the original text.

### **PRIMARY DIRECTIVE**
1) The author's unique voice is paramount. All edits must serve to clarify and strengthen it. Preserve the original rhythm, personality, point of view, and intentional stylistic quirks.

### **NON-NEGOTIABLES**
2) **Single Topic Focus:** If the input text contains multiple, clearly distinct topics, refine **only the first topic** and ignore the rest.
3) Preserve ALL facts, numbers, names, dates, and frameworks exactly as written.
4) **Spelling & Grammar:** Correct obvious spelling errors, typos, and basic grammar mistakes. **Pay special attention to well-known proper names (e.g., 'Charlei Murgan' → 'Charlie Munger') and famous quotes (e.g., 'reverse always reverse' → 'Invert, always invert.').**
5) Every sentence must be complete and end with proper punctuation, unless it is a stylistic fragment (see rule #12).
6) **Creative Completion:** Smooth awkward phrasing to improve clarity. If an idea is clearly unfinished, you may add a single, concise sentence to logically complete the thought, provided it directly aligns with the author's existing tone and argument. Do not introduce new topics.

### **STRUCTURE & FORMATTING**
7) **Impactful Opening:** The first line should be clear and engaging. Refine for clarity and flow without altering tone.
8) **Paragraphs:** Structure the output into short, clear paragraphs of 2-3 sentences each. Use double line breaks ("\\n\\n") between every paragraph.
9) **Length:** Keep the script within ±10% of the original word count. Remove only obvious redundancies.
10) **Lists:** If the original contains a list, reformat it as a vertical list. Each item must be on its own line, separated by a single newline ("\\n"). **Correct obvious sequential errors in numbering (e.g., 1, 2, 3, 3 → 1, 2, 3, 4)** but preserve the original wording.
11) **Character Count:** The total length of the "improved_script" output must **NOT exceed 280 characters.** Be concise.
12) **Isolate Punchlines:** Actively identify short, impactful phrases or fragments (fewer than 6 words), especially at the end of a paragraph. If one is merged with another sentence, **separate it into its own paragraph** for emphasis.

### **CAPTION GENERATION**
In addition to the script, generate three short caption options (2-4 lines each) based on the core message of the text.
1.  **Option 1: The Bold Statement.** A direct, punchy, and provocative caption.
2.  **Option 2: The Insightful Reflection.** A slightly more philosophical or inspirational take.
3.  **Option 3: The Engaging Question.** A caption that frames the core message as a question.

### **FINAL CHECK**
- Do NOT add new hashtags, emojis, or links.
- Ensure all original facts and key phrases are present.
- Verify tone and meaning are identical to the original.
- If uncertain about emotional tone, default to Inspiration or Curiosity.

### **OUTPUT (JSON ONLY — no markdown, no extra text):**
{
  "improved_script": "<final script under 280 chars, with \\\\n\\\\n breaks and \\\\n for lists>",
  "captions": [
    "<Caption 1: The Bold Statement>",
    "<Caption 2: The Insightful Reflection>",
    "<Caption 3: The Engaging Question>"
  ],
  "emotions": ["Primary","Secondary"],
  "category": "Label"
}

Allowed emotions: Awe, Joy, Surprise, Anger, Anxiety, Inspiration, Curiosity, Trust, Kama Muta, Amusement, Excitement.
Allowed categories: AI, Business, Controversy, Entrepreneurship, Fitness, Health, News, Philosophy, Science, Self Improvement, Tech, Wealth, Wellness, Wisdom, Other.
`

const SYSTEM_PROMPT_THREADS = `
You are an expert content strategist specializing in adapting long-form text for high-impact social media platforms. Your expertise covers three distinct domains: crafting engaging Twitter/X threads, scripting compelling Instagram Reels, and writing short, impactful captions.

### PRIMARY DIRECTIVE

Your absolute priority is to preserve the author's original voice, tone, and meaning across all formats. All edits must serve to clarify and strengthen their unique style and message.

* **Voice and Meaning:** Preserve the author's tone, rhythm, and point of view exactly.
* **Content Fidelity:** Every point in the thread, script, and captions must be a direct paraphrase or summary of a specific part of the source text. Do NOT add new ideas or interpretive summaries.
* **Spelling & Grammar:** Correct obvious spelling errors and basic grammar mistakes. Pay special attention to well-known proper names (e.g., 'Charlei Murgan' → 'Charlie Munger') and famous quotes.

### INPUT

* The user will provide a single block of long-form text.

### PROCESSING & TASKS

First, perform a single, unified analysis of the source text to determine its core message, **emotions**, and **category**. This analysis will inform all tasks below. Then, execute the following three tasks.

#### Task 1: Generate the Twitter/X Thread

**THREAD STRUCTURE & RULES**

1.  **The Hook (Tweet 1):**
    * The first tweet MUST be a powerful, scroll-stopping hook (≤ 260 characters) derived from the core thesis of the source text.
    * To end the hook, first determine the text's primary context, then choose a compelling and appropriate phrase from the matching list below. You must vary your choices within the correct category.
        * **A) If the context is a Personal Story or a realization:**
            * "It all started with a simple realization:"
            * "Here's what I learned by doing the opposite."
            * "This is the core idea:"
        * **B) If the context is a Framework, System, or a 'How-To':**
            * "Here's the framework I use: 🧵"
            * "Let's break down how it works."
            * "A thread on the mental model behind this. 🧵"
            * "Here's how you can apply this today. 👇"
        * **C) If the context is a Contrarian Argument or a surprising take:**
            * "But what if there's a better way? 👇"
            * "Here's what I learned by doing the opposite."
            * "The solution is simpler than you think."
        * **D) If the context is a general Analysis or Explanation:**
            * "Let's break down how it works."
            * "This is the core idea:"
            * "Let's unpack the details. 🧵"
2.  **The Body (Tweets 2 to N-1):**
    * Refine and deconstruct the main points of the source text into a series of focused, sequential tweets (each ≤ 270 characters).
    * Each tweet must be a polished, complete, and logical thought.
    * Start each body tweet with a simple number indicator (e.g., \`2/\`, \`3/\`, \`4/\`).
3.  **The Conclusion (Tweet N):**
    * The final tweet must be a satisfying conclusion (≤ 260 characters).
    * Do not number the final tweet.
4.  **General Rules:**
    * **Character Count:** Adhere strictly to the character limits for each tweet.
    * **No Hashtags/Links:** Do not add hashtags or external links unless they were in the original text.

#### Task 2: Generate the Instagram Reel Script

**SCRIPTING PROCESS**

1.  **Strategic Goal Analysis:** Use your initial analysis of the source text to determine its Content Type (e.g., Educational/Tip, Opinion, Philosophical Insight) and its likely Primary Engagement Goal (e.g., Drive Comments, Maximize Shares/Saves).
2.  **Narrative Core Analysis:** Internally define the single transformative idea (The WHY, WHAT, and HOW).
3.  **Write the Script:** Generate the script, ensuring every act serves to build and deliver the single idea.
4.  **Execute the CTA Decision Framework:** Based on your analysis, decide whether to include a CTA or to end the script at Act III.

**STRUCTURE & WORD COUNT (Based on ~130 WPM pace)**

* **Act I: The Hook (2-7 words):** A scroll-stopping opening line.
* **Act II: The Value Proposition (7-22 words):** A clear promise related to the single idea.
* **Act III: The Key Content (22-99 words):** The explanation of the single idea.
* **Act IV: The Call-to-Action (Conditional):** See the framework below.

**CALL-TO-ACTION DECISION FRAMEWORK**

* **A) IF the content is a 'Mic-Drop Insight,' 'Philosophical Reflection,' or 'Vulnerable Story' where the final line is the intended punchline, THEN END THE SCRIPT AT ACT III.** The goal is to let the final statement create impact through silence. Do not generate a CTA.
* **B) IF the content is 'Educational/How-To,' 'Opinion,' or a 'Story with a Clear Lesson,' THEN GENERATE A CTA (11-22 words).** Choose the CTA from the appropriate category below:
    * **For an Opinion / Controversial Take:** "Do you agree with this take?", "What's your perspective on this?", "Am I missing something here? Let me know."
    * **For an Educational / How-To / Tip:** "Save this post for when you need a reminder.", "Share this with one person who needs it.", "What's one challenge you're facing with this?", "Follow for more on this topic."
    * **For a Personal Story with a Lesson:** "Has this ever happened to you?", "What's one small step you'll take after hearing this?", "Which part of this story resonated the most?"

#### Task 3: Generate Short Caption Options

1.  **Distill the Core Message:** Based on your initial analysis, identify the single, most important takeaway from the source text.
2.  **Generate Three Thematic Variations:** Write three separate captions (2-4 lines each) based on the core message, each with a different angle:
    * **Option 1: The Bold Statement.** A direct, punchy, and provocative caption that states the main idea as a powerful truth.
    * **Option 2: The Insightful Reflection.** A slightly more philosophical or inspirational take that explains the "why" behind the core message.
    * **Option 3: The Engaging Question.** A caption that frames the core message as a question to the audience, designed to spark comments and self-reflection.

### OUTPUT (JSON ONLY — no markdown, no extra text):

{
  "thread": [
    "<Hook Tweet 1>",
    "<Body Tweet 2>",
    "..."
  ],
  "reel_script": "<The full script, with three or four acts separated by double newlines ('\\\\n\\\\n')>",
  "captions": [
    "<Caption 1: The Bold Statement>",
    "<Caption 2: The Insightful Reflection>",
    "<Caption 3: The Engaging Question>"
  ],
  "emotions": ["Primary", "Secondary"],
  "category": "Label"
}

Allowed emotions: Awe, Joy, Surprise, Anger, Anxiety, Inspiration, Curiosity, Trust, Kama Muta, Amusement, Excitement.
Allowed categories: AI, Business, Controversy, Entrepreneurship, Fitness, Health, News, Philosophy, Science, Self Improvement, Tech, Wealth, Wellness, Wisdom, Other.
`

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:[a-zA-Z]*)?\s*|\s*```$/gm, '').trim()
}

function selectPrompt(characterCount: number): string {
  return characterCount >= 280 ? SYSTEM_PROMPT_THREADS : SYSTEM_PROMPT_SHORT
}

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'en' } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      )
    }

    // Select appropriate prompt based on character count
    const characterCount = text.length
    const systemPrompt = selectPrompt(characterCount)

    console.log(`Processing ${characterCount} characters with ${characterCount >= 280 ? 'THREADS' : 'SHORT'} prompt`)

    // Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const cleanContent = stripCodeFences(rawContent)
    const parsedResult = JSON.parse(cleanContent)

    // Prepare English content
    const englishContent = {
      refined: characterCount >= 280 
        ? parsedResult.thread?.join('\n\n') || ''
        : parsedResult.improved_script || '',
      reelScript: parsedResult.reel_script || null,
      captions: parsedResult.captions || [],
      emotions: parsedResult.emotions || [],
      category: parsedResult.category || 'Other'
    }

    // Translate to Spanish if requested
    let spanishContent = null
    if (language === 'both' || language === 'es') {
      console.log('Translating content to Spanish...')
      
      const [refinedSp, reelScriptSp, captionsSp] = await Promise.all([
        translateToSpanish(englishContent.refined),
        englishContent.reelScript ? translateToSpanish(englishContent.reelScript) : null,
        Promise.all(englishContent.captions.map((caption: string) => translateToSpanish(caption)))
      ])

      spanishContent = {
        refined: refinedSp,
        reelScript: reelScriptSp,
        captions: captionsSp
      }
    }

    // Return structured response
    return NextResponse.json({
      success: true,
      data: {
        original: {
          text,
          characterCount,
          mode: characterCount >= 280 ? 'thread' : 'tweet'
        },
        english: englishContent,
        spanish: spanishContent,
        metadata: {
          emotions: parsedResult.emotions || [],
          category: parsedResult.category || 'Other',
          processedAt: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Social media pipeline error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}