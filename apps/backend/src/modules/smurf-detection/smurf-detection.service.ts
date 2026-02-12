import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';

export interface SmurfReport {
  puuid: string;
  smurfProbabilityScore: number; // 0-100
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  signals: SmurfSignal[];
  summary: string;
  // Individual signal scores
  rankProgressionScore: number;
  winRateVsRankScore: number;
  mechanicalOutlierScore: number;
  accountAgeScore: number;
}

export interface SmurfSignal {
  signal: string;
  detected: boolean;
  weight: number; // contribution to overall score
  description: string;
}

// Typical rank averages for comparison
const RANK_WIN_RATE_AVERAGES: Record<string, number> = {
  IRON: 0.48,
  BRONZE: 0.49,
  SILVER: 0.50,
  GOLD: 0.50,
  PLATINUM: 0.51,
  EMERALD: 0.51,
  DIAMOND: 0.52,
  MASTER: 0.53,
};

@Injectable()
export class SmurfDetectionService {
  private readonly logger = new Logger(SmurfDetectionService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async getSmurfReport(puuid: string): Promise<SmurfReport> {
    const matches = await this.matchRepo.find({
      where: { puuid },
      order: { gameCreation: 'ASC' },
      take: 50,
    });

    const signals: SmurfSignal[] = [
      this.checkRankProgression(matches),
      this.checkWinRateVsRankAverage(matches),
      this.checkMechanicalOutliers(matches),
      this.checkEarlyGameDominance(matches),
      this.checkKdaOutlier(matches),
    ];

    const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
    const detectedWeight = signals
      .filter((s) => s.detected)
      .reduce((s, sig) => s + sig.weight, 0);

    const smurfProbabilityScore =
      totalWeight > 0 ? (detectedWeight / totalWeight) * 100 : 0;

    return {
      puuid,
      smurfProbabilityScore,
      confidenceLevel: this.getConfidenceLevel(matches.length, smurfProbabilityScore),
      signals,
      summary: this.buildSummary(smurfProbabilityScore, signals),
      rankProgressionScore: signals[0].detected ? 80 : 10,
      winRateVsRankScore: signals[1].detected ? 85 : 15,
      mechanicalOutlierScore: signals[2].detected ? 90 : 10,
      accountAgeScore: 0, // TODO: implement account age check via Riot API
    };
  }

  // ── Signal Detectors ──────────────────────────────────────────────────

  private checkRankProgression(matches: Match[]): SmurfSignal {
    // Unusually high WR in first 10 games
    const first10 = matches.slice(0, 10);
    if (!first10.length)
      return this.signal('rank_progression', false, 30, 'Not enough games');

    const earlyWr = first10.filter((m) => m.win).length / first10.length;
    const detected = earlyWr >= 0.75;

    return this.signal(
      'rank_progression',
      detected,
      30,
      detected
        ? `Unusually fast rank progression (WR ${Math.round(earlyWr * 100)}% in first 10 games)`
        : 'Normal rank progression speed',
    );
  }

  private checkWinRateVsRankAverage(matches: Match[]): SmurfSignal {
    if (matches.length < 10)
      return this.signal('winrate_vs_rank', false, 25, 'Not enough games');

    const wr = matches.filter((m) => m.win).length / matches.length;
    const tier = matches[matches.length - 1]?.tier?.toUpperCase();
    const rankAvg = (tier && RANK_WIN_RATE_AVERAGES[tier]) ?? 0.5;
    const detected = wr >= rankAvg + 0.12; // 12%+ above rank average

    return this.signal(
      'winrate_vs_rank',
      detected,
      25,
      detected
        ? `Win rate (${Math.round(wr * 100)}%) significantly above ${tier ?? 'rank'} average (${Math.round(rankAvg * 100)}%)`
        : 'Win rate within expected range',
    );
  }

  private checkMechanicalOutliers(matches: Match[]): SmurfSignal {
    if (matches.length < 5)
      return this.signal('mechanical_outlier', false, 25, 'Not enough games');

    const avgKda = matches.reduce((s, m) => s + m.kda, 0) / matches.length;
    const avgCs = matches.reduce((s, m) => s + m.csPerMinute, 0) / matches.length;

    // High KDA + high CS = mechanical outlier
    const detected = avgKda >= 3.5 && avgCs >= 8.0;

    return this.signal(
      'mechanical_outlier',
      detected,
      25,
      detected
        ? `Outlier mechanics: avg KDA ${avgKda.toFixed(2)}, avg CS/min ${avgCs.toFixed(1)}`
        : 'Mechanical stats within expected range',
    );
  }

  private checkEarlyGameDominance(matches: Match[]): SmurfSignal {
    // TODO: pull early-game kill/cs lead from rawData (frames 0-10min)
    return this.signal(
      'early_game_dominance',
      false,
      10,
      'Early game data analysis – needs timeline data (TODO)',
    );
  }

  private checkKdaOutlier(matches: Match[]): SmurfSignal {
    if (matches.length < 5)
      return this.signal('kda_outlier', false, 10, 'Not enough games');

    const avgKda = matches.reduce((s, m) => s + m.kda, 0) / matches.length;
    const detected = avgKda >= 4.5;

    return this.signal(
      'kda_outlier',
      detected,
      10,
      detected
        ? `Extremely high average KDA: ${avgKda.toFixed(2)}`
        : 'KDA within expected range',
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private signal(
    signal: string,
    detected: boolean,
    weight: number,
    description: string,
  ): SmurfSignal {
    return { signal, detected, weight, description };
  }

  private getConfidenceLevel(
    gamesAnalyzed: number,
    score: number,
  ): SmurfReport['confidenceLevel'] {
    if (gamesAnalyzed < 5) return 'LOW';
    if (gamesAnalyzed < 15) return 'MEDIUM';
    if (score >= 70) return 'VERY_HIGH';
    return 'HIGH';
  }

  private buildSummary(score: number, signals: SmurfSignal[]): string {
    const detected = signals.filter((s) => s.detected).length;
    if (score >= 70)
      return `⚠️ High smurf probability (${Math.round(score)}%) – ${detected}/${signals.length} signals triggered.`;
    if (score >= 40)
      return `🔶 Moderate smurf indicators (${Math.round(score)}%) – worth monitoring.`;
    return `✅ Low smurf probability (${Math.round(score)}%) – appears to be a legitimate account.`;
  }
}
