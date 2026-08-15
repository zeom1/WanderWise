/* ===========================================================
   Travel Personalities, Radar weights, Travel DNA templates
   Source: WanderWise Master Documentation, Chapters 4 & 5
   =========================================================== */

const PERSONALITIES = [
  {
    key: 'Explorer',
    name: 'The Explorer',
    emoji: '🧭',
    color: '#f97316',
    description: 'Thrives on adventure, uncertainty and challenges.',
    strengths: ['Brave', 'Adaptable', 'Energetic'],
    weaknesses: ['Impulsive', 'Restless'],
    ideal: ['Ladakh', 'Patagonia', 'Nepal'],
  },
  {
    key: 'Culture',
    name: 'The Culture Seeker',
    emoji: '🏛️',
    color: '#d97706',
    description: 'Travels to learn history, traditions and art.',
    strengths: ['Curious', 'Respectful', 'Observant'],
    weaknesses: ['Overplans'],
    ideal: ['Kyoto', 'Rome', 'Varanasi'],
  },
  {
    key: 'Beach',
    name: 'The Beach Dreamer',
    emoji: '🏖️',
    color: '#06b6d4',
    description: 'Finds peace by the sea.',
    strengths: ['Calm', 'Optimistic'],
    weaknesses: ['Avoids rushed trips'],
    ideal: ['Maldives', 'Goa', 'Bali'],
  },
  {
    key: 'Urban',
    name: 'The Urban Explorer',
    emoji: '🏙️',
    color: '#8b5cf6',
    description: 'Loves modern cities and nightlife.',
    strengths: ['Social', 'Adaptable'],
    weaknesses: ['Can burn out'],
    ideal: ['Tokyo', 'Seoul', 'New York'],
  },
  {
    key: 'Nature',
    name: 'The Nature Lover',
    emoji: '🌲',
    color: '#16a34a',
    description: 'Feels recharged outdoors.',
    strengths: ['Patient', 'Mindful'],
    weaknesses: ['Avoids crowds'],
    ideal: ['Norway', 'Himachal', 'Banff'],
  },
  {
    key: 'Foodie',
    name: 'The Foodie Traveler',
    emoji: '🍜',
    color: '#ef4444',
    description: 'Explores through cuisine.',
    strengths: ['Open-minded', 'Adventurous'],
    weaknesses: ['Plans around food'],
    ideal: ['Osaka', 'Bangkok', 'Istanbul'],
  },
  {
    key: 'Luxury',
    name: 'The Luxury Escapist',
    emoji: '💎',
    color: '#ec4899',
    description: 'Values comfort and premium experiences.',
    strengths: ['Refined', 'Organized'],
    weaknesses: ['Less spontaneous'],
    ideal: ['Swiss Alps', 'Dubai'],
  },
  {
    key: 'Budget',
    name: 'The Budget Backpacker',
    emoji: '🎒',
    color: '#14b8a6',
    description: 'Believes experiences matter more than luxury.',
    strengths: ['Resourceful', 'Independent'],
    weaknesses: ['Sacrifices comfort'],
    ideal: ['Vietnam', 'Nepal'],
  },
  {
    key: 'Social',
    name: 'The Social Traveler',
    emoji: '🎉',
    color: '#eab308',
    description: 'Travels for people and memories.',
    strengths: ['Friendly', 'Outgoing'],
    weaknesses: ['Needs company'],
    ideal: ['Barcelona', 'Rio'],
  },
  {
    key: 'Slow',
    name: 'The Slow Wanderer',
    emoji: '🍃',
    color: '#0ea5e9',
    description: 'Prefers depth over speed.',
    strengths: ['Reflective', 'Patient'],
    weaknesses: ['May skip famous spots'],
    ideal: ['Tuscany', 'Kerala'],
  },
];

const PERSONALITY_MAP = Object.fromEntries(PERSONALITIES.map(p => [p.key, p]));
const PERSONALITY_EMOJI = Object.fromEntries(PERSONALITIES.map(p => [p.key, p.emoji]));
const PERSONALITY_COLOR = Object.fromEntries(PERSONALITIES.map(p => [p.key, p.color]));

/* Radar categories, per Chapter 5 */
const RADAR_CATEGORIES = ['Adventure', 'Culture', 'Nature', 'Relaxation', 'Urban', 'Luxury', 'Budget', 'Social'];

const RADAR_WEIGHTS = {
  Explorer: { Adventure: 95, Culture: 40, Nature: 70, Relaxation: 20, Urban: 25, Luxury: 15, Budget: 55, Social: 40 },
  Culture: { Adventure: 35, Culture: 95, Nature: 40, Relaxation: 40, Urban: 45, Luxury: 40, Budget: 45, Social: 35 },
  Beach: { Adventure: 30, Culture: 30, Nature: 50, Relaxation: 90, Urban: 20, Luxury: 60, Budget: 35, Social: 40 },
  Urban: { Adventure: 40, Culture: 45, Nature: 15, Relaxation: 25, Urban: 95, Luxury: 55, Budget: 35, Social: 70 },
  Nature: { Adventure: 55, Culture: 30, Nature: 95, Relaxation: 60, Urban: 10, Luxury: 25, Budget: 50, Social: 25 },
  Foodie: { Adventure: 35, Culture: 55, Nature: 25, Relaxation: 45, Urban: 65, Luxury: 55, Budget: 45, Social: 55 },
  Luxury: { Adventure: 20, Culture: 45, Nature: 30, Relaxation: 75, Urban: 55, Luxury: 95, Budget: 10, Social: 40 },
  Budget: { Adventure: 60, Culture: 50, Nature: 55, Relaxation: 30, Urban: 35, Luxury: 5, Budget: 95, Social: 50 },
  Social: { Adventure: 40, Culture: 40, Nature: 20, Relaxation: 35, Urban: 60, Luxury: 40, Budget: 45, Social: 95 },
  Slow: { Adventure: 20, Culture: 55, Nature: 55, Relaxation: 80, Urban: 25, Luxury: 45, Budget: 55, Social: 30 },
};

/* Hand-written Travel DNA interpretations for the sample combos from Chapter 5.
   Keyed by "Primary+Secondary+Hidden" (order-sensitive), with a smart generator as fallback. */
const DNA_TEMPLATES = {
  'Explorer+Nature+Culture': "You're energized by challenges but don't seek adventure for its own sake — you also crave meaning and beautiful landscapes. You'll enjoy trekking by day and exploring local traditions by evening.",
  'Urban+Foodie+Social': "You travel for experiences, conversations, and unforgettable meals. Your ideal trip includes lively streets, local cafés, festivals, and meeting new people.",
  'Beach+Luxury+Slow': "You see travel as a chance to recharge. You prefer quality over quantity, relaxed itineraries, scenic stays, and peaceful destinations.",
  'Budget+Explorer+Nature': "You value freedom over comfort. You're resourceful, flexible, and happiest discovering hidden gems on a modest budget.",
};

const TRAIT_LINES = {
  motivation: {
    Explorer: 'pushing past your comfort zone', Culture: 'understanding how other people live', Beach: 'letting the world slow down around you',
    Urban: 'soaking up the energy of a new city', Nature: 'reconnecting with the outdoors', Foodie: 'tasting your way through a place',
    Luxury: 'being fully looked after', Budget: 'proving a great trip doesn’t need a big budget', Social: 'the people you meet along the way', Slow: 'noticing the small details others rush past',
  },
  pace: {
    Explorer: 'fast and unpredictable', Culture: 'deliberate, with room to go deep', Beach: 'unhurried', Urban: 'packed and buzzing',
    Nature: 'slow and observant', Foodie: 'built around meals, not clocks', Luxury: 'comfortably paced', Budget: 'flexible and improvised',
    Social: 'social and spontaneous', Slow: 'as slow as it can possibly go',
  },
  companions: {
    Explorer: 'fellow thrill-seekers', Culture: 'curious, patient travel partners', Beach: 'a partner or close friend', Urban: 'a small group of friends',
    Nature: 'a quiet companion or solo', Foodie: 'someone who’ll try anything on the menu', Luxury: 'a partner, for a shared indulgence',
    Budget: 'other backpackers you meet on the road', Social: 'a group — the bigger the better', Slow: 'yourself, or one kindred spirit',
  },
};

function dnaKey(primary, secondary, hidden) {
  return `${primary}+${secondary}+${hidden}`;
}

function generateDnaInterpretation(primary, secondary, hidden) {
  const key = dnaKey(primary, secondary, hidden);
  if (DNA_TEMPLATES[key]) return DNA_TEMPLATES[key];

  const p = PERSONALITY_MAP[primary], s = PERSONALITY_MAP[secondary], h = PERSONALITY_MAP[hidden];
  const stripThe = (name) => name.toLowerCase().replace(/^the /, '');
  return `At heart, you travel for ${TRAIT_LINES.motivation[primary]} — that's your ${stripThe(p.name)} side leading the way. ` +
    `A streak of ${stripThe(s.name)} in you means you're also drawn to trips that let you be ${s.strengths[0].toLowerCase()}, ` +
    `while a quieter ${stripThe(h.name)} instinct shows up when no one's looking — a pull toward ${TRAIT_LINES.motivation[hidden]}. ` +
    `Expect your best trips to feel ${TRAIT_LINES.pace[primary]}, best shared with ${TRAIT_LINES.companions[primary]}.`;
}

/* Optional Zodiac Insight — light, non-scientific fun addon. Never affects quiz results. */
const ZODIAC_TRAVEL = {
  Aries: 'You book first and plan later — first-class energy for spontaneous escapes.',
  Taurus: 'You want comfort and good food wherever you land — no rough camping for you.',
  Gemini: 'You can’t pick one destination, so you try to see three cities in one trip.',
  Cancer: 'Home comforts matter — you look for cozy stays that feel personal.',
  Leo: 'You want the trip that makes the best story — and the best photos.',
  Virgo: 'You’ve read every review before booking a single thing.',
  Libra: 'Beautiful, balanced, aesthetic destinations pull you in every time.',
  Scorpio: 'You’re drawn to places with depth, mystery, and a little edge.',
  Sagittarius: 'The eternal wanderer — always plotting the next border to cross.',
  Capricorn: 'You travel with a plan, a budget, and a spreadsheet — and you enjoy it.',
  Aquarius: 'You want the destination no one else has heard of yet.',
  Pisces: 'You travel to feel something — sunsets, oceans, quiet, all of it.',
};
