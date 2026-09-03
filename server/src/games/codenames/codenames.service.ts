import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CodenamesCardRole,
  CodenamesKeyResponse,
  codenamesKeyResponseSchema,
  CodenamesSessionResponse,
  codenamesSessionSchema,
  CodenamesTeam,
} from '@harrys-project/shared/apiSchema';
import { GameEntity } from '../entities/game.entity';
import {
  CodenamesSessionEntity,
  StoredCodenamesCard,
} from './entities/codenames-session.entity';
import { CODENAMES_WORDS } from './codenames-words';

const BOARD_SIZE = 25;
const STARTING_TEAM_CARDS = 9;
const SECOND_TEAM_CARDS = 8;

const otherTeam = (team: CodenamesTeam): CodenamesTeam =>
  team === 'red' ? 'blue' : 'red';

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const remainingFor = (
  cards: StoredCodenamesCard[],
  team: CodenamesTeam,
): number =>
  cards.filter((card) => card.role === team && !card.revealed).length;

// The operative view: roles are stripped from unrevealed cards so the key
// can only be obtained through the spymaster key endpoint.
const toSessionResponse = (
  session: CodenamesSessionEntity,
): CodenamesSessionResponse =>
  codenamesSessionSchema.parse({
    id: session.id,
    gameId: session.game.id,
    cards: session.cards.map((card) => ({
      word: card.word,
      revealed: card.revealed,
      role: card.revealed ? card.role : null,
    })),
    startingTeam: session.startingTeam,
    currentTeam: session.currentTeam,
    status: session.status,
    currentClue: session.currentClue,
    guessesRemaining: session.guessesRemaining,
    redRemaining: remainingFor(session.cards, 'red'),
    blueRemaining: remainingFor(session.cards, 'blue'),
    createdAt: session.createdAt.toISOString(),
  });

@Injectable()
export class CodenamesService {
  constructor(
    @InjectRepository(CodenamesSessionEntity)
    private readonly sessionRepo: Repository<CodenamesSessionEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
  ) {}

  async createSession(gameId: string): Promise<CodenamesSessionResponse> {
    const game = await this.gameRepo.findOneBy({ id: gameId });
    if (!game) {
      throw new NotFoundException(`Game with id "${gameId}" not found`);
    }
    if (game.gameType !== 'codenames') {
      throw new BadRequestException(
        `Game "${gameId}" is a ${game.gameType} game, not codenames`,
      );
    }

    const startingTeam: CodenamesTeam = Math.random() < 0.5 ? 'red' : 'blue';
    const roles: CodenamesCardRole[] = shuffle([
      ...Array<CodenamesCardRole>(STARTING_TEAM_CARDS).fill(startingTeam),
      ...Array<CodenamesCardRole>(SECOND_TEAM_CARDS).fill(
        otherTeam(startingTeam),
      ),
      ...Array<CodenamesCardRole>(
        BOARD_SIZE - STARTING_TEAM_CARDS - SECOND_TEAM_CARDS - 1,
      ).fill('neutral'),
      'assassin',
    ]);
    const words = shuffle([...CODENAMES_WORDS]).slice(0, BOARD_SIZE);

    const session = this.sessionRepo.create({
      game,
      cards: words.map((word, i) => ({
        word,
        role: roles[i],
        revealed: false,
      })),
      startingTeam,
      currentTeam: startingTeam,
      status: 'in_progress',
      currentClue: null,
      guessesRemaining: null,
    });

    return toSessionResponse(await this.sessionRepo.save(session));
  }

  async getSession(id: string): Promise<CodenamesSessionResponse> {
    return toSessionResponse(await this.findSession(id));
  }

  async getSessionKey(id: string): Promise<CodenamesKeyResponse> {
    const session = await this.findSession(id);
    return codenamesKeyResponseSchema.parse({
      sessionId: session.id,
      roles: session.cards.map((card) => card.role),
    });
  }

  async giveClue(
    id: string,
    word: string,
    count: number,
  ): Promise<CodenamesSessionResponse> {
    const session = await this.findSession(id);
    this.assertInProgress(session);
    if (session.currentClue) {
      throw new BadRequestException(
        'A clue has already been given this turn — guess or end the turn',
      );
    }

    session.currentClue = { word, count };
    // Standard rule: operatives get one bonus guess beyond the clue number.
    session.guessesRemaining = count + 1;

    return toSessionResponse(await this.sessionRepo.save(session));
  }

  async revealCard(
    id: string,
    cardIndex: number,
  ): Promise<CodenamesSessionResponse> {
    const session = await this.findSession(id);
    this.assertInProgress(session);
    if (!session.currentClue || session.guessesRemaining === null) {
      throw new BadRequestException(
        'The spymaster must give a clue before operatives can guess',
      );
    }

    const card = session.cards[cardIndex];
    if (!card) {
      throw new BadRequestException(`No card at index ${cardIndex}`);
    }
    if (card.revealed) {
      throw new BadRequestException(`Card "${card.word}" is already revealed`);
    }

    card.revealed = true;
    const guessingTeam = session.currentTeam;

    if (card.role === 'assassin') {
      session.status = `${otherTeam(guessingTeam)}_won`;
    } else if (remainingFor(session.cards, 'red') === 0) {
      session.status = 'red_won';
    } else if (remainingFor(session.cards, 'blue') === 0) {
      session.status = 'blue_won';
    }

    if (session.status !== 'in_progress') {
      session.currentClue = null;
      session.guessesRemaining = null;
    } else if (card.role === guessingTeam) {
      // Correct guess: keep going until the clue's guesses run out.
      session.guessesRemaining -= 1;
      if (session.guessesRemaining <= 0) {
        this.passTurn(session);
      }
    } else {
      // Neutral or opposing card: the turn ends immediately.
      this.passTurn(session);
    }

    return toSessionResponse(await this.sessionRepo.save(session));
  }

  async endTurn(id: string): Promise<CodenamesSessionResponse> {
    const session = await this.findSession(id);
    this.assertInProgress(session);

    this.passTurn(session);
    return toSessionResponse(await this.sessionRepo.save(session));
  }

  private async findSession(id: string): Promise<CodenamesSessionEntity> {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: { game: true },
    });
    if (!session) {
      throw new NotFoundException(
        `Codenames session with id "${id}" not found`,
      );
    }
    return session;
  }

  private assertInProgress(session: CodenamesSessionEntity): void {
    if (session.status !== 'in_progress') {
      throw new BadRequestException('This game is already over');
    }
  }

  private passTurn(session: CodenamesSessionEntity): void {
    session.currentTeam = otherTeam(session.currentTeam);
    session.currentClue = null;
    session.guessesRemaining = null;
  }
}
