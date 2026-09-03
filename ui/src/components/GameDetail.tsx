import { lazy, Suspense } from 'react';
import { useGameQuery } from '../hooks/useGameQuery';
import QuizDetail from './QuizDetail';
import ErrorView from '../views/ErrorView';

// Game UIs live in lazy-loaded feature folders (see plan.md "Where games
// live") so each game's code only downloads when its page is opened.
const CodenamesDetail = lazy(
  () => import('../features/games/codenames/CodenamesDetail'),
);

type GameDetailProps = {
  id: string;
  codenamesSessionId: string | undefined;
  onCodenamesSessionIdChange: (sessionId: string) => void;
};

const GameDetail = ({
  id,
  codenamesSessionId,
  onCodenamesSessionIdChange,
}: GameDetailProps) => {
  const { gameQuery } = useGameQuery(id);

  if (gameQuery.isError) return <ErrorView />;
  if (gameQuery.isLoading) return <p>Loading...</p>;
  if (!gameQuery.data) return null;

  switch (gameQuery.data.gameType) {
    case 'quiz':
      return <QuizDetail id={id} />;
    case 'codenames':
      return (
        <Suspense fallback={<p>Loading...</p>}>
          <CodenamesDetail
            id={id}
            sessionId={codenamesSessionId}
            onSessionIdChange={onCodenamesSessionIdChange}
          />
        </Suspense>
      );
  }
};

export default GameDetail;
