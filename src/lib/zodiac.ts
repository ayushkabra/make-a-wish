// ─── makeawish — Zodiac Data & Helpers ───────────────────────────────────────

import type { ZodiacSign } from '@/types'

// ─── Zodiac signs (13 entries — Capricorn appears twice) ──────────────────────

export const ZODIAC: ZodiacSign[] = [
  {
    end: [1, 19],
    sign: 'Capricorn',
    icon: '♑',
    dates: 'Dec 22 – Jan 19',
    trait:
      'Disciplined and quietly ambitious. You do the work when no one is watching — and it shows.',
    facts: [
      'At 27, Isaac Newton had already laid the foundation of calculus.',
      'At this age, Elon Musk was building his first company.',
    ],
  },
  {
    end: [2, 18],
    sign: 'Aquarius',
    icon: '♒',
    dates: 'Jan 20 – Feb 18',
    trait:
      'A natural original. You think in systems others can\'t yet see, and you genuinely care about people you\'ve never met.',
    facts: [
      'At 27, Rosa Parks was quietly laying the groundwork for change.',
      'Edison\'s most experimental years started right around this age.',
    ],
  },
  {
    end: [3, 20],
    sign: 'Pisces',
    icon: '♓',
    dates: 'Feb 19 – Mar 20',
    trait:
      'Known for deep empathy and a rare ability to make others feel truly seen.',
    facts: [
      'At 27, Sylvia Plath wrote her first novel.',
      'Einstein published special relativity at 26.',
    ],
  },
  {
    end: [4, 19],
    sign: 'Aries',
    icon: '♈',
    dates: 'Mar 21 – Apr 19',
    trait: 'Bold and instinctive. You start things others only think about.',
    facts: [
      'Lady Gaga released her debut album at 22.',
      'Steve Jobs co-founded Apple at 21.',
    ],
  },
  {
    end: [5, 20],
    sign: 'Taurus',
    icon: '♉',
    dates: 'Apr 20 – May 20',
    trait:
      'Grounded, patient, and deeply loyal. You feel things slowly but they last.',
    facts: [
      'At 27, Frida Kahlo began her most celebrated paintings.',
      'Adele won 6 Grammys at 25.',
    ],
  },
  {
    end: [6, 20],
    sign: 'Gemini',
    icon: '♊',
    dates: 'May 21 – Jun 20',
    trait:
      'Quick-minded and endlessly curious. You can hold two opposite ideas at once.',
    facts: [
      'Paul McCartney wrote "Yesterday" at 22.',
      'At 27, Nikola Tesla had just filed his first major patents.',
    ],
  },
  {
    end: [7, 22],
    sign: 'Cancer',
    icon: '♋',
    dates: 'Jun 21 – Jul 22',
    trait:
      'Deeply intuitive and quietly fierce. You protect the people you love.',
    facts: [
      'J.K. Rowling began writing Harry Potter at 25.',
      'Nelson Mandela started his law practice at 26.',
    ],
  },
  {
    end: [8, 22],
    sign: 'Leo',
    icon: '♌',
    dates: 'Jul 23 – Aug 22',
    trait: 'Warm, magnetic, and generous. When you walk in, the room shifts.',
    facts: [
      'Usain Bolt broke the world record at 21.',
      'Obama was 34 when he first ran for office.',
    ],
  },
  {
    end: [9, 22],
    sign: 'Virgo',
    icon: '♍',
    dates: 'Aug 23 – Sep 22',
    trait: 'Precise and deeply caring. You notice what others miss.',
    facts: [
      'Agatha Christie published her first novel at 30.',
      'Tim Berners-Lee invented the World Wide Web at 34.',
    ],
  },
  {
    end: [10, 22],
    sign: 'Libra',
    icon: '♎',
    dates: 'Sep 23 – Oct 22',
    trait: 'Balanced and deeply fair-minded. You see every side.',
    facts: [
      'Gandhi launched his first major peaceful protest at 24.',
      'Malala Yousafzai became the world\'s youngest Nobel laureate at 17.',
    ],
  },
  {
    end: [11, 21],
    sign: 'Scorpio',
    icon: '♏',
    dates: 'Oct 23 – Nov 21',
    trait:
      'Intense and unshakeable. Once you set your mind on something, the world gets out of your way.',
    facts: [
      'Marie Curie began her Nobel Prize-winning research in her late 20s.',
      'At 27, Picasso entered his most transformative artistic period.',
    ],
  },
  {
    end: [12, 21],
    sign: 'Sagittarius',
    icon: '♐',
    dates: 'Nov 22 – Dec 21',
    trait: 'Freedom-seeking and wildly optimistic. You see what\'s possible.',
    facts: [
      'Taylor Swift released "Fearless" at 19.',
      'Carl Sagan was dreaming of other galaxies at 27.',
    ],
  },
  {
    end: [12, 31],
    sign: 'Capricorn',
    icon: '♑',
    dates: 'Dec 22 – Jan 19',
    trait:
      'Disciplined and quietly ambitious. You do the work when no one is watching.',
    facts: [
      'Benjamin Franklin founded the first public library at 26.',
      'At 27, Isaac Newton had already discovered calculus.',
    ],
  },
]

/**
 * Returns the zodiac sign for a given birth month and day.
 * month is 1-indexed (1 = January … 12 = December).
 */
export interface ZodiacDisplaySign extends ZodiacSign {
  /** Alias for icon — used by UI components */
  emoji: string
  /** Alias for sign — used by UI components */
  name: string
  /** First fact from facts array */
  fact: string
}

export function getZodiac(month: number, day: number): ZodiacDisplaySign {
  for (const z of ZODIAC) {
    if (month < z.end[0] || (month === z.end[0] && day <= z.end[1])) {
      return { ...z, emoji: z.icon, name: z.sign, fact: z.facts[0] }
    }
  }
  // Fallback — should never be reached given the full 12-31 entry above
  const last = ZODIAC[ZODIAC.length - 1]
  return { ...last, emoji: last.icon, name: last.sign, fact: last.facts[0] }
}

// ─── One-tap wish messages ────────────────────────────────────────────────────

export const ONETAPS: string[] = [
  '🎂 Happy birthday! Hope today is as wonderful as you are.',
  '🎉 Wishing you the happiest of birthdays and a year full of magic!',
  '✨ Another trip around the sun — cheers to you and everything ahead!',
  '🌟 Happy birthday! May this year bring you everything you deserve.',
]

// ─── Writing prompts ─────────────────────────────────────────────────────────

export const PROMPTS: string[] = [
  'What\'s one thing you hope they experience this year?',
  'Share a quality about them that the world needs more of.',
  'What adventure do you wish for them in the year ahead?',
  'If you could give them any superpower for the next year, what would it be?',
]

// ─── Karma messages (shown after sending a wish) ─────────────────────────────

export const KARMA: string[] = [
  '✨ Good karma incoming — you just made someone\'s day.',
  '🌈 The universe noticed that. You\'re officially one of the good ones.',
  '🎉 You just added a little more joy to the world. Well done.',
  '💫 Birthday energy is contagious — expect great things headed your way.',
]
