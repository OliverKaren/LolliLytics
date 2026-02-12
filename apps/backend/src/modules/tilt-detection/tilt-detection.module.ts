import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiltDetectionController } from './tilt-detection.controller';
import { TiltDetectionService } from './tilt-detection.service';
import { Match } from '../../database/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  controllers: [TiltDetectionController],
  providers: [TiltDetectionService],
  exports: [TiltDetectionService],
})
export class TiltDetectionModule {}
