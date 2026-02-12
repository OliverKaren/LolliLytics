// ── Draft Intelligence ─────────────────────────────────────────────────────
export interface DraftPickAnalysis {
  championId: number;
  championName: string;
  winRatePatch: number | null;
  winRate30Days: number | null;
  winRateSeason: number | null;
  gamesPlayedTotal: number;
  matchupDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'UNKNOWN';
  matchupWinRate: number | null;
  teamSynergyScore: number;
  isComfortPick: boolean;
  isRiskPick: boolean;
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

// ── Performance Benchmarking ───────────────────────────────────────────────
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
  kdaDelta: number;
  csDelta: number;
  damageShareDelta: number;
  visionDelta: number;
  overallScore: number;
}

export interface PercentileRankings {
  kda: number;
  cs: number;
  damageShare: number;
  vision: number;
  overall: number;
}

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
  lanePhaseScore: number;
  objectiveImpactScore: number;
}

// ── Tilt Detection ─────────────────────────────────────────────────────────
export interface TimeOfDayStats {
  timeWindow: string;
  hourRange: string;
  gamesPlayed: number;
  winRate: number;
  avgKda: number;
}

export interface TiltReport {
  puuid: string;
  consistencyScore: number;
  tiltRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tiltRiskIndicator: number;
  lossStreakDetected: boolean;
  currentLossStreak: number;
  performanceDropOnStreak: boolean;
  sessionFatigueDetected: boolean;
  bestTimeOfDay: string | null;
  worstTimeOfDay: string | null;
  timeOfDayStats: TimeOfDayStats[];
  recommendations: string[];
  roleStabilityScore: number;
  champStabilityScore: number;
}

// ── Smurf Detection ────────────────────────────────────────────────────────
export interface SmurfSignal {
  signal: string;
  detected: boolean;
  weight: number;
  description: string;
}

export interface SmurfReport {
  puuid: string;
  smurfProbabilityScore: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  signals: SmurfSignal[];
  summary: string;
  rankProgressionScore: number;
  winRateVsRankScore: number;
  mechanicalOutlierScore: number;
  accountAgeScore: number;
}
