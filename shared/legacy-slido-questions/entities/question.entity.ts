import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { ChatQuestionEntity } from './chat-question.entity';

@Entity({ name: 'questions' })
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column('text')
  content!: string;

  @Column({ default: 0 })
  votes!: number;

  @Column({ default: false })
  answered!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => EventEntity, (event) => event.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: EventEntity;

  @OneToMany(() => ChatQuestionEntity, (chatQuestion) => chatQuestion.question)
  chatQuestions!: ChatQuestionEntity[];
}
