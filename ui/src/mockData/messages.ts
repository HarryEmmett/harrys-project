// Placeholder data until the messages service exists (see
// shared/friends-messages-service-plan.md) — keyed by friend id from
// mockData/friends.ts.

export type Message = {
  id: string;
  author: 'me' | 'them';
  authorName: string;
  content: string;
  sentAt: string;
};

export const mockMessagesByFriendId: Record<string, Message[]> = {
  'friend-1': [
    {
      id: 'm1',
      author: 'them',
      authorName: 'Alex Morgan',
      content: 'Hey! Are you coming to the event later?',
      sentAt: '09:12',
    },
    {
      id: 'm2',
      author: 'me',
      authorName: 'You',
      content: 'Yep, on my way now!',
      sentAt: '09:14',
    },
  ],
  'friend-2': [
    {
      id: 'm1',
      author: 'them',
      authorName: 'Jamie Lee',
      content: 'Let me know when you’re free to catch up.',
      sentAt: 'Yesterday',
    },
  ],
};
