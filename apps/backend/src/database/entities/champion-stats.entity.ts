import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('champion_stats')
@Unique(['puuid', 'championId', 'patch'])
@Index(['puuid', 'championId'])
export class ChampionStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  puuid: string;

  @Column()
  championId: number;

  @Column()
  championName: string;

  @Column({ nullable: true })
  patch: string;

  // ── Aggregate Stats ──────────────────────────────────────────────────────
  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ type: 'float', default: 0 })
  winRate: number;

  @Column({ type: 'float', default: 0 })
  avgKda: number;

  @Column({ type: 'float', default: 0 })
  avgCsPerMinute: number;

  @Column({ type: 'float', default: 0 })
  avgDamageShare: number;

  @Column({ type: 'float', default: 0 })
  avgVisionScore: number;

  // ── Comfort / Risk Flags ─────────────────────────────────────────────────
  @Column({ default: false })
  isComfortPick: boolean; // ≥ 20 games on champion

  // ── Matchup Data ─────────────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  matchupWinRates: Record<string, number>; // { "Zed": 0.45, "Akali": 0.60 }

  @UpdateDateColumn()
  updatedAt: Date;
}
