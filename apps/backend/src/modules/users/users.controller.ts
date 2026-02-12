import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class UpdateRiotAccountDto {
  puuid: string;
  summonerName: string;
  region: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me/riot-account')
  @ApiOperation({ summary: 'Link Riot account to user profile' })
  linkRiotAccount(@Request() req: any, @Body() dto: UpdateRiotAccountDto) {
    return this.usersService.updateRiotAccount(
      req.user.id,
      dto.puuid,
      dto.summonerName,
      dto.region,
    );
  }
}
