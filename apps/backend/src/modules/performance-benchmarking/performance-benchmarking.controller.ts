import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PerformanceBenchmarkingService } from './performance-benchmarking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceBenchmarkingController {
  constructor(private readonly service: PerformanceBenchmarkingService) {}

  @Get('report/:puuid')
  @ApiOperation({ summary: 'Get full performance benchmarking report' })
  @ApiQuery({ name: 'period', enum: ['last20', 'last50', 'season'], required: false })
  getReport(
    @Param('puuid') puuid: string,
    @Query('period') period: 'last20' | 'last50' | 'season' = 'last20',
  ) {
    return this.service.getPerformanceReport(puuid, period);
  }
}
