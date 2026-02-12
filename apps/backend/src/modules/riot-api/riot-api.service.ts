import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// Routing regions for Account API
type RoutingRegion = 'europe' | 'americas' | 'asia' | 'sea';

@Injectable()
export class RiotApiService {
  private readonly logger = new Logger(RiotApiService.name);
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('RIOT_API_KEY', '');
  }

  private get headers() {
    return { 'X-Riot-Token': this.apiKey };
  }

  private async get<T>(url: string): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<T>(url, { headers: this.headers }),
      );
      return data;
    } catch (err) {
      const status = err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err.response?.data?.status?.message || err.message;
      this.logger.error(`Riot API error [${status}]: ${message} — ${url}`);
      throw new HttpException(`Riot API: ${message}`, status);
    }
  }

  private routingUrl(region: RoutingRegion): string {
    return `https://${region}.api.riotgames.com`;
  }

  private platformUrl(platform: string): string {
    return `https://${platform.toLowerCase()}.api.riotgames.com`;
  }

  // ── Account API ────────────────────────────────────────────────────────
  /**
   * Look up an account by Riot ID (gameName + tagLine).
   * @param region - routing region: europe | americas | asia | sea
   */
  async getAccountByRiotId(
    gameName: string,
    tagLine: string,
    region: RoutingRegion = 'europe',
  ) {
    const base = this.routingUrl(region);
    const url = `${base}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.get<{ puuid: string; gameName: string; tagLine: string }>(url);
  }

  async getAccountByPuuid(puuid: string, region: RoutingRegion = 'europe') {
    const base = this.routingUrl(region);
    const url = `${base}/riot/account/v1/accounts/by-puuid/${puuid}`;
    return this.get<{ puuid: string; gameName: string; tagLine: string }>(url);
  }

  // ── Summoner API ───────────────────────────────────────────────────────
  /** @param platform - e.g. 'euw1', 'na1', 'kr' */
  async getSummonerByPuuid(puuid: string, platform: string) {
    const url = `${this.platformUrl(platform)}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.get<any>(url);
  }

  // ── League API ─────────────────────────────────────────────────────────
  async getLeagueEntriesBySummonerId(summonerId: string, platform: string) {
    const url = `${this.platformUrl(platform)}/lol/league/v4/entries/by-summoner/${summonerId}`;
    return this.get<any[]>(url);
  }

  // ── Match API ──────────────────────────────────────────────────────────
  async getMatchIdsByPuuid(
    puuid: string,
    region: RoutingRegion,
    options: {
      count?: number;
      start?: number;
      queue?: number; // 420 = Ranked Solo/Duo
      type?: string;
    } = {},
  ): Promise<string[]> {
    const params = new URLSearchParams({
      count: String(options.count ?? 20),
      start: String(options.start ?? 0),
      ...(options.queue && { queue: String(options.queue) }),
      ...(options.type && { type: options.type }),
    });
    const url = `${this.routingUrl(region)}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`;
    return this.get<string[]>(url);
  }

  async getMatchById(matchId: string, region: RoutingRegion) {
    const url = `${this.routingUrl(region)}/lol/match/v5/matches/${matchId}`;
    return this.get<any>(url);
  }

  async getMatchTimeline(matchId: string, region: RoutingRegion) {
    const url = `${this.routingUrl(region)}/lol/match/v5/matches/${matchId}/timeline`;
    return this.get<any>(url);
  }

  // ── Spectator API ──────────────────────────────────────────────────────
  async getLiveGame(summonerId: string, platform: string) {
    const url = `${this.platformUrl(platform)}/lol/spectator/v4/active-games/by-summoner/${summonerId}`;
    return this.get<any>(url);
  }
}
