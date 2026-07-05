import { useQuestionQuery } from '../hooks/useQuestionQuery';
import ErrorView from '../views/ErrorView';
import QuestionChat from './QuestionChat';

type QuestionDetailProps = {
  id: string;
};

const QuestionDetail = ({ id }: QuestionDetailProps) => {
  const { questionQuery, closeQuestionMutation } = useQuestionQuery(id);
  const { data: question, isLoading, isError } = questionQuery;

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;
  if (!question) return null;

  return (
    <div className="w-full max-w-xl p-2 text-left">
      <p className="text-xs text-muted-foreground">Question #{id}</p>
      <div className="mt-2 rounded-lg border border-border bg-card p-5">
        <p className="text-base text-foreground">{question.content}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{question.votes} votes</span>
            {question.answered && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                Answered
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => closeQuestionMutation.mutate()}
            disabled={closeQuestionMutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {question.answered ? 'Reopen Question' : 'Close Question'}
          </button>
        </div>
      </div>

      <QuestionChat questionId={id} />
    </div>
  );
};

export default QuestionDetail;
