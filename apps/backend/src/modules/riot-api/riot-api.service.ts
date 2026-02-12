import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RiotApiService {
  private readonly logger = new Logger(RiotApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('RIOT_API_KEY', '');
    this.baseUrl = this.config.get<string>(
      'RIOT_API_BASE_URL',
      'https://europe.api.riotgames.com',
    );
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

  // ── Account API ────────────────────────────────────────────────────────
  async getAccountByRiotId(gameName: string, tagLine: string) {
    const url = `${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    return this.get<{ puuid: string; gameName: string; tagLine: string }>(url);
  }

  async getAccountByPuuid(puuid: string) {
    const url = `${this.baseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`;
    return this.get<{ puuid: string; gameName: string; tagLine: string }>(url);
  }

  // ── Summoner API ───────────────────────────────────────────────────────
  async getSummonerByPuuid(puuid: string, region: string) {
    const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return this.get<any>(url);
  }

  // ── League API ─────────────────────────────────────────────────────────
  async getLeagueEntriesBySummonerId(summonerId: string, region: string) {
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
    return this.get<any[]>(url);
  }

  // ── Match API ──────────────────────────────────────────────────────────
  async getMatchIdsByPuuid(
    puuid: string,
    options: {
      count?: number;
      start?: number;
      queue?: number; // 420 = Ranked Solo
      type?: string;
    } = {},
  ): Promise<string[]> {
    const params = new URLSearchParams({
      count: String(options.count || 20),
      start: String(options.start || 0),
      ...(options.queue && { queue: String(options.queue) }),
      ...(options.type && { type: options.type }),
    });
    const url = `${this.baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`;
    return this.get<string[]>(url);
  }

  async getMatchById(matchId: string) {
    const url = `${this.baseUrl}/lol/match/v5/matches/${matchId}`;
    return this.get<any>(url);
  }

  async getMatchTimeline(matchId: string) {
    const url = `${this.baseUrl}/lol/match/v5/matches/${matchId}/timeline`;
    return this.get<any>(url);
  }

  // ── Spectator API ──────────────────────────────────────────────────────
  async getLiveGame(summonerId: string, region: string) {
    const url = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`;
    return this.get<any>(url);
  }
}
