import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { QuizQuestionEntity } from './quiz-question.entity';

@Entity({ name: 'games' })
export class GameEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  // Discriminator for future game types (e.g. 'quiz' today) — lets the hub
  // grid render different game kinds later without a schema change.
  @Column()
  gameType!: string;

  @Column({ default: 0 })
  votes!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => QuizQuestionEntity, (quizQuestion) => quizQuestion.game)
  quizQuestions!: QuizQuestionEntity[];
}
