import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';

export interface TiltReport {
  puuid: string;
  consistencyScore: number; // 0-100 (higher = more consistent)
  tiltRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tiltRiskIndicator: number; // 0-100
  lossStreakDetected: boolean;
  currentLossStreak: number;
  performanceDropOnStreak: boolean;
  sessionFatigueDetected: boolean;
  bestTimeOfDay: string | null; // e.g. "Evening (18:00-22:00)"
  worstTimeOfDay: string | null;
  timeOfDayStats: TimeOfDayStats[];
  recommendations: string[];
  roleStabilityScore: number;  // 0-100
  champStabilityScore: number; // 0-100
}

export interface TimeOfDayStats {
  timeWindow: string; // e.g. "Morning", "Afternoon", "Evening", "Night"
  hourRange: string;
  gamesPlayed: number;
  winRate: number;
  avgKda: number;
}

const TIME_WINDOWS = [
  { name: 'Night', hours: [0, 1, 2, 3, 4, 5], label: '00:00–06:00' },
  { name: 'Morning', hours: [6, 7, 8, 9, 10, 11], label: '06:00–12:00' },
  { name: 'Afternoon', hours: [12, 13, 14, 15, 16, 17], label: '12:00–18:00' },
  { name: 'Evening', hours: [18, 19, 20, 21, 22, 23], label: '18:00–24:00' },
];

@Injectable()
export class TiltDetectionService {
  private readonly logger = new Logger(TiltDetectionService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async getTiltReport(puuid: string, lookbackGames = 30): Promise<TiltReport> {
    const matches = await this.matchRepo.find({
      where: { puuid },
      order: { gameCreation: 'DESC' },
      take: lookbackGames,
    });

    const lossStreak = this.detectLossStreak(matches);
    const performanceDrop = this.detectPerformanceDrop(matches, lossStreak.count);
    const sessionFatigue = this.detectSessionFatigue(matches);
    const timeOfDayStats = this.analyzeTimeOfDay(matches);
    const consistencyScore = this.calcConsistencyScore(matches);
    const tiltRisk = this.calcTiltRisk(lossStreak, performanceDrop, sessionFatigue, consistencyScore);
    const roleStability = this.calcRoleStability(matches);
    const champStability = this.calcChampStability(matches);

    return {
      puuid,
      consistencyScore,
      tiltRiskLevel: this.tiltRiskLevel(tiltRisk),
      tiltRiskIndicator: tiltRisk,
      lossStreakDetected: lossStreak.detected,
      currentLossStreak: lossStreak.count,
      performanceDropOnStreak: performanceDrop,
      sessionFatigueDetected: sessionFatigue,
      bestTimeOfDay: this.findBestTimeWindow(timeOfDayStats),
      worstTimeOfDay: this.findWorstTimeWindow(timeOfDayStats),
      timeOfDayStats,
      recommendations: this.buildRecommendations(
        tiltRisk,
        lossStreak,
        sessionFatigue,
        timeOfDayStats,
        roleStability,
        champStability,
      ),
      roleStabilityScore: roleStability,
      champStabilityScore: champStability,
    };
  }

  // ── Internal Helpers ──────────────────────────────────────────────────

  private detectLossStreak(
    matches: Match[],
  ): { detected: boolean; count: number } {
    let streak = 0;
    for (const m of matches) {
      if (!m.win) streak++;
      else break;
    }
    return { detected: streak >= 3, count: streak };
  }

  private detectPerformanceDrop(
    matches: Match[],
    streakLength: number,
  ): boolean {
    if (streakLength < 2) return false;

    const streakMatches = matches.slice(0, streakLength);
    const beforeMatches = matches.slice(streakLength, streakLength + streakLength);

    if (!beforeMatches.length) return false;

    const avgKdaBefore =
      beforeMatches.reduce((s, m) => s + m.kda, 0) / beforeMatches.length;
    const avgKdaDuring =
      streakMatches.reduce((s, m) => s + m.kda, 0) / streakMatches.length;

    return avgKdaDuring < avgKdaBefore * 0.75; // 25% drop threshold
  }

  private detectSessionFatigue(matches: Match[]): boolean {
    if (matches.length < 4) return false;

    // Group matches by day; check if last games in a day have lower WR / KDA
    const today = matches.filter((m) => {
      const d = new Date(Number(m.gameCreation));
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });

    if (today.length < 4) return false;

    const firstHalf = today.slice(0, Math.floor(today.length / 2));
    const secondHalf = today.slice(Math.floor(today.length / 2));

    const wrFirst = firstHalf.filter((m) => m.win).length / firstHalf.length;
    const wrSecond = secondHalf.filter((m) => m.win).length / secondHalf.length;

    return wrSecond < wrFirst - 0.2; // 20% drop in same session
  }

  private analyzeTimeOfDay(matches: Match[]): TimeOfDayStats[] {
    return TIME_WINDOWS.map((window) => {
      const windowMatches = matches.filter((m) => {
        const hour = new Date(Number(m.gameCreation)).getHours();
        return window.hours.includes(hour);
      });

      if (!windowMatches.length) {
        return {
          timeWindow: window.name,
          hourRange: window.label,
          gamesPlayed: 0,
          winRate: 0,
          avgKda: 0,
        };
      }

      return {
        timeWindow: window.name,
        hourRange: window.label,
        gamesPlayed: windowMatches.length,
        winRate:
          windowMatches.filter((m) => m.win).length / windowMatches.length,
        avgKda:
          windowMatches.reduce((s, m) => s + m.kda, 0) / windowMatches.length,
      };
    });
  }

  private calcConsistencyScore(matches: Match[]): number {
    if (matches.length < 3) return 50;
    const kdas = matches.map((m) => m.kda);
    const avg = kdas.reduce((s, v) => s + v, 0) / kdas.length;
    const variance =
      kdas.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / kdas.length;
    const stdDev = Math.sqrt(variance);
    // Lower std dev = higher consistency
    return Math.max(0, Math.min(100, 100 - stdDev * 15));
  }

  private calcTiltRisk(
    lossStreak: { detected: boolean; count: number },
    performanceDrop: boolean,
    sessionFatigue: boolean,
    consistencyScore: number,
  ): number {
    let risk = 0;
    if (lossStreak.count >= 3) risk += 30;
    if (lossStreak.count >= 5) risk += 20;
    if (performanceDrop) risk += 25;
    if (sessionFatigue) risk += 15;
    risk += (100 - consistencyScore) * 0.1;
    return Math.min(100, risk);
  }

  private tiltRiskLevel(score: number): TiltReport['tiltRiskLevel'] {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  private calcRoleStability(matches: Match[]): number {
    if (!matches.length) return 50;
    const roleCounts: Record<string, number> = {};
    matches.forEach((m) => {
      roleCounts[m.role] = (roleCounts[m.role] ?? 0) + 1;
    });
    const maxRole = Math.max(...Object.values(roleCounts));
    return (maxRole / matches.length) * 100;
  }

  private calcChampStability(matches: Match[]): number {
    if (!matches.length) return 50;
    const champCounts: Record<string, number> = {};
    matches.forEach((m) => {
      champCounts[m.championName] = (champCounts[m.championName] ?? 0) + 1;
    });
    // Top 3 champs coverage
    const sorted = Object.values(champCounts).sort((a, b) => b - a);
    const top3 = sorted.slice(0, 3).reduce((s, v) => s + v, 0);
    return (top3 / matches.length) * 100;
  }

  private findBestTimeWindow(stats: TimeOfDayStats[]): string | null {
    const active = stats.filter((s) => s.gamesPlayed >= 3);
    if (!active.length) return null;
    return active.sort((a, b) => b.winRate - a.winRate)[0].timeWindow;
  }

  private findWorstTimeWindow(stats: TimeOfDayStats[]): string | null {
    const active = stats.filter((s) => s.gamesPlayed >= 3);
    if (!active.length) return null;
    return active.sort((a, b) => a.winRate - b.winRate)[0].timeWindow;
  }

  private buildRecommendations(
    tiltRisk: number,
    lossStreak: { detected: boolean; count: number },
    sessionFatigue: boolean,
    timeOfDay: TimeOfDayStats[],
    roleStability: number,
    champStability: number,
  ): string[] {
    const recs: string[] = [];

    if (tiltRisk >= 75)
      recs.push('🛑 Take a break – you are showing critical tilt indicators.');
    else if (tiltRisk >= 50)
      recs.push('⏸️ Consider a short break before queuing again.');

    if (lossStreak.count >= 5)
      recs.push(`🔴 ${lossStreak.count}-game loss streak detected – stop for today.`);
    else if (lossStreak.count >= 3)
      recs.push(`⚠️ ${lossStreak.count}-game loss streak – switch champion or take a break.`);

    if (sessionFatigue)
      recs.push('😴 Performance is dropping within your current session. End the session.');

    if (roleStability < 50)
      recs.push('🎯 Playing too many roles – focus on 1-2 roles for better improvement.');

    if (champStability < 40)
      recs.push('🏆 Improve champion pool stability – focus on 3 core champions.');

    const worstWindow = this.findWorstTimeWindow(timeOfDay);
    if (worstWindow)
      recs.push(`🕐 Avoid playing during ${worstWindow} – historically your worst time slot.`);

    return recs;
  }
}
