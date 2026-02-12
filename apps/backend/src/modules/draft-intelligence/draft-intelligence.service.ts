import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChampionStats } from '../../database/entities/champion-stats.entity';
import { Match } from '../../database/entities/match.entity';

export interface DraftPickAnalysis {
  championId: number;
  championName: string;
  // Winrate data
  winRatePatch: number | null;
  winRate30Days: number | null;
  winRateSeason: number | null;
  gamesPlayedTotal: number;
  // Matchup
  matchupDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'UNKNOWN';
  matchupWinRate: number | null;
  // Team comp
  teamSynergyScore: number; // 0-100
  // Flags
  isComfortPick: boolean;
  isRiskPick: boolean;
  // Verdict
  confidence: 'HIGH_CONFIDENCE' | 'RISKY_PICK' | 'COUNTER_RISK' | 'NORMAL';
  confidenceLabel: string;
  hints: string[];
}

export interface DraftSessionAnalysis {
  puuid: string;
  picks: DraftPickAnalysis[];
  teamSynergyOverall: number;
  recommendedBans: string[];
  draftWarnings: string[];
}

@Injectable()
export class DraftIntelligenceService {
  private readonly logger = new Logger(DraftIntelligenceService.name);

  constructor(
    @InjectRepository(ChampionStats)
    private readonly championStatsRepo: Repository<ChampionStats>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  // ── Main Analysis ─────────────────────────────────────────────────────

  async analyzePickForPlayer(
    puuid: string,
    championName: string,
    enemyChampionName?: string,
    allyChampions?: string[],
    patch?: string,
  ): Promise<DraftPickAnalysis> {
    const [stats, winRates] = await Promise.all([
      this.getChampionStats(puuid, championName, patch),
      this.getWinRatesAllTimeframes(puuid, championName),
    ]);

    const matchupWinRate = enemyChampionName
      ? await this.getMatchupWinRate(puuid, championName, enemyChampionName)
      : null;

    const teamSynergyScore = allyChampions?.length
      ? await this.calculateTeamSynergy([championName, ...allyChampions])
      : 50;

    const isComfortPick = this.isComfortPick(stats);
    const isRiskPick = this.isRiskPick(winRates, matchupWinRate, stats);
    const confidence = this.deriveConfidence(
      isComfortPick,
      isRiskPick,
      matchupWinRate,
    );
    const hints = this.buildHints(
      confidence,
      winRates,
      matchupWinRate,
      stats,
      enemyChampionName,
    );

    return {
      championId: stats?.championId ?? 0,
      championName,
      winRatePatch: winRates.patch,
      winRate30Days: winRates.last30Days,
      winRateSeason: winRates.season,
      gamesPlayedTotal: stats?.gamesPlayed ?? 0,
      matchupDifficulty: this.rateMatchupDifficulty(matchupWinRate),
      matchupWinRate,
      teamSynergyScore,
      isComfortPick,
      isRiskPick,
      confidence,
      confidenceLabel: this.confidenceLabel(confidence),
      hints,
    };
  }

  async analyzeDraftSession(
    puuid: string,
    myChampion: string,
    allyChampions: string[],
    enemyChampions: string[],
    patch?: string,
  ): Promise<DraftSessionAnalysis> {
    const myLaneEnemy = enemyChampions[0];

    const pickAnalysis = await this.analyzePickForPlayer(
      puuid,
      myChampion,
      myLaneEnemy,
      allyChampions,
      patch,
    );

    const teamSynergy = await this.calculateTeamSynergy([
      myChampion,
      ...allyChampions,
    ]);

    return {
      puuid,
      picks: [pickAnalysis],
      teamSynergyOverall: teamSynergy,
      recommendedBans: await this.getRecommendedBans(puuid, enemyChampions),
      draftWarnings: this.buildDraftWarnings(pickAnalysis, teamSynergy),
    };
  }

  // ── Internal Helpers ──────────────────────────────────────────────────

  private async getChampionStats(
    puuid: string,
    championName: string,
    patch?: string,
  ): Promise<ChampionStats | null> {
    return this.championStatsRepo.findOne({
      where: { puuid, championName, ...(patch && { patch }) },
    });
  }

  private async getWinRatesAllTimeframes(
    puuid: string,
    championName: string,
  ): Promise<{ patch: number | null; last30Days: number | null; season: number | null }> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const [last30DaysMatches, allSeasonMatches] = await Promise.all([
      this.matchRepo.find({
        where: { puuid, championName },
        // TODO: add date filter for last 30 days
      }),
      this.matchRepo.find({ where: { puuid, championName } }),
    ]);

    const calcWr = (matches: Match[]) => {
      if (!matches.length) return null;
      return matches.filter((m) => m.win).length / matches.length;
    };

    return {
      patch: null, // TODO: filter by current patch
      last30Days: calcWr(last30DaysMatches),
      season: calcWr(allSeasonMatches),
    };
  }

  private async getMatchupWinRate(
    puuid: string,
    myChampion: string,
    enemyChampion: string,
  ): Promise<number | null> {
    const stats = await this.championStatsRepo.findOne({
      where: { puuid, championName: myChampion },
    });
    return stats?.matchupWinRates?.[enemyChampion] ?? null;
  }

  private async calculateTeamSynergy(champions: string[]): Promise<number> {
    // TODO: implement synergy matrix logic
    // Placeholder: returns 50-80 based on team size
    return Math.min(50 + champions.length * 5, 80);
  }

  private async getRecommendedBans(
    puuid: string,
    enemyChampions: string[],
  ): Promise<string[]> {
    // TODO: cross-reference bad matchups from ChampionStats
    return [];
  }

  private isComfortPick(stats: ChampionStats | null): boolean {
    return (stats?.gamesPlayed ?? 0) >= 20;
  }

  private isRiskPick(
    winRates: { patch: number | null; last30Days: number | null; season: number | null },
    matchupWinRate: number | null,
    stats: ChampionStats | null,
  ): boolean {
    if ((stats?.gamesPlayed ?? 0) < 5) return true;
    if (matchupWinRate !== null && matchupWinRate < 0.4) return true;
    if (winRates.last30Days !== null && winRates.last30Days < 0.45) return true;
    return false;
  }

  private deriveConfidence(
    isComfort: boolean,
    isRisk: boolean,
    matchupWinRate: number | null,
  ): DraftPickAnalysis['confidence'] {
    if (isComfort && !isRisk) return 'HIGH_CONFIDENCE';
    if (matchupWinRate !== null && matchupWinRate < 0.4) return 'COUNTER_RISK';
    if (isRisk) return 'RISKY_PICK';
    return 'NORMAL';
  }

  private confidenceLabel(
    confidence: DraftPickAnalysis['confidence'],
  ): string {
    const labels = {
      HIGH_CONFIDENCE: '✅ High Confidence Pick',
      RISKY_PICK: '⚠️ Risky Pick',
      COUNTER_RISK: '🔴 Counter Risk',
      NORMAL: '➡️ Standard Pick',
    };
    return labels[confidence];
  }

  private rateMatchupDifficulty(
    matchupWinRate: number | null,
  ): DraftPickAnalysis['matchupDifficulty'] {
    if (matchupWinRate === null) return 'UNKNOWN';
    if (matchupWinRate >= 0.55) return 'EASY';
    if (matchupWinRate >= 0.45) return 'MEDIUM';
    return 'HARD';
  }

  private buildHints(
    confidence: DraftPickAnalysis['confidence'],
    winRates: { patch: number | null; last30Days: number | null; season: number | null },
    matchupWinRate: number | null,
    stats: ChampionStats | null,
    enemyChampion?: string,
  ): string[] {
    const hints: string[] = [];

    if (confidence === 'HIGH_CONFIDENCE')
      hints.push('Strong comfort champion – go for it!');
    if (confidence === 'RISKY_PICK')
      hints.push('Low experience or poor recent performance on this champion.');
    if (confidence === 'COUNTER_RISK' && enemyChampion)
      hints.push(`Historically struggles into ${enemyChampion}.`);
    if (winRates.last30Days !== null && winRates.last30Days > 0.6)
      hints.push('On a hot streak with this champion lately.');
    if ((stats?.gamesPlayed ?? 0) === 0)
      hints.push('No match history found – blind pick detected.');

    return hints;
  }

  private buildDraftWarnings(
    pick: DraftPickAnalysis,
    teamSynergy: number,
  ): string[] {
    const warnings: string[] = [];
    if (teamSynergy < 40) warnings.push('Low team synergy – consider adjusting composition.');
    if (pick.confidence === 'COUNTER_RISK') warnings.push('Potential lane counter – have a counterpick ready.');
    return warnings;
  }
}
