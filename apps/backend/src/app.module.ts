import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RiotApiModule } from './modules/riot-api/riot-api.module';
import { MatchSyncModule } from './modules/match-sync/match-sync.module';
import { DraftIntelligenceModule } from './modules/draft-intelligence/draft-intelligence.module';
import { PerformanceBenchmarkingModule } from './modules/performance-benchmarking/performance-benchmarking.module';
import { TiltDetectionModule } from './modules/tilt-detection/tilt-detection.module';
import { SmurfDetectionModule } from './modules/smurf-detection/smurf-detection.module';
import { databaseConfig } from './config/database.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env.local', '../../.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 60 * 5,
        store: 'memory',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 10  },
      { name: 'medium', ttl: 10000, limit: 50  },
      { name: 'long',   ttl: 60000, limit: 200 },
    ]),

    ScheduleModule.forRoot(),

    // ── Feature Modules ──────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    RiotApiModule,
    MatchSyncModule,   // ← neu
    DraftIntelligenceModule,
    PerformanceBenchmarkingModule,
    TiltDetectionModule,
    SmurfDetectionModule,
  ],
})
export class AppModule {}
