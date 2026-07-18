import type { ChatMessage } from 'z-ai-web-dev-sdk';

export function isAiLlmConfigured(): boolean {
  return Boolean(
    process.env.ZAI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.AI_API_KEY?.trim(),
  );
}

/**
 * Call the configured LLM (ZAI SDK preferred). Returns null if unavailable.
 */
export async function completeChat(
  messages: ChatMessage[],
  options?: { temperature?: number },
): Promise<string | null> {
  try {
    if (process.env.ZAI_API_KEY?.trim() || !process.env.OPENAI_API_KEY?.trim()) {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages,
        temperature: options?.temperature ?? 0.4,
        thinking: { type: 'disabled' },
      });
      const content =
        completion?.choices?.[0]?.message?.content ??
        completion?.choices?.[0]?.text ??
        completion?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
    }
  } catch (err) {
    console.warn('[ai] ZAI chat failed, trying OpenAI fallback:', err);
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim() || process.env.AI_API_KEY?.trim();
  if (!openAiKey) return null;

  try {
    const base = process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch (err) {
    console.warn('[ai] OpenAI fallback failed:', err);
    return null;
  }
}
