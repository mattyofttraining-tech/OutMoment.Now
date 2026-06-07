/**
 * Server-side curated quest packs (the source of truth for created events).
 * Mirrors the client copy in src/data/eventWorlds.ts — keep them roughly in sync.
 */
export interface PackQuest {
  icon: string;
  title: string;
  prompt: string;
}

export const QUEST_PACKS: Record<string, PackQuest[]> = {
  marriage: [
    { icon: '💍', title: 'The Rings', prompt: 'A close-up of the rings before they’re worn.' },
    { icon: '👰', title: 'First Look', prompt: 'The moment they see each other.' },
    { icon: '🥂', title: 'A Toast', prompt: 'Someone raising a glass.' },
    { icon: '💃', title: 'First Dance', prompt: 'The couple’s first dance together.' },
    { icon: '😭', title: 'Happy Tears', prompt: 'Catch someone crying with joy.' },
    { icon: '👠', title: 'The Details', prompt: 'Shoes, flowers, or the dress up close.' },
    { icon: '🎉', title: 'The Exit', prompt: 'Confetti, sparklers, or the getaway car.' },
    { icon: '👨‍👩‍👧', title: 'The Generations', prompt: 'Three generations of family in one frame.' },
    { icon: '😂', title: 'Caught Laughing', prompt: 'A genuine, unposed laugh.' },
    { icon: '🌅', title: 'Golden Hour', prompt: 'A portrait in the best light of the day.' },
  ],
  confirmation: [
    { icon: '✝️', title: 'The Ceremony', prompt: 'A photo from inside the service.' },
    { icon: '🕯️', title: 'The Candle', prompt: 'Light, candles, or stained glass.' },
    { icon: '👔', title: 'All Dressed Up', prompt: 'The guest of honour in their outfit.' },
    { icon: '🍽️', title: 'The Family Table', prompt: 'Everyone gathered to eat.' },
    { icon: '🎁', title: 'A Gift', prompt: 'Opening or holding a present.' },
    { icon: '👵', title: 'With Grandparents', prompt: 'A photo with the eldest guests.' },
    { icon: '🥂', title: 'A Speech', prompt: 'Someone giving a toast or speech.' },
    { icon: '😊', title: 'The Proud Parent', prompt: 'A parent’s proud face.' },
    { icon: '📸', title: 'The Group Shot', prompt: 'As many people as you can fit.' },
  ],
  baptism: [
    { icon: '🕊️', title: 'The Blessing', prompt: 'A photo from the ceremony.' },
    { icon: '👶', title: 'Tiny Hands', prompt: 'A close-up of little hands or feet.' },
    { icon: '💧', title: 'The Water', prompt: 'The font, water, or the moment itself.' },
    { icon: '🤍', title: 'The Gown', prompt: 'The christening outfit in detail.' },
    { icon: '🧑‍🤝‍🧑', title: 'Godparents', prompt: 'A photo with the godparents.' },
    { icon: '😴', title: 'Peaceful', prompt: 'A calm or sleeping moment.' },
    { icon: '👨‍👩‍👦', title: 'The New Family', prompt: 'Parents and child together.' },
    { icon: '🍰', title: 'The Celebration', prompt: 'Cake, food, or the gathering after.' },
    { icon: '😍', title: 'A Look of Love', prompt: 'Someone adoring the little one.' },
  ],
  birthday: [
    { icon: '🎂', title: 'The Cake', prompt: 'The cake before it’s cut.' },
    { icon: '🕯️', title: 'Make a Wish', prompt: 'Blowing out the candles.' },
    { icon: '🎈', title: 'The Decor', prompt: 'Balloons, banners, or the setup.' },
    { icon: '🎁', title: 'Unwrapping', prompt: 'Opening a present.' },
    { icon: '🕺', title: 'On the Dancefloor', prompt: 'Someone dancing.' },
    { icon: '🤳', title: 'The Squad', prompt: 'A selfie with friends.' },
    { icon: '😂', title: 'Caught Laughing', prompt: 'A real, unposed laugh.' },
    { icon: '🥳', title: 'The Birthday Star', prompt: 'The guest of honour in the spotlight.' },
    { icon: '🍕', title: 'The Spread', prompt: 'The food or drinks table.' },
    { icon: '🌙', title: 'Last One Standing', prompt: 'The end of the night.' },
  ],
  special: [
    { icon: '✨', title: 'The Reason', prompt: 'A photo that captures why you’re all here.' },
    { icon: '👥', title: 'Everyone', prompt: 'Get as many people as possible in one shot.' },
    { icon: '😂', title: 'Caught Laughing', prompt: 'A genuine, unposed laugh.' },
    { icon: '🍽️', title: 'The Spread', prompt: 'The food, the drinks, the table.' },
    { icon: '❤️', title: 'A Moment of Love', prompt: 'A hug, a hand-hold, a tender look.' },
    { icon: '🎶', title: 'The Soundtrack', prompt: 'Music, dancing, or the vibe.' },
    { icon: '🌅', title: 'Best Light', prompt: 'The most beautiful light of the day.' },
    { icon: '🤫', title: 'A Secret', prompt: 'Something only the people here would understand.' },
  ],
};

const WORDS: Record<string, string[]> = {
  marriage: ['SUNSET', 'FOREVER', 'VOWS', 'GOLDEN', 'EVERAFTER', 'LINEN'],
  confirmation: ['GRACE', 'MILESTONE', 'CANDLE', 'PROMISE', 'HARBOR'],
  baptism: ['DOVE', 'STILLWATER', 'DAWN', 'CRADLE', 'WILLOW'],
  birthday: ['CONFETTI', 'SPARK', 'WISH', 'PARADE', 'NEON', 'CITRUS'],
  special: ['MOMENT', 'AURORA', 'EMBER', 'COMPASS', 'LANTERN', 'TIDE'],
};

export function makeJoinCode(type: string): string {
  const words = WORDS[type] ?? WORDS.special;
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${digits}`;
}

const COVERS: Record<string, string> = {
  marriage: 'https://picsum.photos/seed/ourmoment-wedding/1400/1800',
  confirmation: 'https://picsum.photos/seed/ourmoment-confirmation/1400/1800',
  baptism: 'https://picsum.photos/seed/ourmoment-baptism/1400/1800',
  birthday: 'https://picsum.photos/seed/ourmoment-birthday/1400/1800',
  special: 'https://picsum.photos/seed/ourmoment-special/1400/1800',
};

export function coverFor(type: string): string {
  return COVERS[type] ?? COVERS.special;
}
