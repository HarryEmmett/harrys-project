import type { QuestionResponse } from '@harrys-project/shared/apiSchema';
import QuestionChat from './QuestionChat';

type QuestionDetailProps = {
  id: string;
};

// Placeholder data until the question-detail API is wired up
const mockQuestion: QuestionResponse = {
  id: 'q1',
  userId: 'user_001',
  content: "What's the biggest challenge you've faced building this feature?",
  votes: 12,
  answered: false,
  createdAt: '2026-07-01T09:00:00Z',
};

const QuestionDetail = ({ id }: QuestionDetailProps) => {
  return (
    <div className="w-full max-w-xl p-2 text-left">
      <p className="text-xs text-muted-foreground">Question #{id}</p>
      <div className="mt-2 rounded-lg border border-border bg-card p-5">
        <p className="text-base text-foreground">{mockQuestion.content}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{mockQuestion.votes} votes</span>
          {mockQuestion.answered && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              Answered
            </span>
          )}
        </div>
      </div>

      <QuestionChat />
    </div>
  );
};

export default QuestionDetail;
