import OpenAI from 'openai';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

export type ChatProviderName = 'proxy' | 'groq' | 'openai';

export interface ChatProviderConfig {
  provider: ChatProviderName;
  apiKey: string;
  model: string;
  baseURL?: string;
}

type ChatProviderEnv = Record<string, string | undefined>;

function envValue(env: ChatProviderEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * Resolve the portfolio chat provider without creating a client.
 *
 * Precedence intentionally preserves existing proxy deployments before Groq
 * and OpenAI fallback credentials.
 */
export function resolveChatProvider(env: ChatProviderEnv = process.env): ChatProviderConfig | null {
  const proxyApiKey = envValue(env, 'AI_PROXY_API_KEY');
  if (proxyApiKey) {
    return {
      provider: 'proxy',
      apiKey: proxyApiKey,
      baseURL: envValue(env, 'AI_PROXY_BASE_URL') ?? GROQ_BASE_URL,
      model: envValue(env, 'AI_CHAT_MODEL') ?? DEFAULT_GROQ_MODEL,
    };
  }

  const groqApiKey = envValue(env, 'GROQ_API_KEY');
  if (groqApiKey) {
    return {
      provider: 'groq',
      apiKey: groqApiKey,
      baseURL: GROQ_BASE_URL,
      model: envValue(env, 'GROQ_CHAT_MODEL') ?? envValue(env, 'AI_CHAT_MODEL') ?? DEFAULT_GROQ_MODEL,
    };
  }

  const openaiApiKey = envValue(env, 'OPENAI_API_KEY');
  if (openaiApiKey) {
    return {
      provider: 'openai',
      apiKey: openaiApiKey,
      model: envValue(env, 'OPENAI_CHAT_MODEL') ?? DEFAULT_OPENAI_MODEL,
    };
  }

  return null;
}

export function createChatClient(config: ChatProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
}

/**
 * Wrapper using the OpenAI-compatible chat completions API.
 */
export async function getChatCompletion(message: string): Promise<string> {
  const provider = resolveChatProvider();
  if (!provider) {
    throw new Error('AI API key not configured');
  }

  const client = createChatClient(provider);

  try {
    const response = await client.chat.completions.create({
      model: provider.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides concise and informative responses.' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('AI provider error:', error);
    throw new Error('Failed to generate response');
  }
}
