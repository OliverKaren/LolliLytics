import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';

// Benchmark baselines (placeholder values – replace with real data from Riot API / op.gg scraping)
const RANK_BENCHMARKS = {
  MASTER: {
    avgKda: 3.2,
    avgCsPerMinute: 8.5,
    avgDamageShare: 0.28,
    avgVisionScore: 1.4, // per minute
    avgObjectiveParticipation: 0.72,
  },
  GRANDMASTER: {
    avgKda: 3.5,
    avgCsPerMinute: 8.8,
    avgDamageShare: 0.29,
    avgVisionScore: 1.5,
    avgObjectiveParticipation: 0.75,
  },
  CHALLENGER: {
    avgKda: 3.8,
    avgCsPerMinute: 9.2,
    avgDamageShare: 0.30,
    avgVisionScore: 1.6,
    avgObjectiveParticipation: 0.80,
  },
};

export interface PerformanceReport {
  puuid: string;
  period: 'last20' | 'last50' | 'season';
  playerStats: PlayerAggregateStats;
  benchmarks: {
    master: RankComparison;
    grandmaster: RankComparison;
    challenger: RankComparison;
  };
  percentileRankings: PercentileRankings;
  strengths: string[];
  weaknesses: string[];
  lanePhaseScore: number; // 0-100
  objectiveImpactScore: number; // 0-100
}

export interface PlayerAggregateStats {
  gamesAnalyzed: number;
  avgKda: number;
  avgCsPerMinute: number;
  avgDamageShare: number;
  avgVisionScore: number;
  winRate: number;
}

export interface RankComparison {
  rank: string;
  kdaDelta: number; // player - benchmark (+ = better)
  csDelta: number;
  damageShareDelta: number;
  visionDelta: number;
  overallScore: number; // 0-100
}

export interface PercentileRankings {
  kda: number;       // e.g. 78 = top 22%
  cs: number;
  damageShare: number;
  vision: number;
  overall: number;
}

@Injectable()
export class PerformanceBenchmarkingService {
  private readonly logger = new Logger(PerformanceBenchmarkingService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async getPerformanceReport(
    puuid: string,
    period: 'last20' | 'last50' | 'season' = 'last20',
  ): Promise<PerformanceReport> {
    const matches = await this.fetchMatchesForPeriod(puuid, period);
    const playerStats = this.aggregateStats(matches);
    const benchmarks = this.compareToBenchmarks(playerStats);
    const percentiles = this.calculatePercentiles(playerStats);

    return {
      puuid,
      period,
      playerStats,
      benchmarks,
      percentileRankings: percentiles,
      strengths: this.detectStrengths(playerStats, percentiles),
      weaknesses: this.detectWeaknesses(playerStats, percentiles),
      lanePhaseScore: this.scoreLanePhase(playerStats),
      objectiveImpactScore: this.scoreObjectiveImpact(playerStats),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────

  private async fetchMatchesForPeriod(
    puuid: string,
    period: 'last20' | 'last50' | 'season',
  ): Promise<Match[]> {
    const limitMap = { last20: 20, last50: 50, season: 500 };
    return this.matchRepo.find({
      where: { puuid },
      order: { gameCreation: 'DESC' },
      take: limitMap[period],
    });
  }

  private aggregateStats(matches: Match[]): PlayerAggregateStats {
    if (!matches.length) {
      return {
        gamesAnalyzed: 0,
        avgKda: 0,
        avgCsPerMinute: 0,
        avgDamageShare: 0,
        avgVisionScore: 0,
        winRate: 0,
      };
    }

    const sum = matches.reduce(
      (acc, m) => ({
        kda: acc.kda + m.kda,
        cs: acc.cs + m.csPerMinute,
        dmg: acc.dmg + 0, // TODO: calculate damage share from rawData
        vision: acc.vision + (m.visionScore / (m.gameDuration / 60)),
        wins: acc.wins + (m.win ? 1 : 0),
      }),
      { kda: 0, cs: 0, dmg: 0, vision: 0, wins: 0 },
    );

    const n = matches.length;
    return {
      gamesAnalyzed: n,
      avgKda: sum.kda / n,
      avgCsPerMinute: sum.cs / n,
      avgDamageShare: sum.dmg / n,
      avgVisionScore: sum.vision / n,
      winRate: sum.wins / n,
    };
  }

  private compareToBenchmarks(
    stats: PlayerAggregateStats,
  ): PerformanceReport['benchmarks'] {
    const compare = (
      rank: keyof typeof RANK_BENCHMARKS,
    ): RankComparison => {
      const b = RANK_BENCHMARKS[rank];
      const deltas = {
        kdaDelta: stats.avgKda - b.avgKda,
        csDelta: stats.avgCsPerMinute - b.avgCsPerMinute,
        damageShareDelta: stats.avgDamageShare - b.avgDamageShare,
        visionDelta: stats.avgVisionScore - b.avgVisionScore,
      };
      // Simple weighted score
      const overallScore = Math.min(
        100,
        Math.max(
          0,
          50 +
            deltas.kdaDelta * 5 +
            deltas.csDelta * 3 +
            deltas.visionDelta * 10,
        ),
      );
      return { rank, ...deltas, overallScore };
    };

    return {
      master: compare('MASTER'),
      grandmaster: compare('GRANDMASTER'),
      challenger: compare('CHALLENGER'),
    };
  }

  private calculatePercentiles(
    stats: PlayerAggregateStats,
  ): PercentileRankings {
    // TODO: replace with real distribution data from DB / static datasets
    const normKda = Math.min(100, (stats.avgKda / 4.0) * 100);
    const normCs = Math.min(100, (stats.avgCsPerMinute / 10) * 100);
    const normVis = Math.min(100, (stats.avgVisionScore / 2.0) * 100);
    const normDmg = Math.min(100, (stats.avgDamageShare / 0.35) * 100);
    return {
      kda: normKda,
      cs: normCs,
      damageShare: normDmg,
      vision: normVis,
      overall: (normKda + normCs + normVis + normDmg) / 4,
    };
  }

  private detectStrengths(
    stats: PlayerAggregateStats,
    percentiles: PercentileRankings,
  ): string[] {
    const strengths: string[] = [];
    if (percentiles.kda >= 70) strengths.push('KDA / Survivability');
    if (percentiles.cs >= 70) strengths.push('CS Efficiency');
    if (percentiles.vision >= 70) strengths.push('Vision Control');
    if (percentiles.damageShare >= 70) strengths.push('Damage Output');
    if (stats.winRate >= 0.55) strengths.push('Win Rate');
    return strengths;
  }

  private detectWeaknesses(
    stats: PlayerAggregateStats,
    percentiles: PercentileRankings,
  ): string[] {
    const weaknesses: string[] = [];
    if (percentiles.kda < 40) weaknesses.push('KDA / Death Trading');
    if (percentiles.cs < 40) weaknesses.push('CS Efficiency');
    if (percentiles.vision < 40) weaknesses.push('Vision Control');
    if (percentiles.damageShare < 40) weaknesses.push('Damage Contribution');
    return weaknesses;
  }

  private scoreLanePhase(stats: PlayerAggregateStats): number {
    return Math.min(100, (stats.avgCsPerMinute / 9) * 70 + (stats.avgKda / 4) * 30);
  }

  private scoreObjectiveImpact(stats: PlayerAggregateStats): number {
    // TODO: pull objective data from rawData
    return 50;
  }
}
