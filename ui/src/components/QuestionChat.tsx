import { useState } from 'react';
import { ArrowBigUp, Send } from 'lucide-react';
import { useQuestionChatQuery } from '../hooks/useQuestionChatQuery';
import { useRoom } from '../hooks/useRoom';
import ErrorView from '../views/ErrorView';

type QuestionChatProps = {
  questionId: string;
};

// TODO(roadmap #5, identity/roles): replace with a persisted anonymous user name.
const CURRENT_USER_NAME = 'You';

const QuestionChat = ({ questionId }: QuestionChatProps) => {
  const {
    questionChatQuery,
    createChatQuestionMutation,
    voteChatQuestionMutation,
  } = useQuestionChatQuery(questionId);
  const { data, isLoading, isError } = questionChatQuery;

  const [draft, setDraft] = useState('');

  useRoom(questionId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    createChatQuestionMutation.mutate({
      author: CURRENT_USER_NAME,
      content: trimmed,
    });
    setDraft('');
  };

  const handleUpvote = (id: string) => {
    voteChatQuestionMutation.mutate(id);
  };

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const sortedChatQuestions = [...(data?.chatQuestions ?? [])].sort(
    (a, b) => b.votes - a.votes,
  );

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Live Questions</h3>

      <ul className="flex flex-col gap-2">
        {sortedChatQuestions.map((question) => (
          <li
            key={question.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
          >
            <div>
              <p className="text-sm text-foreground">{question.content}</p>
              <p className="text-xs text-muted-foreground">{question.author}</p>
            </div>
            <button
              type="button"
              onClick={() => handleUpvote(question.id)}
              aria-label="Upvote question"
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowBigUp className="h-4 w-4" />
              {question.votes}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Post question"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default QuestionChat;
