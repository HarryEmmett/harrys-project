import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity({ name: 'chat_questions' })
export class ChatQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  author!: string;

  @Column('text')
  content!: string;

  @Column({ default: 0 })
  votes!: number;

  @ManyToOne(() => QuestionEntity, (question) => question.chatQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question!: QuestionEntity;
}
