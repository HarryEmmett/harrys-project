import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Check, RotateCcw, Trophy, X } from 'lucide-react';
import { useGameQuery } from '../hooks/useGameQuery';
import { useGameQuestionsQuery } from '../hooks/useGameQuestionsQuery';
import { useSubmitQuizAnswers } from '../hooks/useSubmitQuizAnswers';
import ErrorView from '../views/ErrorView';

type QuizDetailProps = {
  id: string;
};

const scoreMessage = (score: number, total: number) => {
  if (total === 0) return 'No questions to score.';
  const ratio = score / total;
  if (ratio === 1) return 'Perfect score! 🎉';
  if (ratio >= 0.8) return 'Great job!';
  if (ratio >= 0.5) return 'Not bad — room to improve.';
  return 'Better luck next time!';
};

const QuizDetail = ({ id }: QuizDetailProps) => {
  const { gameQuery } = useGameQuery(id);
  const { gameQuestionsQuery } = useGameQuestionsQuery(id);
  const { submitQuizAnswersMutation } = useSubmitQuizAnswers(id);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const game = gameQuery.data;
  const quizQuestions = gameQuestionsQuery.data?.quizQuestions ?? [];
  const submission = submitQuizAnswersMutation.data;
  const resultByQuestionId = new Map(
    submission?.results.map((result) => [result.questionId, result.correct]),
  );

  const answeredCount = quizQuestions.filter(
    (quizQuestion) => selectedAnswers[quizQuestion.id] !== undefined,
  ).length;

  const handleSelectOption = (questionId: string, option: string) => {
    if (submission) return;
    setSelectedAnswers((previous) => ({ ...previous, [questionId]: option }));
  };

  const handleSubmit = () => {
    submitQuizAnswersMutation.mutate({
      answers: Object.entries(selectedAnswers).map(
        ([questionId, selectedOption]) => ({ questionId, selectedOption }),
      ),
    });
  };

  const handlePlayAgain = () => {
    setSelectedAnswers({});
    submitQuizAnswersMutation.reset();
  };

  if (gameQuery.isError || gameQuestionsQuery.isError) return <ErrorView />;
  if (gameQuery.isLoading || gameQuestionsQuery.isLoading) {
    return (
      <div className="w-full max-w-2xl p-4 text-left" aria-busy="true">
        <div className="h-36 animate-pulse rounded-xl border border-border bg-card" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="h-40 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }
  if (!game) return null;

  return (
    <div className="w-full max-w-2xl p-4 text-left">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Game Hub
      </Link>

      <div className="mt-3 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-(--brand-border) bg-(--brand-bg) px-2.5 py-0.5 text-xs font-medium capitalize">
            {game.gameType}
          </span>
          <span className="text-xs text-muted-foreground">
            {quizQuestions.length} question
            {quizQuestions.length === 1 ? '' : 's'}
            {' · '}
            {game.votes} vote{game.votes === 1 ? '' : 's'}
          </span>
        </div>
        <h2 className="mt-3">{game.title}</h2>
        <p className="text-sm text-muted-foreground">{game.description}</p>
      </div>

      {submission && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-(--brand-border) bg-(--brand-bg) p-5">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 shrink-0" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                You scored {submission.score} / {submission.total}
              </p>
              <p className="text-sm text-muted-foreground">
                {scoreMessage(submission.score, submission.total)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePlayAgain}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Play again
          </button>
        </div>
      )}

      <ol className="mt-4 flex list-none flex-col gap-3 p-0">
        {quizQuestions.map((quizQuestion, index) => {
          const result = resultByQuestionId.get(quizQuestion.id);
          return (
            <li
              key={quizQuestion.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">{index + 1}.</span>{' '}
                  {quizQuestion.prompt}
                </p>
                {result !== undefined &&
                  (result ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <Check className="h-3.5 w-3.5" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                      <X className="h-3.5 w-3.5" />
                      Incorrect
                    </span>
                  ))}
              </div>
              <ul
                className="mt-3 flex list-none flex-col gap-2 p-0"
                role="radiogroup"
              >
                {quizQuestion.options.map((option) => {
                  const isSelected =
                    selectedAnswers[quizQuestion.id] === option;
                  return (
                    <li key={option}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={!!submission}
                        onClick={() =>
                          handleSelectOption(quizQuestion.id, option)
                        }
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${
                          isSelected
                            ? 'border-(--brand-border) bg-(--brand-bg) font-medium text-foreground'
                            : 'border-border text-muted-foreground enabled:hover:bg-accent enabled:hover:text-accent-foreground'
                        }`}
                      >
                        {option}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      {!submission && quizQuestions.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {answeredCount} of {quizQuestions.length} answered
            {answeredCount < quizQuestions.length &&
              ' — unanswered questions count as incorrect'}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              answeredCount === 0 || submitQuizAnswersMutation.isPending
            }
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitQuizAnswersMutation.isPending
              ? 'Submitting…'
              : 'Submit answers'}
          </button>
        </div>
      )}

      {submitQuizAnswersMutation.isError && (
        <p className="mt-3 text-sm text-destructive">
          Something went wrong submitting your answers — please try again.
        </p>
      )}
    </div>
  );
};

export default QuizDetail;
