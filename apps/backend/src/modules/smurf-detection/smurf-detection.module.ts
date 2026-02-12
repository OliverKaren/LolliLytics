import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmurfDetectionController } from './smurf-detection.controller';
import { SmurfDetectionService } from './smurf-detection.service';
import { Match } from '../../database/entities/match.entity';
import { RiotApiModule } from '../riot-api/riot-api.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), RiotApiModule],
  controllers: [SmurfDetectionController],
  providers: [SmurfDetectionService],
  exports: [SmurfDetectionService],
})
export class SmurfDetectionModule {}
