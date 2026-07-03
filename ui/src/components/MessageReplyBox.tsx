import { useState } from 'react';
import { Send } from 'lucide-react';

type MessageReplyBoxProps = {
  onSend: (content: string) => void;
};

const MessageReplyBox = ({ onSend }: MessageReplyBoxProps) => {
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Write a reply..."
        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!draft.trim()}
        aria-label="Send reply"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
};

export default MessageReplyBox;
