import { useState } from 'react';
import type {
  CodenamesSessionResponse,
  CodenamesTeam,
} from '@harrys-project/shared/apiSchema';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useGameQuery } from '../../../hooks/useGameQuery';
import { useCodenamesSession } from './useCodenamesSession';
import CodenamesBoard from './CodenamesBoard';
import ErrorView from '../../../views/ErrorView';

const teamText: Record<CodenamesTeam, string> = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

const teamLabel: Record<CodenamesTeam, string> = {
  red: 'Red',
  blue: 'Blue',
};

const winnerOf = (session: CodenamesSessionResponse): CodenamesTeam | null => {
  if (session.status === 'red_won') return 'red';
  if (session.status === 'blue_won') return 'blue';
  return null;
};

type CodenamesDetailProps = {
  id: string;
  sessionId: string | undefined;
  onSessionIdChange: (sessionId: string) => void;
};

const CodenamesDetail = ({
  id,
  sessionId,
  onSessionIdChange,
}: CodenamesDetailProps) => {
  const [spymasterView, setSpymasterView] = useState(false);
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);

  const { gameQuery } = useGameQuery(id);
  const {
    sessionQuery,
    keyQuery,
    createSessionMutation,
    giveClueMutation,
    revealCardMutation,
    endTurnMutation,
  } = useCodenamesSession(sessionId, { withKey: spymasterView });

  const game = gameQuery.data;
  const session = sessionQuery.data;

  if (gameQuery.isError || sessionQuery.isError) return <ErrorView />;
  if (gameQuery.isLoading || (sessionId && sessionQuery.isLoading)) {
    return <p>Loading...</p>;
  }
  if (!game) return null;

  const handleNewGame = () => {
    createSessionMutation.mutate(id, {
      onSuccess: (newSession) => {
        setSpymasterView(false);
        setClueWord('');
        setClueCount(1);
        onSessionIdChange(newSession.id);
      },
    });
  };

  const handleGiveClue = (event: React.FormEvent) => {
    event.preventDefault();
    const word = clueWord.trim();
    if (!word) return;
    giveClueMutation.mutate(
      { word, count: clueCount },
      { onSuccess: () => setClueWord('') },
    );
  };

  const winner = session ? winnerOf(session) : null;
  const inProgress = session?.status === 'in_progress';
  const canGuess = !!session && inProgress && !!session.currentClue;

  return (
    <div className="w-full max-w-2xl p-2 text-left">
      <p className="text-xs text-muted-foreground">{game.votes} votes</p>
      <div className="mt-2 rounded-lg border border-border bg-card p-5">
        <h2 className="m-0">{game.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
      </div>

      {!session ? (
        <div className="mt-4 rounded-lg border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Pass-and-play for two teams: each team&apos;s spymaster flips on
            spymaster view to see the key, gives a one-word clue, then hands the
            screen to their operatives.
          </p>
          <button
            type="button"
            onClick={handleNewGame}
            disabled={createSessionMutation.isPending}
            className="mt-4 rounded-md border border-border bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {createSessionMutation.isPending ? 'Dealing...' : 'Start a game'}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            {winner ? (
              <p className={`font-semibold ${teamText[winner]}`}>
                {teamLabel[winner]} team wins!
              </p>
            ) : (
              <p>
                <span
                  className={`font-semibold ${teamText[session.currentTeam]}`}
                >
                  {teamLabel[session.currentTeam]}&apos;s turn
                </span>
                {session.currentClue ? (
                  <span className="text-muted-foreground">
                    {' '}
                    — clue:{' '}
                    <span className="font-medium uppercase text-foreground">
                      {session.currentClue.word}
                    </span>{' '}
                    ({session.currentClue.count}), {session.guessesRemaining}{' '}
                    guess{session.guessesRemaining === 1 ? '' : 'es'} left
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {' '}
                    — waiting for a clue
                  </span>
                )}
              </p>
            )}
            <p className="text-xs">
              <span className={teamText.red}>{session.redRemaining} red</span>
              <span className="text-muted-foreground"> · </span>
              <span className={teamText.blue}>
                {session.blueRemaining} blue
              </span>
              <span className="text-muted-foreground"> left</span>
            </p>
          </div>

          <div className="mt-3">
            <CodenamesBoard
              cards={session.cards}
              sessionKey={spymasterView ? keyQuery.data : undefined}
              canGuess={canGuess}
              isRevealing={revealCardMutation.isPending}
              onReveal={(cardIndex) => revealCardMutation.mutate(cardIndex)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSpymasterView((view) => !view)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {spymasterView ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {spymasterView ? 'Hide spymaster view' : 'Spymaster view'}
            </button>
            {inProgress && session.currentClue && (
              <button
                type="button"
                onClick={() => endTurnMutation.mutate()}
                disabled={endTurnMutation.isPending}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                End turn
              </button>
            )}
            <button
              type="button"
              onClick={handleNewGame}
              disabled={createSessionMutation.isPending}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New game
            </button>
          </div>

          {inProgress && !session.currentClue && (
            <form
              onSubmit={handleGiveClue}
              className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <label
                htmlFor="codenames-clue-word"
                className={`text-xs font-medium ${teamText[session.currentTeam]}`}
              >
                {teamLabel[session.currentTeam]} spymaster&apos;s clue
              </label>
              <input
                id="codenames-clue-word"
                value={clueWord}
                onChange={(event) => setClueWord(event.target.value)}
                placeholder="One word"
                className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
              />
              <select
                aria-label="Clue number"
                value={clueCount}
                onChange={(event) => setClueCount(Number(event.target.value))}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!clueWord.trim() || giveClueMutation.isPending}
                className="rounded-md border border-border bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Give clue
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default CodenamesDetail;
