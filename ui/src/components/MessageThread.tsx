import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { useFriendsQuery } from '../hooks/useFriendsQuery';
import MessageReplyBox from './MessageReplyBox';

type Message = {
  id: string;
  author: 'me' | 'them';
  authorName: string;
  content: string;
  sentAt: string;
};

// Placeholder data until the messages API is wired up
const initialMessages: Message[] = [
  {
    id: 'm1',
    author: 'me',
    authorName: 'You',
    content: 'Hey, are you joining the session later?',
    sentAt: '10:02 AM',
  },
  {
    id: 'm2',
    author: 'them',
    authorName: 'Ava Thompson',
    content: 'Yep, see you there!',
    sentAt: '10:03 AM',
  },
];

let nextMessageId = initialMessages.length + 1;

type MessageThreadProps = {
  id: string;
};

const MessageThread = ({ id }: MessageThreadProps) => {
  const [messages, setMessages] = useState(initialMessages);
  const { friendsQuery } = useFriendsQuery();
  const friend = friendsQuery.data?.friends.find((f) => f.id === id);

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: `m${nextMessageId++}`,
      author: 'me',
      authorName: 'You',
      content,
      sentAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 p-2 text-left">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {friend ? `Conversation with ${friend.name}` : `Conversation #${id}`}
        </p>
        <Link
          to="/profile/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="h-3.5 w-3.5" />
          View Profile
        </Link>
      </div>
      {messages.map((message) => {
        const isMe = message.author === 'me';
        return (
          <div
            key={message.id}
            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                isMe
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {message.content}
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              {message.authorName} &middot; {message.sentAt}
            </span>
          </div>
        );
      })}

      <MessageReplyBox onSend={handleSend} />
    </div>
  );
};

export default MessageThread;
