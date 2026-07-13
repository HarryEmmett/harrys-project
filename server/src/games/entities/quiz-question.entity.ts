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

  // Internal-only: never exposed via quizQuestionSchema, otherwise the
  // answer would leak to the client before submission (see shared/schema.md).
  @Column('int')
  correctOptionIndex!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column('uuid')
  gameId!: string;

  @ManyToOne(() => GameEntity, (game) => game.quizQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameId' })
  game!: GameEntity;
}
