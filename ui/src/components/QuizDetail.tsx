import { useGameQuery } from '../hooks/useGameQuery';
import { useGameQuestionsQuery } from '../hooks/useGameQuestionsQuery';
import ErrorView from '../views/ErrorView';

type QuizDetailProps = {
  id: string;
};

const QuizDetail = ({ id }: QuizDetailProps) => {
  const { gameQuery } = useGameQuery(id);
  const { gameQuestionsQuery } = useGameQuestionsQuery(id);

  const game = gameQuery.data;
  const quizQuestions = gameQuestionsQuery.data?.quizQuestions ?? [];

  if (gameQuery.isError || gameQuestionsQuery.isError) return <ErrorView />;
  if (gameQuery.isLoading || gameQuestionsQuery.isLoading) {
    return <p>Loading...</p>;
  }
  if (!game) return null;

  return (
    <div className="w-full max-w-xl p-2 text-left">
      <p className="text-xs text-muted-foreground">{game.votes} votes</p>
      <div className="mt-2 rounded-lg border border-border bg-card p-5">
        <h2 className="m-0">{game.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {quizQuestions.map((quizQuestion, index) => (
          <li
            key={quizQuestion.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {quizQuestion.prompt}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {quizQuestion.options.map((option) => (
                <li
                  key={option}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {option}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizDetail;
