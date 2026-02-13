import { Controller, Post, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MatchSyncService } from './match-sync.service';

@ApiTags('match-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('match-sync')
export class MatchSyncController {
  constructor(private readonly syncService: MatchSyncService) {}

  @Post('trigger')
  @HttpCode(200)
  @ApiOperation({ summary: 'Manually trigger a match sync for the current user' })
  triggerSync(@Request() req: any) {
    return this.syncService.triggerManualSync(req.user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get sync status for the current user' })
  getStatus(@Request() req: any) {
    return this.syncService.getSyncStatus(req.user.id);
  }
}
