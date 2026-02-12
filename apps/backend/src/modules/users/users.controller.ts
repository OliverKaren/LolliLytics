import {
  Controller, Get, Post, Delete, Body, UseGuards, Request,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { UsersService, PLATFORMS } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class LinkRiotAccountDto {
  /** e.g. "OliverKaren" */
  @IsString()
  @IsNotEmpty()
  gameName: string;

  /** e.g. "EUW" or "1234" */
  @IsString()
  @IsNotEmpty()
  tagLine: string;

  /** e.g. "EUW1", "NA1", "KR" */
  @IsString()
  @IsNotEmpty()
  platform: string;
}

class ResolveRiotIdDto {
  @IsString()
  @IsNotEmpty()
  gameName: string;

  @IsString()
  @IsNotEmpty()
  tagLine: string;

  @IsString()
  @IsNotEmpty()
  platform: string;
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

  @Post('me/riot-account')
  @ApiOperation({
    summary: 'Link a Riot account by Riot ID (gameName + tagLine + platform)',
    description: `Resolves the PUUID via the Riot Account API and stores it on the user profile.
    
Valid platforms: ${PLATFORMS.join(', ')}

Example: gameName="OliverKaren", tagLine="EUW", platform="EUW1"`,
  })
  @ApiBody({ type: LinkRiotAccountDto })
  linkRiotAccount(@Request() req: any, @Body() dto: LinkRiotAccountDto) {
    return this.usersService.linkRiotAccountByGameName(
      req.user.id,
      dto.gameName,
      dto.tagLine,
      dto.platform,
    );
  }

  @Delete('me/riot-account')
  @ApiOperation({ summary: 'Unlink Riot account from user profile' })
  unlinkRiotAccount(@Request() req: any) {
    return this.usersService.unlinkRiotAccount(req.user.id);
  }

  @Post('resolve-riot-id')
  @ApiOperation({
    summary: 'Resolve a Riot ID to PUUID without linking (for scouting)',
  })
  @ApiBody({ type: ResolveRiotIdDto })
  resolveRiotId(@Body() dto: ResolveRiotIdDto) {
    return this.usersService.resolveRiotId(dto.gameName, dto.tagLine, dto.platform);
  }
}
