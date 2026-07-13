import { Gamepad2 } from 'lucide-react';
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

  const sortedGames = [...(data?.games ?? [])].sort(
    (a, b) => b.votes - a.votes,
  );

  return (
    <div className="w-full p-4">
      <section id="game-hub-content" className="text-left">
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-2 flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <h2 className="m-0">Game Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pick a game to play, and vote for your favourites to move them up
            the grid.
          </p>
        </div>

        {isLoading ? (
          <ul
            className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
          >
            {[0, 1, 2].map((n) => (
              <li
                key={n}
                className="h-44 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </ul>
        ) : sortedGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No games yet — check back soon.
            </p>
          </div>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {sortedGames.map((game) => (
              <GameCard key={game.id} game={game} onVote={handleVoteGame} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default GameHub;
