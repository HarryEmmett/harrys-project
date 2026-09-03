import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameEntity } from './game.entity';

@Entity({ name: 'quiz_questions' })
export class QuizQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  prompt!: string;

  @Column('text', { array: true })
  options!: string[];

  // Secret content (see plan.md): used for server-side scoring and never
  // included in API responses. The seed script already populates it.
  @Column('int')
  correctOptionIndex!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GameEntity, (game) => game.quizQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameId' })
  game!: GameEntity;
}
