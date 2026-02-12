import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceBenchmarkingController } from './performance-benchmarking.controller';
import { PerformanceBenchmarkingService } from './performance-benchmarking.service';
import { RiotApiModule } from '../riot-api/riot-api.module';
import { Match } from '../../database/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), RiotApiModule],
  controllers: [PerformanceBenchmarkingController],
  providers: [PerformanceBenchmarkingService],
  exports: [PerformanceBenchmarkingService],
})
export class PerformanceBenchmarkingModule {}
