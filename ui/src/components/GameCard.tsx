import { Link } from '@tanstack/react-router';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { GameResponse } from '@harrys-project/shared/apiSchema';

type GameCardProps = {
  game: GameResponse;
  onVote: (id: string, delta: 1 | -1) => void;
};

const GameCard = ({ game, onVote }: GameCardProps) => {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left">
      <Link
        to="/game/$id"
        params={{ id: game.id }}
        className="text-sm font-medium text-foreground hover:underline"
      >
        {game.title}
      </Link>
      <p className="text-xs text-muted-foreground">{game.description}</p>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => onVote(game.id, 1)}
          aria-label="Upvote game"
          className="rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <span>{game.votes}</span>
        <button
          type="button"
          onClick={() => onVote(game.id, -1)}
          aria-label="Downvote game"
          className="rounded-md p-1 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
};

export default GameCard;
