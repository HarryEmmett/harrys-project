import type {
  CodenamesCard,
  CodenamesCardRole,
  CodenamesKeyResponse,
} from '@harrys-project/shared/apiSchema';

const revealedStyles: Record<CodenamesCardRole, string> = {
  red: 'border-red-600 bg-red-600 text-white',
  blue: 'border-blue-600 bg-blue-600 text-white',
  neutral: 'border-amber-300 bg-amber-200 text-amber-900',
  assassin: 'border-zinc-950 bg-zinc-900 text-white',
};

// Muted tints for the spymaster view of unrevealed cards, so the key is
// readable without looking like the card has been revealed.
const keyStyles: Record<CodenamesCardRole, string> = {
  red: 'border-red-400 bg-red-500/15 text-red-700 dark:text-red-400',
  blue: 'border-blue-400 bg-blue-500/15 text-blue-700 dark:text-blue-400',
  neutral:
    'border-amber-300 bg-amber-300/15 text-amber-700 dark:text-amber-400',
  assassin: 'border-zinc-600 bg-zinc-500/25 text-foreground line-through',
};

type CodenamesBoardProps = {
  cards: CodenamesCard[];
  sessionKey: CodenamesKeyResponse | undefined;
  canGuess: boolean;
  isRevealing: boolean;
  onReveal: (cardIndex: number) => void;
};

const CodenamesBoard = ({
  cards,
  sessionKey,
  canGuess,
  isRevealing,
  onReveal,
}: CodenamesBoardProps) => {
  const cardClass = (card: CodenamesCard, index: number): string => {
    if (card.revealed && card.role) return revealedStyles[card.role];
    if (sessionKey) return keyStyles[sessionKey.roles[index]];
    return 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <ul className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {cards.map((card, index) => (
        <li key={card.word}>
          <button
            type="button"
            disabled={!canGuess || card.revealed || isRevealing}
            onClick={() => onReveal(index)}
            className={`flex h-14 w-full items-center justify-center rounded-md border px-1 text-center text-[10px] font-medium uppercase tracking-wide transition-colors sm:h-16 sm:text-xs ${cardClass(card, index)} ${
              card.revealed ? 'opacity-90' : ''
            } ${!canGuess || card.revealed ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {card.word}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default CodenamesBoard;
