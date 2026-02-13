import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SyncState = 'idle' | 'syncing' | 'error';

@Entity('sync_status')
@Index(['puuid'], { unique: true })
export class SyncStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  puuid: string;

  /** State machine: idle → syncing → idle | error */
  @Column({ type: 'varchar', default: 'idle' })
  state: SyncState;

  /** Total matches stored in DB for this PUUID */
  @Column({ default: 0 })
  totalMatchesSynced: number;

  /** Matches added in the most recent sync run */
  @Column({ default: 0 })
  lastSyncAddedCount: number;

  /** Timestamp of last successful sync */
  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date | null;

  /** Riot matchId of the most recent match we've seen — used to detect new games */
  @Column({ nullable: true })
  latestMatchId: string | null;

  /** Last error message if state === 'error' */
  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
