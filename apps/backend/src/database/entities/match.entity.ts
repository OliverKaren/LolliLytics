import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('matches')
@Index(['puuid', 'gameCreation'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  matchId: string; // Riot match ID e.g. EUW1_7123456789

  @Column()
  puuid: string;

  @Column()
  championId: number;

  @Column()
  championName: string;

  @Column()
  lane: string;

  @Column()
  role: string;

  @Column()
  win: boolean;

  @Column()
  kills: number;

  @Column()
  deaths: number;

  @Column()
  assists: number;

  @Column({ type: 'float' })
  kda: number;

  @Column({ type: 'int' })
  totalDamageDealt: number;

  @Column({ type: 'int' })
  totalDamageDealtToChampions: number;

  @Column({ type: 'int' })
  goldEarned: number;

  @Column({ type: 'int' })
  cs: number;

  @Column({ type: 'float' })
  csPerMinute: number;

  @Column({ type: 'int' })
  visionScore: number;

  @Column({ type: 'int' })
  gameDuration: number; // seconds

  @Column({ type: 'bigint' })
  gameCreation: number; // unix timestamp ms

  @Column({ nullable: true })
  patch: string; // e.g. "14.10"

  @Column({ nullable: true })
  tier: string; // IRON, BRONZE, ... CHALLENGER

  @Column({ nullable: true })
  rank: string; // I, II, III, IV

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>; // full participant data for advanced stats

  @CreateDateColumn()
  fetchedAt: Date;
}
