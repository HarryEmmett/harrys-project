import { useGamesQuery } from '../hooks/useGamesQuery';
import GameCard from './GameCard';
import ErrorView from '../views/ErrorView';

const GameHub = () => {
  const { gamesQuery, voteGameMutation } = useGamesQuery();
  const { data, isLoading, isError } = gamesQuery;

  const handleVoteGame = (id: string, delta: 1 | -1) => {
    voteGameMutation.mutate({ id, delta });
  };

  if (isError) return <ErrorView />;
  if (isLoading) return <p>Loading...</p>;

  const sortedGames = [...(data?.games ?? [])].sort(
    (a, b) => b.votes - a.votes,
  );

  return (
    <div className="w-full p-2">
      <section id="game-hub-content" className="text-left">
        <div className="mb-4 flex items-center justify-between">
          <h2>Game Hub</h2>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGames.map((game) => (
            <GameCard key={game.id} game={game} onVote={handleVoteGame} />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default GameHub;
