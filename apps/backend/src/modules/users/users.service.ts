import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RiotApiService, RoutingRegion } from '../riot-api/riot-api.service';

// Platform → routing region map — values are typed as RoutingRegion
// so TypeScript accepts them directly in getAccountByRiotId()
export const PLATFORM_TO_REGION: Record<string, RoutingRegion> = {
  EUW1: 'europe',
  EUN1: 'europe',
  TR1:  'europe',
  RU:   'europe',
  NA1:  'americas',
  BR1:  'americas',
  LA1:  'americas',
  LA2:  'americas',
  KR:   'asia',
  JP1:  'asia',
  OC1:  'sea',
};

export const PLATFORMS = Object.keys(PLATFORM_TO_REGION);

export interface LinkedRiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
  platform: string;
  region: RoutingRegion;
  summonerName: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly riotApi: RiotApiService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  /**
   * Takes a Riot ID (gameName + tagLine) and platform (e.g. EUW1),
   * resolves the PUUID via Riot API and stores it on the user.
   */
  async linkRiotAccountByGameName(
    userId: string,
    gameName: string,
    tagLine: string,
    platform: string,
  ): Promise<User> {
    const upperPlatform = platform.toUpperCase();
    const region = PLATFORM_TO_REGION[upperPlatform];

    if (!region) {
      throw new BadRequestException(
        `Unknown platform "${platform}". Valid: ${PLATFORMS.join(', ')}`,
      );
    }

    // Resolve PUUID via Riot Account API (continent routing)
    const account = await this.riotApi.getAccountByRiotId(
      gameName,
      tagLine,
      region, // now typed as RoutingRegion — no more TS2345
    );

    // Fetch summoner details (optional — Riot ID is sufficient)
    try {
      await this.riotApi.getSummonerByPuuid(
        account.puuid,
        upperPlatform.toLowerCase(),
      );
    } catch {
      // Summoner endpoint is optional
    }

    await this.userRepo.update(userId, {
      riotPuuid: account.puuid,
      riotSummonerName: `${account.gameName}#${account.tagLine}`,
      riotRegion: upperPlatform,
    });

    return this.findById(userId);
  }

  /**
   * Look up a Riot ID without linking (for scouting / smurf detection).
   */
  async resolveRiotId(
    gameName: string,
    tagLine: string,
    platform: string,
  ): Promise<LinkedRiotAccount> {
    const upperPlatform = platform.toUpperCase();
    const region = PLATFORM_TO_REGION[upperPlatform];

    if (!region) {
      throw new BadRequestException(`Unknown platform "${platform}"`);
    }

    const account = await this.riotApi.getAccountByRiotId(
      gameName,
      tagLine,
      region,
    );

    return {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      platform: upperPlatform,
      region,
      summonerName: `${account.gameName}#${account.tagLine}`,
    };
  }

  async unlinkRiotAccount(userId: string): Promise<User> {
    await this.userRepo.update(userId, {
      riotPuuid: null,
      riotSummonerName: null,
      riotRegion: null,
    });
    return this.findById(userId);
  }
}
