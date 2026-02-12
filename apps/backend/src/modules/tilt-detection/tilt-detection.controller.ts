import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TiltDetectionService } from './tilt-detection.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('tilt-detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tilt-detection')
export class TiltDetectionController {
  constructor(private readonly service: TiltDetectionService) {}

  @Get('report/:puuid')
  @ApiOperation({ summary: 'Get tilt & consistency report for a player' })
  @ApiQuery({ name: 'lookback', required: false, type: Number })
  getReport(
    @Param('puuid') puuid: string,
    @Query('lookback') lookback = 30,
  ) {
    return this.service.getTiltReport(puuid, Number(lookback));
  }
}
