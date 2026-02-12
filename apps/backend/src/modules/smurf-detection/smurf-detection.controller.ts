import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SmurfDetectionService } from './smurf-detection.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('smurf-detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('smurf-detection')
export class SmurfDetectionController {
  constructor(private readonly service: SmurfDetectionService) {}

  @Get('report/:puuid')
  @ApiOperation({ summary: 'Get smurf / hidden MMR detection report' })
  getReport(@Param('puuid') puuid: string) {
    return this.service.getSmurfReport(puuid);
  }
}
