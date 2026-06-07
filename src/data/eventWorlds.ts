import type { EventWorld, EventType } from '@/types';
import { decorImage } from '@/utils/images';

/**
 * The five event worlds. Each is a self-contained little universe: its own
 * accent, gradient, voice and a hand-tuned pack of photo quests. `special` is
 * the all-purpose world where the host describes the party and AI writes the
 * quests instead of shipping a fixed pack.
 */

let q = 0;
const quest = (icon: string, title: string, prompt: string) => ({
  id: `q_${++q}`,
  icon,
  title,
  prompt,
  order: q,
});

export const EVENT_WORLDS: Record<EventType, EventWorld> = {
  marriage: {
    type: 'marriage',
    name: 'Marriage',
    tagline: 'Two stories become one',
    description:
      'For weddings and the day everything changed. Capture the vows, the tears, the first dance — and every glance in between.',
    glyph: '💍',
    accent: '#C9A227',
    gradient: ['#2A2113', '#0B0B0F'],
    coverImage: decorImage('ourmoment-wedding', 1400, 1800),
    aiPowered: false,
    priceLabel: '$149',
    defaultQuests: [
      quest('💍', 'The Rings', 'A close-up of the rings before they’re worn.'),
      quest('👰', 'First Look', 'The moment they see each other.'),
      quest('🥂', 'A Toast', 'Someone raising a glass.'),
      quest('💃', 'First Dance', 'The couple’s first dance together.'),
      quest('😭', 'Happy Tears', 'Catch someone crying with joy.'),
      quest('👠', 'The Details', 'Shoes, flowers, or the dress up close.'),
      quest('🎉', 'The Exit', 'Confetti, sparklers, or the getaway car.'),
      quest('👨‍👩‍👧', 'The Generations', 'Three generations of family in one frame.'),
      quest('😂', 'Caught Laughing', 'A genuine, unposed laugh.'),
      quest('🌅', 'Golden Hour', 'A portrait in the best light of the day.'),
    ],
  },

  confirmation: {
    type: 'confirmation',
    name: 'Confirmation',
    tagline: 'A milestone of faith',
    description:
      'For confirmations and coming-of-age days. The ceremony, the family table, and the pride on everyone’s faces.',
    glyph: '✝️',
    accent: '#6C7BD6',
    gradient: ['#171A2E', '#0B0B0F'],
    coverImage: decorImage('ourmoment-confirmation', 1400, 1800),
    aiPowered: false,
    priceLabel: '$89',
    defaultQuests: [
      quest('✝️', 'The Ceremony', 'A photo from inside the service.'),
      quest('🕯️', 'The Candle', 'Light, candles, or stained glass.'),
      quest('👔', 'All Dressed Up', 'The guest of honour in their outfit.'),
      quest('🍽️', 'The Family Table', 'Everyone gathered to eat.'),
      quest('🎁', 'A Gift', 'Opening or holding a present.'),
      quest('👵', 'With Grandparents', 'A photo with the eldest guests.'),
      quest('🥂', 'A Speech', 'Someone giving a toast or speech.'),
      quest('😊', 'The Proud Parent', 'A parent’s proud face.'),
      quest('📸', 'The Group Shot', 'As many people as you can fit.'),
    ],
  },

  baptism: {
    type: 'baptism',
    name: 'Baptism',
    tagline: 'A gentle beginning',
    description:
      'For christenings and baptisms. Tiny hands, quiet moments and the people who showed up for the very start.',
    glyph: '🕊️',
    accent: '#5BB8C4',
    gradient: ['#102A2D', '#0B0B0F'],
    coverImage: decorImage('ourmoment-baptism', 1400, 1800),
    aiPowered: false,
    priceLabel: '$89',
    defaultQuests: [
      quest('🕊️', 'The Blessing', 'A photo from the ceremony.'),
      quest('👶', 'Tiny Hands', 'A close-up of little hands or feet.'),
      quest('💧', 'The Water', 'The font, water, or the moment itself.'),
      quest('🤍', 'The Gown', 'The christening outfit in detail.'),
      quest('🧑‍🤝‍🧑', 'Godparents', 'A photo with the godparents.'),
      quest('😴', 'Peaceful', 'A calm or sleeping moment.'),
      quest('👨‍👩‍👦', 'The New Family', 'Parents and child together.'),
      quest('🍰', 'The Celebration', 'Cake, food, or the gathering after.'),
      quest('😍', 'A Look of Love', 'Someone adoring the little one.'),
    ],
  },

  birthday: {
    type: 'birthday',
    name: 'Birthday',
    tagline: 'Another trip around the sun',
    description:
      'For birthdays of every age. The cake, the candles, the dancefloor and all the chaos worth remembering.',
    glyph: '🎂',
    accent: '#FF6B9D',
    gradient: ['#2E1320', '#0B0B0F'],
    coverImage: decorImage('ourmoment-birthday', 1400, 1800),
    aiPowered: false,
    priceLabel: '$69',
    defaultQuests: [
      quest('🎂', 'The Cake', 'The cake before it’s cut.'),
      quest('🕯️', 'Make a Wish', 'Blowing out the candles.'),
      quest('🎈', 'The Decor', 'Balloons, banners, or the setup.'),
      quest('🎁', 'Unwrapping', 'Opening a present.'),
      quest('🕺', 'On the Dancefloor', 'Someone dancing.'),
      quest('🤳', 'The Squad', 'A selfie with friends.'),
      quest('😂', 'Caught Laughing', 'A real, unposed laugh.'),
      quest('🥳', 'The Birthday Star', 'The guest of honour in the spotlight.'),
      quest('🍕', 'The Spread', 'The food or drinks table.'),
      quest('🌙', 'Last One Standing', 'The end of the night.'),
    ],
  },

  special: {
    type: 'special',
    name: 'Special Moments',
    tagline: 'You describe it. We’ll write the quests.',
    description:
      'For everything else — reunions, retirements, anniversaries, a Tuesday that mattered. Tell us about your party and our AI crafts a custom set of photo quests just for it.',
    glyph: '✨',
    accent: '#9B6BFF',
    gradient: ['#1F1633', '#0B0B0F'],
    coverImage: decorImage('ourmoment-special', 1400, 1800),
    aiPowered: true,
    priceLabel: '$99',
    // Fallback pack used if AI generation is unavailable; normally replaced
    // by quests generated from the host's brief.
    defaultQuests: [
      quest('✨', 'The Reason', 'A photo that captures why you’re all here.'),
      quest('👥', 'Everyone', 'Get as many people as possible in one shot.'),
      quest('😂', 'Caught Laughing', 'A genuine, unposed laugh.'),
      quest('🍽️', 'The Spread', 'The food, the drinks, the table.'),
      quest('❤️', 'A Moment of Love', 'A hug, a hand-hold, a tender look.'),
      quest('🎶', 'The Soundtrack', 'Music, dancing, or the vibe.'),
      quest('🌅', 'Best Light', 'The most beautiful light of the day.'),
      quest('🤫', 'A Secret', 'Something only the people here would understand.'),
    ],
  },
};

export const EVENT_WORLD_LIST: EventWorld[] = [
  EVENT_WORLDS.marriage,
  EVENT_WORLDS.confirmation,
  EVENT_WORLDS.baptism,
  EVENT_WORLDS.birthday,
  EVENT_WORLDS.special,
];

export function getWorld(type: EventType): EventWorld {
  return EVENT_WORLDS[type];
}
