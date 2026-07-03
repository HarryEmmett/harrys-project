import { Link } from '@tanstack/react-router';
import { ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import type { QuestionResponse } from '@harrys-project/shared/apiSchema';

type QuestionCardProps = {
  question: QuestionResponse;
  onDelete: (id: string) => void;
  onVote: (id: string, delta: 1 | -1) => void;
};

const QuestionCard = ({ question, onDelete, onVote }: QuestionCardProps) => {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left">
      <div>
        <Link
          to="/question/$id"
          params={{ id: question.id }}
          className="text-sm text-foreground hover:underline"
        >
          {question.content}
        </Link>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onVote(question.id, 1)}
              aria-label="Like question"
              className="rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <span>{question.votes}</span>
            <button
              type="button"
              onClick={() => onVote(question.id, -1)}
              aria-label="Dislike question"
              className="rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
          {question.answered && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              Answered
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(question.id)}
        aria-label="Delete question"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
};

export default QuestionCard;
