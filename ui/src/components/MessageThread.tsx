import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';
import type { MessageResponse } from '@harrys-project/shared/apiSchema';
import { useFriendsQuery } from '../hooks/useFriendsQuery';
import { useMessagesQuery } from '../hooks/useMessagesQuery';
import ErrorView from '../views/ErrorView';
import MessageReplyBox from './MessageReplyBox';

type MessageThreadProps = {
  id: string;
};

const MessageThread = ({ id }: MessageThreadProps) => {
  const { friendsQuery } = useFriendsQuery();
  const friend = friendsQuery.data?.friends.find((f) => f.id === id);

  const { messagesQuery } = useMessagesQuery(id);
  const { data, isLoading, isError } = messagesQuery;

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const nextMessageIdRef = useRef(1);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (data && !isInitializedRef.current) {
      setMessages(data.messages);
      nextMessageIdRef.current = data.messages.length + 1;
      isInitializedRef.current = true;
    }
  }, [data]);

  const handleSend = (content: string) => {
    const newMessage: MessageResponse = {
      id: `m${nextMessageIdRef.current++}`,
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

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

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
