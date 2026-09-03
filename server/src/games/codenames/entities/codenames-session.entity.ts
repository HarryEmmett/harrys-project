import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type {
  CodenamesCardRole,
  CodenamesClue,
  CodenamesSessionStatus,
  CodenamesTeam,
} from '@harrys-project/shared/apiSchema';
import { GameEntity } from '../../entities/game.entity';

// One card on the board as stored server-side — unlike the API card shape,
// this always carries the role. The service strips unrevealed roles before
// anything leaves the server.
export type StoredCodenamesCard = {
  word: string;
  role: CodenamesCardRole;
  revealed: boolean;
};

@Entity({ name: 'codenames_sessions' })
export class CodenamesSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'jsonb' })
  cards!: StoredCodenamesCard[];

  @Column()
  startingTeam!: CodenamesTeam;

  @Column()
  currentTeam!: CodenamesTeam;

  @Column({ default: 'in_progress' })
  status!: CodenamesSessionStatus;

  @Column({ type: 'jsonb', nullable: true })
  currentClue!: CodenamesClue | null;

  @Column({ type: 'int', nullable: true })
  guessesRemaining!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => GameEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game!: GameEntity;
}
