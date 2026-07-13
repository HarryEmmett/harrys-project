import { Link } from '@tanstack/react-router';
import { Play, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { GameResponse } from '@harrys-project/shared/apiSchema';

type GameCardProps = {
  game: GameResponse;
  onVote: (id: string, delta: 1 | -1) => void;
};

const GameCard = ({ game, onVote }: GameCardProps) => {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-(--shadow)">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/game/$id"
          params={{ id: game.id }}
          className="text-base font-semibold text-foreground hover:underline"
        >
          {game.title}
        </Link>
        <span className="shrink-0 rounded-full border border-(--brand-border) bg-(--brand-bg) px-2.5 py-0.5 text-xs font-medium capitalize">
          {game.gameType}
        </span>
      </div>
      <p className="flex-1 text-sm text-muted-foreground">{game.description}</p>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => onVote(game.id, 1)}
            aria-label="Upvote game"
            className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-6 text-center font-medium tabular-nums text-foreground">
            {game.votes}
          </span>
          <button
            type="button"
            onClick={() => onVote(game.id, -1)}
            aria-label="Downvote game"
            className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <Link
          to="/game/$id"
          params={{ id: game.id }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5" />
          Play
        </Link>
      </div>
    </li>
  );
};

export default GameCard;
