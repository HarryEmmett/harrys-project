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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GameEntity, (game) => game.quizQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameId' })
  game!: GameEntity;
}
