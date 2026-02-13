import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { ChampionStats } from '../../database/entities/champion-stats.entity';
import { SyncStatus, SyncState } from '../../database/entities/sync-status.entity';
import { RiotApiService, RoutingRegion } from '../riot-api/riot-api.service';
import { PLATFORM_TO_REGION } from '../users/users.service';

// Riot Dev API limits: 20 req/s, 100 req/2min
// We use 1200ms delay → ~50 req/min → well within limits
const API_DELAY_MS = 1200;

// How many matches to fetch per sync run
const MATCHES_PER_SYNC = 20;

// Minimum minutes between automatic syncs for the same user
const MIN_SYNC_INTERVAL_MINUTES = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SyncResult {
  puuid: string;
  added: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

@Injectable()
export class MatchSyncService {
  private readonly logger = new Logger(MatchSyncService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChampionStats)
    private readonly champStatsRepo: Repository<ChampionStats>,
    @InjectRepository(SyncStatus)
    private readonly syncStatusRepo: Repository<SyncStatus>,
    private readonly riotApi: RiotApiService,
  ) {}

  // ── Scheduled Job ─────────────────────────────────────────────────────────
  /**
   * Runs every 30 minutes. Syncs every user that:
   * - has a linked Riot account
   * - hasn't been synced in the last MIN_SYNC_INTERVAL_MINUTES
   * - isn't currently syncing
   */
  @Cron('0 */30 * * * *') // every 30 minutes
  async runScheduledSync() {
    this.logger.log('⏰ Scheduled match sync starting…');

    const users = await this.userRepo.find({
      where: { isActive: true },
    });

    const linkedUsers = users.filter((u) => u.riotPuuid && u.riotRegion);

    if (!linkedUsers.length) {
      this.logger.log('No linked users found — skipping sync');
      return;
    }

    this.logger.log(`Found ${linkedUsers.length} linked user(s) to check`);

    for (const user of linkedUsers) {
      const status = await this.getOrCreateSyncStatus(user);

      // Skip if currently syncing (e.g. manual trigger in progress)
      if (status.state === 'syncing') {
        this.logger.log(`⏭️  ${user.riotSummonerName} — already syncing, skip`);
        continue;
      }

      // Skip if synced recently
      if (status.lastSyncedAt) {
        const minutesSince =
          (Date.now() - status.lastSyncedAt.getTime()) / 1000 / 60;
        if (minutesSince < MIN_SYNC_INTERVAL_MINUTES) {
          this.logger.log(
            `⏭️  ${user.riotSummonerName} — synced ${Math.round(minutesSince)}min ago, skip`,
          );
          continue;
        }
      }

      await this.syncUser(user.riotPuuid, user.riotRegion, user.id);
      // Small pause between users to be respectful to the API
      await sleep(API_DELAY_MS * 2);
    }

    this.logger.log('✅ Scheduled match sync complete');
  }

  // ── Manual Trigger ────────────────────────────────────────────────────────
  /**
   * Triggered by the user from the Settings page.
   * Ignores the time-based cooldown.
   */
  async triggerManualSync(userId: string): Promise<SyncResult> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user?.riotPuuid || !user?.riotRegion) {
      throw new Error('No Riot account linked to this user');
    }

    const status = await this.getOrCreateSyncStatus(user);
    if (status.state === 'syncing') {
      throw new Error('Sync already in progress');
    }

    return this.syncUser(user.riotPuuid, user.riotRegion, userId);
  }

  // ── Get sync status for a user ─────────────────────────────────────────────
  async getSyncStatus(userId: string): Promise<SyncStatus | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.riotPuuid) return null;
    return this.syncStatusRepo.findOne({ where: { userId } });
  }

  // ── Core Sync Logic ───────────────────────────────────────────────────────
  private async syncUser(
    puuid: string,
    platform: string,
    userId: string,
  ): Promise<SyncResult> {
    const start = Date.now();
    const region = PLATFORM_TO_REGION[platform.toUpperCase()] as RoutingRegion;

    if (!region) {
      this.logger.error(`Unknown platform "${platform}" for PUUID ${puuid.slice(0, 8)}…`);
      return { puuid, added: 0, skipped: 0, errors: 1, durationMs: 0 };
    }

    this.logger.log(`🔄 Syncing ${puuid.slice(0, 8)}… (${platform})`);

    // Mark as syncing
    await this.setSyncState(userId, puuid, 'syncing');

    let added = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // 1. Fetch recent ranked solo/duo match IDs
      await sleep(API_DELAY_MS);
      const matchIds = await this.riotApi.getMatchIdsByPuuid(puuid, region, {
        count: MATCHES_PER_SYNC,
        queue: 420, // Ranked Solo/Duo
      });

      this.logger.log(`  Found ${matchIds.length} match IDs`);

      // 2. Filter out matches already in DB
      const existingIds = await this.matchRepo
        .createQueryBuilder('m')
        .select('m.matchId')
        .where('m.matchId IN (:...ids)', { ids: matchIds })
        .getMany();

      const existingSet = new Set(existingIds.map((m) => m.matchId));
      const newMatchIds = matchIds.filter((id) => !existingSet.has(id));
      skipped = matchIds.length - newMatchIds.length;

      this.logger.log(`  ${newMatchIds.length} new, ${skipped} already stored`);

      // 3. Fetch and save each new match
      for (const matchId of newMatchIds) {
        await sleep(API_DELAY_MS);
        try {
          const matchData = await this.riotApi.getMatchById(matchId, region);
          const saved = await this.saveMatch(matchData, puuid);
          if (saved) added++;
        } catch (err) {
          this.logger.warn(`  ⚠️ Failed to fetch ${matchId}: ${err.message}`);
          errors++;
        }
      }

      // 4. Aggregate ChampionStats if we added new matches
      if (added > 0) {
        await this.aggregateChampionStats(puuid);
      }

      // 5. Update sync status
      const total = await this.matchRepo.count({ where: { puuid } });
      await this.syncStatusRepo.upsert(
        {
          userId,
          puuid,
          state: 'idle' as SyncState,
          totalMatchesSynced: total,
          lastSyncAddedCount: added,
          lastSyncedAt: new Date(),
          latestMatchId: matchIds[0] ?? null,
          lastError: null,
        },
        ['puuid'],
      );

      const duration = Date.now() - start;
      this.logger.log(
        `  ✅ Done: +${added} new, ${skipped} skipped, ${errors} errors (${duration}ms)`,
      );

      return { puuid, added, skipped, errors, durationMs: duration };
    } catch (err) {
      this.logger.error(`  ❌ Sync failed for ${puuid.slice(0, 8)}…: ${err.message}`);
      await this.setSyncState(userId, puuid, 'error', err.message);
      return { puuid, added, skipped, errors: errors + 1, durationMs: Date.now() - start };
    }
  }

  // ── Parse + Save a single match ───────────────────────────────────────────
  private async saveMatch(
    matchData: any,
    puuid: string,
  ): Promise<boolean> {
    try {
      const info = matchData.info;
      const participant = info.participants.find(
        (p: any) => p.puuid === puuid,
      );

      if (!participant) {
        this.logger.warn(`PUUID not found in match ${matchData.metadata.matchId}`);
        return false;
      }

      const gameDurationSeconds = info.gameDuration;
      const gameDurationMinutes = gameDurationSeconds / 60;
      const cs =
        (participant.totalMinionsKilled ?? 0) +
        (participant.neutralMinionsKilled ?? 0);
      const csPerMinute = gameDurationMinutes > 0 ? cs / gameDurationMinutes : 0;

      const deaths = participant.deaths || 1; // avoid division by zero
      const kda =
        (participant.kills + participant.assists) / deaths;

      // Extract patch from game version string e.g. "14.10.123.4567" → "14.10"
      const patch = info.gameVersion
        ? info.gameVersion.split('.').slice(0, 2).join('.')
        : null;

      const match = this.matchRepo.create({
        matchId: matchData.metadata.matchId,
        puuid,
        championId: participant.championId,
        championName: participant.championName,
        lane: participant.lane ?? 'NONE',
        role: participant.role ?? 'NONE',
        win: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        kda: Math.round(kda * 100) / 100,
        totalDamageDealt: participant.totalDamageDealt ?? 0,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions ?? 0,
        goldEarned: participant.goldEarned ?? 0,
        cs,
        csPerMinute: Math.round(csPerMinute * 100) / 100,
        visionScore: participant.visionScore ?? 0,
        gameDuration: gameDurationSeconds,
        gameCreation: info.gameCreation,
        patch,
        rawData: participant,
      });

      await this.matchRepo.save(match);
      return true;
    } catch (err) {
      // Unique constraint violation = already exists, that's fine
      if (err.code === '23505') return false;
      throw err;
    }
  }

  // ── Aggregate ChampionStats ────────────────────────────────────────────────
  /**
   * Recalculates champion stats for a PUUID from the matches table.
   * Called after every sync that adds new matches.
   */
  private async aggregateChampionStats(puuid: string): Promise<void> {
    this.logger.log(`  📊 Aggregating champion stats for ${puuid.slice(0, 8)}…`);

    // Get all matches grouped by champion
    const matches = await this.matchRepo.find({ where: { puuid } });

    // Group by championName
    const byChamp = new Map<string, Match[]>();
    for (const m of matches) {
      const list = byChamp.get(m.championName) ?? [];
      list.push(m);
      byChamp.set(m.championName, list);
    }

    // Upsert ChampionStats for each champion
    for (const [championName, champMatches] of byChamp.entries()) {
      const gamesPlayed = champMatches.length;
      const wins = champMatches.filter((m) => m.win).length;
      const winRate = wins / gamesPlayed;
      const avgKda =
        champMatches.reduce((s, m) => s + m.kda, 0) / gamesPlayed;
      const avgCsPerMinute =
        champMatches.reduce((s, m) => s + m.csPerMinute, 0) / gamesPlayed;
      const avgVisionScore =
        champMatches.reduce((s, m) => s + m.visionScore, 0) / gamesPlayed;

      // Comfort pick = 20+ games on this champion
      const isComfortPick = gamesPlayed >= 20;

      // Matchup win rates: for each unique opposing champion in rawData
      const matchupWinRates: Record<string, number> = {};
      // (Advanced: parse from rawData in a future iteration)

      await this.champStatsRepo.upsert(
        {
          puuid,
          championId: champMatches[0].championId,
          championName,
          patch: null, // all-time aggregation
          gamesPlayed,
          wins,
          winRate: Math.round(winRate * 10000) / 10000,
          avgKda: Math.round(avgKda * 100) / 100,
          avgCsPerMinute: Math.round(avgCsPerMinute * 100) / 100,
          avgDamageShare: 0, // calculated separately when we have team data
          avgVisionScore: Math.round(avgVisionScore * 100) / 100,
          isComfortPick,
          matchupWinRates,
        },
        ['puuid', 'championId', 'patch'],
      );
    }

    this.logger.log(`  ✅ Champion stats updated for ${byChamp.size} champion(s)`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private async getOrCreateSyncStatus(user: User): Promise<SyncStatus> {
    let status = await this.syncStatusRepo.findOne({
      where: { userId: user.id },
    });

    if (!status) {
      status = this.syncStatusRepo.create({
        userId: user.id,
        puuid: user.riotPuuid,
        state: 'idle',
        totalMatchesSynced: 0,
        lastSyncAddedCount: 0,
        lastSyncedAt: null,
        latestMatchId: null,
        lastError: null,
      });
      await this.syncStatusRepo.save(status);
    }

    return status;
  }

  private async setSyncState(
    userId: string,
    puuid: string,
    state: SyncState,
    error?: string,
  ) {
    await this.syncStatusRepo.upsert(
      {
        userId,
        puuid,
        state,
        lastError: error ?? null,
      },
      ['puuid'],
    );
  }
}
