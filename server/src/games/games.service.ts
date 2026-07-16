import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GamesResponse,
  gamesResponseSchema,
  GameResponse,
  gameSchema,
  GameQuestionsResponse,
  gameQuestionsResponseSchema,
  QuizQuestionResponse,
} from '@harrys-project/shared/apiSchema';
import { GameEntity } from './entities/game.entity';
import { QuizQuestionEntity } from './entities/quiz-question.entity';

const toGameResponse = (game: GameEntity): GameResponse => ({
  id: game.id,
  title: game.title,
  description: game.description,
  gameType: game.gameType as 'quiz',
  votes: game.votes,
  createdAt: game.createdAt.toISOString(),
});

const toQuizQuestionResponse = (
  quizQuestion: QuizQuestionEntity,
): QuizQuestionResponse => ({
  id: quizQuestion.id,
  gameId: quizQuestion.game.id,
  prompt: quizQuestion.prompt,
  options: quizQuestion.options,
  createdAt: quizQuestion.createdAt.toISOString(),
});

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(QuizQuestionEntity)
    private readonly quizQuestionRepo: Repository<QuizQuestionEntity>,
  ) {}

  async getGames(): Promise<GamesResponse> {
    const games = await this.gameRepo.find({ order: { createdAt: 'ASC' } });

    return gamesResponseSchema.parse({
      games: games.map(toGameResponse),
    });
  }

  async getGameById(id: string): Promise<GameResponse> {
    const game = await this.gameRepo.findOneBy({ id });

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    return gameSchema.parse(toGameResponse(game));
  }

  async getGameQuestions(id: string): Promise<GameQuestionsResponse> {
    const quizQuestions = await this.quizQuestionRepo.find({
      where: { game: { id } },
      relations: { game: true },
      order: { createdAt: 'ASC' },
    });

    return gameQuestionsResponseSchema.parse({
      quizQuestions: quizQuestions.map(toQuizQuestionResponse),
    });
  }

  async voteGame(id: string, delta: 1 | -1): Promise<GameResponse> {
    const game = await this.gameRepo.findOneBy({ id });

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    game.votes += delta;
    const saved = await this.gameRepo.save(game);

    return gameSchema.parse(toGameResponse(saved));
  }
}
