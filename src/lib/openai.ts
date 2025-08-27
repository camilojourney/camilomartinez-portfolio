import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const client = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Wrapper using the new Responses API with fallback to legacy chat.completions.
 */
export async function getChatCompletion(message: string): Promise<string> {
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: 'You are a helpful assistant that provides concise and informative responses.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_output_tokens: 500
    });
    return response.output_text || 'No response generated';
  } catch (primaryErr) {
    console.warn('Responses API failed, falling back to chat.completions', primaryErr);
    try {
      const legacy = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that provides concise and informative responses.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      return legacy.choices[0]?.message?.content || 'No response generated';
    } catch (fallbackErr) {
      console.error('OpenAI API error (both primary & fallback failed):', fallbackErr);
      throw new Error('Failed to generate response');
    }
  }
}
