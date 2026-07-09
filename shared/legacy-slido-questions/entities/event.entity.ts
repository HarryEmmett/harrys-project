import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ParticipantEntity } from './participant.entity';
import { QuestionEntity } from './question.entity';

@Entity({ name: 'events' })
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ParticipantEntity, (participant) => participant.event)
  participants!: ParticipantEntity[];

  @OneToMany(() => QuestionEntity, (question) => question.event)
  questions!: QuestionEntity[];
}
