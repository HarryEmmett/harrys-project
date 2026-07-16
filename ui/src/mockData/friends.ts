// Placeholder data until the friends service exists (see
// shared/friends-messages-service-plan.md) — one online, one offline friend
// to link message threads to.

export type Friend = {
  id: string;
  name: string;
  email: string;
  bio: string;
  isOnline: boolean;
};

export const mockFriends: Friend[] = [
  {
    id: 'friend-1',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    bio: 'Always around for a chat.',
    isOnline: true,
  },
  {
    id: 'friend-2',
    name: 'Jamie Lee',
    email: 'jamie.lee@example.com',
    bio: 'Catches up when they can.',
    isOnline: false,
  },
];
