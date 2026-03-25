export type ResourceAudience = 'student' | 'employee' | 'both';

export type Resource = {
  id: string;
  title: string;
  description: string;
  categories: string[];
  audience: ResourceAudience;
  tags: string[];
  updatedAt: number; // epoch ms
  url?: string;
};

// Note: These are example support resources for the demo app.
// Feel free to replace the URLs/descriptions with your university's actual pages.
export const RESOURCES: Resource[] = [
  {
    id: 'exam-stress',
    title: 'Exam Stress Support',
    description:
      'Practical tips, coping strategies, and short exercises for managing exam anxiety and maintaining focus.',
    categories: ['Academic Support', 'Mental Health'],
    audience: 'both',
    tags: ['exam', 'stress', 'anxiety', 'studying', 'coping', 'focus'],
    updatedAt: new Date('2026-02-10').getTime(),
    url: 'https://www.wikihow.com/Reduce-Stress',
  },
  {
    id: 'sleep-habits',
    title: 'Sleep Habits for Students & Staff',
    description: 'Simple routines and mindset changes to improve sleep quality during busy periods.',
    categories: ['Physical Wellbeing'],
    audience: 'both',
    tags: ['sleep', 'routine', 'recovery', 'rest', 'wellbeing'],
    updatedAt: new Date('2026-01-25').getTime(),
    url: 'https://www.sleepfoundation.org/',
  },
  {
    id: 'mindfulness-guides',
    title: 'Mindfulness & Grounding Guides',
    description: 'Guided techniques for staying present, reducing rumination, and rebuilding calm.',
    categories: ['Mental Health'],
    audience: 'both',
    tags: ['mindfulness', 'grounding', 'breathing', 'calm', 'anxiety'],
    updatedAt: new Date('2026-02-26').getTime(),
    url: 'https://www.headspace.com/',
  },
  {
    id: 'homesickness',
    title: 'Homesickness Resources',
    description:
      'Support for adjusting to new surroundings: connection ideas, communication tips, and coping plans.',
    categories: ['Community', 'Mental Health'],
    audience: 'student',
    tags: ['homesickness', 'adjustment', 'belonging', 'transition', 'support'],
    updatedAt: new Date('2026-01-30').getTime(),
    url: 'https://www.betterhelp.com/advice/therapy/how-to-handle-homesickness/',
  },
  {
    id: 'study-planning',
    title: 'Study Planning Toolkit',
    description:
      'Learn how to break goals into smaller steps, schedule realistic study sessions, and track progress.',
    categories: ['Academic Support'],
    audience: 'student',
    tags: ['study', 'planning', 'time management', 'productivity', 'goals'],
    updatedAt: new Date('2026-03-01').getTime(),
    url: 'https://www.wikihow.com/Study-Smarter',
  },
  {
    id: 'work-life-balance',
    title: 'Work-Life Balance for University Staff',
    description:
      'Strategies for workload planning, boundary-setting, and burnout prevention in a busy academic environment.',
    categories: ['Physical Wellbeing', 'Mental Health'],
    audience: 'employee',
    tags: ['work-life', 'balance', 'burnout', 'stress', 'boundaries'],
    updatedAt: new Date('2026-02-05').getTime(),
    url: 'https://www.indeed.com/career-advice/career-development/work-life-balance',
  },
  {
    id: 'crisis-support',
    title: 'Immediate Help (Crisis Support)',
    description:
      'If you are in danger or need immediate support, contact emergency services or a crisis hotline right away.',
    categories: ['Safety & Crisis'],
    audience: 'both',
    tags: ['crisis', 'urgent', 'danger', 'emergency', 'help'],
    updatedAt: new Date('2026-03-10').getTime(),
    url: 'https://en.wikipedia.org/wiki/List_of_hotlines_for_suicide_prevention',
  },
  {
    id: 'financial-guidance',
    title: 'Financial Guidance & Student Support',
    description:
      'Information on assistance options, budgeting tips, and where to get help if finances are impacting wellbeing.',
    categories: ['Financial', 'Community'],
    audience: 'student',
    tags: ['financial', 'budget', 'support', 'assistance'],
    updatedAt: new Date('2026-02-15').getTime(),
    url: 'https://www.investopedia.com/personal-finance-4427763',
  },
  {
    id: 'inclusion-accessibility',
    title: 'Inclusion & Accessibility Support',
    description:
      'Resources for accommodations, inclusive learning, and support pathways for students and staff.',
    categories: ['Community'],
    audience: 'both',
    tags: ['inclusion', 'accessibility', 'accommodations', 'support'],
    updatedAt: new Date('2026-01-18').getTime(),
    url: 'https://www.hhs.gov/civil-rights/for-individuals/disability/index.html',
  },
  {
    id: 'stress-management',
    title: 'Stress Management Exercises',
    description: 'Short techniques you can use in 1–5 minutes to lower stress and improve emotional regulation.',
    categories: ['Mental Health', 'Physical Wellbeing'],
    audience: 'both',
    tags: ['stress', 'exercise', 'breathing', 'regulation', 'calm'],
    updatedAt: new Date('2026-02-22').getTime(),
    url: 'https://www.mind.org.uk/',
  },
];

