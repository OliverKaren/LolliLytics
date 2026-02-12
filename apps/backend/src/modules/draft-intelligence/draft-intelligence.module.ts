import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftIntelligenceController } from './draft-intelligence.controller';
import { DraftIntelligenceService } from './draft-intelligence.service';
import { RiotApiModule } from '../riot-api/riot-api.module';
import { ChampionStats } from '../../database/entities/champion-stats.entity';
import { Match } from '../../database/entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChampionStats, Match]),
    RiotApiModule,
  ],
  controllers: [DraftIntelligenceController],
  providers: [DraftIntelligenceService],
  exports: [DraftIntelligenceService],
})
export class DraftIntelligenceModule {}
