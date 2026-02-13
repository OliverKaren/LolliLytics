import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchSyncService } from './match-sync.service';
import { MatchSyncController } from './match-sync.controller';
import { Match } from '../../database/entities/match.entity';
import { User } from '../../database/entities/user.entity';
import { ChampionStats } from '../../database/entities/champion-stats.entity';
import { SyncStatus } from '../../database/entities/sync-status.entity';
import { RiotApiModule } from '../riot-api/riot-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, User, ChampionStats, SyncStatus]),
    RiotApiModule,
  ],
  providers: [MatchSyncService],
  controllers: [MatchSyncController],
  exports: [MatchSyncService],
})
export class MatchSyncModule {}
