import type { EventWorld, EventType } from '@/types';
import { EVENT_COVERS } from './media';

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
    tagline: 'The moments your photographer will miss',
    description:
      'Your photographer captures the shots you posed for. OurMoment captures everything else — the happy tears, the 1am dance floor, the toast that stole the night — seen through the eyes of everyone who showed up. You’ll experience your own wedding for the first time.',
    glyph: '💍',
    accent: '#C9A227',
    gradient: ['#2A2113', '#0B0B0F'],
    coverImage: EVENT_COVERS.marriage,
    aiPowered: false,
    basePrice: 79,
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
    tagline: 'One milestone. A hundred points of view.',
    description:
      'The proud glances, the whole family around the table, the quiet moment that mattered most. Hand every guest a camera and relive the day from every seat in the room.',
    glyph: '✝️',
    accent: '#6C7BD6',
    gradient: ['#171A2E', '#0B0B0F'],
    coverImage: EVENT_COVERS.confirmation,
    aiPowered: false,
    basePrice: 49,
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
    tagline: 'They won’t remember it. You’ll never forget it.',
    description:
      'Tiny hands, godparents’ smiles, the people who showed up for the very beginning — gathered into one tender gallery before the day slips away.',
    glyph: '🕊️',
    accent: '#5BB8C4',
    gradient: ['#102A2D', '#0B0B0F'],
    coverImage: EVENT_COVERS.baptism,
    aiPowered: false,
    basePrice: 49,
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
    tagline: 'The party, captured by the people in it.',
    description:
      'The cake, the crowd, the surprise on their face — caught from every angle by everyone there. No more begging friends to “send me that photo.” It’s all already here.',
    glyph: '🎂',
    accent: '#FF6B9D',
    gradient: ['#2E1320', '#0B0B0F'],
    coverImage: EVENT_COVERS.birthday,
    aiPowered: false,
    basePrice: 39,
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
    tagline: 'You describe the party. AI writes the quests.',
    description:
      'Reunion, retirement, anniversary, or a Tuesday that mattered — tell us about it in a sentence and our AI builds a custom set of photo missions, so nothing worth remembering goes uncaptured.',
    glyph: '✨',
    accent: '#9B6BFF',
    gradient: ['#1F1633', '#0B0B0F'],
    coverImage: EVENT_COVERS.special,
    aiPowered: true,
    basePrice: 59,
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

// Storefront order: Special Moments leads (the AI flagship — fits any occasion),
// Marriage second, then the family milestones.
export const EVENT_WORLD_LIST: EventWorld[] = [
  EVENT_WORLDS.special,
  EVENT_WORLDS.marriage,
  EVENT_WORLDS.confirmation,
  EVENT_WORLDS.baptism,
  EVENT_WORLDS.birthday,
];

export function getWorld(type: EventType): EventWorld {
  return EVENT_WORLDS[type];
}
