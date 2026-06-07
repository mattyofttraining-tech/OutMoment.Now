import type { EventType, Quest } from '@/types';
import { EVENT_WORLDS } from '@/data/eventWorlds';

/**
 * Offline quest generator.
 *
 * This is the fallback the demo uses and the safety net the production app
 * falls back to if the AI Cloud Function is unavailable. It blends the event
 * world's curated pack with a few brief-aware prompts, always keeping a healthy
 * variety of shot types (wide / candid / detail / guest-of-honour).
 *
 * The *real* AI generation happens server-side in the `generateQuests` Cloud
 * Function (see /functions/src/quests.ts) which calls Claude with a guard-railed
 * system prompt and validates the JSON it returns.
 */

interface QuestSeed {
  icon: string;
  title: string;
  prompt: string;
}

const VARIETY: QuestSeed[] = [
  { icon: '🌅', title: 'The Setting', prompt: 'A wide shot that captures where you all are.' },
  { icon: '😂', title: 'Caught Laughing', prompt: 'A genuine, unposed laugh.' },
  { icon: '🔎', title: 'A Small Detail', prompt: 'Something little that’s easy to miss.' },
  { icon: '⭐', title: 'The Guest of Honour', prompt: 'A portrait of the person it’s all for.' },
  { icon: '👥', title: 'Everyone', prompt: 'Fit as many people as you can into one frame.' },
  { icon: '❤️', title: 'A Tender Moment', prompt: 'A hug, a hand-hold, or a quiet look.' },
  { icon: '🍽️', title: 'The Spread', prompt: 'The food, the drinks, or the table.' },
  { icon: '🎶', title: 'The Soundtrack', prompt: 'Music, dancing, or the energy of the room.' },
];

const KEYWORD_QUESTS: { match: RegExp; quest: QuestSeed }[] = [
  { match: /beach|sea|ocean|coast|sail/i, quest: { icon: '🌊', title: 'By the Water', prompt: 'A photo with the sea in it.' } },
  { match: /garden|park|forest|outdoor|hike/i, quest: { icon: '🌿', title: 'Out in Nature', prompt: 'Catch the greenery around you.' } },
  { match: /dog|cat|pet|animal/i, quest: { icon: '🐾', title: 'The Four-Legged Guest', prompt: 'A photo of the pet of the day.' } },
  { match: /retire|farewell|goodbye|leaving/i, quest: { icon: '🎓', title: 'A New Chapter', prompt: 'Capture what comes next.' } },
  { match: /anniversary|years|reunion/i, quest: { icon: '⏳', title: 'Then & Now', prompt: 'A photo that nods to how far you’ve come.' } },
  { match: /kid|child|family|baby/i, quest: { icon: '🧒', title: 'The Little Ones', prompt: 'A candid of the youngest guests.' } },
  { match: /night|dance|party|club/i, quest: { icon: '🌙', title: 'After Dark', prompt: 'The night at its liveliest.' } },
  { match: /toast|speech|cheers|drinks/i, quest: { icon: '🥂', title: 'A Toast', prompt: 'Someone raising a glass.' } },
];

export function generateQuestsLocally(brief: string, eventType: EventType): Quest[] {
  const base = EVENT_WORLDS[eventType].defaultQuests.slice(0, 5).map((q) => ({ ...q }));

  const briefQuests: QuestSeed[] = [];
  for (const { match, quest } of KEYWORD_QUESTS) {
    if (match.test(brief) && briefQuests.length < 4) briefQuests.push(quest);
  }
  // Top up with variety to reach a healthy 10-quest pack.
  const seeds = [...briefQuests, ...VARIETY];
  const seen = new Set(base.map((q) => q.title));
  const extra: QuestSeed[] = [];
  for (const s of seeds) {
    if (seen.has(s.title)) continue;
    seen.add(s.title);
    extra.push(s);
    if (base.length + extra.length >= 10) break;
  }

  return [...base, ...extra.map((s, i) => ({ id: `aiq_${i}`, order: base.length + i + 1, ...s }))].map(
    (q, i) => ({
      id: q.id ?? `aiq_${i}`,
      icon: q.icon,
      title: q.title,
      prompt: q.prompt,
      order: i + 1,
      completedBy: [],
      aiGenerated: true,
    }),
  );
}
