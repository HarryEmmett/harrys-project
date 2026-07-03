export type Friend = {
  id: string;
  name: string;
  email: string;
  bio: string;
  isOnline: boolean;
};

// Mock data until a real friends/presence endpoint exists
export const friends: Friend[] = [
  {
    id: '1',
    name: 'Ava Thompson',
    email: 'ava.thompson@example.com',
    bio: 'Frontend engineer, loves a good Q&A session.',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Liam Chen',
    email: 'liam.chen@example.com',
    bio: 'Always the first to ask a follow-up question.',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    bio: 'Product manager, here for the live polls.',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Noah Garcia',
    email: 'noah.garcia@example.com',
    bio: 'Usually lurking, occasionally upvoting.',
    isOnline: false,
  },
  {
    id: '5',
    name: 'Sofia Rossi',
    email: 'sofia.rossi@example.com',
    bio: 'Runs the Friday demo sessions.',
    isOnline: false,
  },
];
