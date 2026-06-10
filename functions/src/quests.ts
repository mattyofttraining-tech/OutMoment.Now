import Anthropic from '@anthropic-ai/sdk';

/**
 * AI quest generation, guard-railed.
 *
 * Given a host's free-text description of their event, ask Claude for a tasteful,
 * varied pack of photo quests, then validate the result hard before trusting it.
 * If anything is off, the caller falls back to the curated default pack.
 */

export interface GeneratedQuest {
  icon: string;
  title: string;
  prompt: string;
}

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You design photo "quests" for OurMoment, an app where guests at an event take photos together.

A quest is a small, joyful nudge to capture a specific kind of photo. Each quest has:
- "icon": a single emoji that fits the quest
- "title": 2-4 words, warm and evocative (e.g. "Caught Laughing")
- "prompt": one short sentence telling the guest what to photograph (e.g. "A genuine, unposed laugh.")

Rules you MUST follow:
- Return 10 quests.
- Ensure VARIETY across shot types: at least 2 wide/establishing shots, several candids of people, 2-3 small details, and 1 of the guest(s) of honour.
- Keep it TASTEFUL and APPROPRIATE for a family event. Never suggest anything invasive, embarrassing, risky, sexual, or that pressures guests (no "kiss a stranger", no alcohol dares, nothing involving private spaces).
- Warmth over cleverness. No leaderboards, no competition language.
- Match the tone to the event the host describes.

Output ONLY a JSON array of 10 objects with keys "icon", "title", "prompt". No prose, no markdown, no code fences.`;

/** Languages the app ships; anything else falls back to English. */
const ALLOWED_LANGUAGES = new Set([
  'English',
  'German',
  'French',
  'Spanish',
  'Italian',
  'Dutch',
  'Portuguese',
  'Polish',
  'Danish',
  'Swedish',
]);

export function sanitizeLanguage(language: unknown): string {
  return typeof language === 'string' && ALLOWED_LANGUAGES.has(language) ? language : 'English';
}

export async function generateQuestsWithAI(
  apiKey: string,
  brief: string,
  eventType: string,
  language = 'English',
): Promise<GeneratedQuest[]> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Event type: ${eventType}\nHost's description: ${brief}\nWrite every "title" and "prompt" in ${language}.\n\nGenerate the 10 quests as a JSON array.`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return validateQuests(text);
}

/** Parse + hard-validate the model output. Throws if it can't be trusted. */
export function validateQuests(raw: string): GeneratedQuest[] {
  // Strip accidental code fences just in case.
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI response was not valid JSON.');
  }
  if (!Array.isArray(parsed)) throw new Error('AI response was not an array.');

  const quests: GeneratedQuest[] = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as any).title === 'string' &&
      typeof (item as any).prompt === 'string'
    ) {
      const title = String((item as any).title).trim().slice(0, 40);
      const prompt = String((item as any).prompt).trim().slice(0, 140);
      const icon = typeof (item as any).icon === 'string' ? String((item as any).icon).trim() : '✨';
      if (title && prompt) quests.push({ icon: icon || '✨', title, prompt });
    }
  }

  if (quests.length < 6) throw new Error('AI returned too few valid quests.');
  return quests.slice(0, 12);
}
