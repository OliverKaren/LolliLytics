import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';
import { DraftIntelligenceService } from './draft-intelligence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

class AnalyzePickDto {
  @IsString() @IsNotEmpty()
  puuid: string;

  @IsString() @IsNotEmpty()
  championName: string;

  @IsOptional() @IsString()
  enemyChampionName?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  allyChampions?: string[];

  @IsOptional() @IsString()
  patch?: string;
}

class AnalyzeDraftDto {
  @IsString() @IsNotEmpty()
  puuid: string;

  @IsString() @IsNotEmpty()
  myChampion: string;

  @IsArray() @IsString({ each: true })
  allyChampions: string[];

  @IsArray() @IsString({ each: true })
  enemyChampions: string[];

  @IsOptional() @IsString()
  patch?: string;
}

@ApiTags('draft-intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('draft-intelligence')
export class DraftIntelligenceController {
  constructor(private readonly service: DraftIntelligenceService) {}

  @Post('analyze-pick')
  @ApiOperation({ summary: 'Analyze a single champion pick for a player' })
  analyzePick(@Body() dto: AnalyzePickDto) {
    return this.service.analyzePickForPlayer(
      dto.puuid,
      dto.championName,
      dto.enemyChampionName,
      dto.allyChampions,
      dto.patch,
    );
  }

  @Post('analyze-draft')
  @ApiOperation({ summary: 'Analyze full draft state for a player' })
  analyzeDraft(@Body() dto: AnalyzeDraftDto) {
    return this.service.analyzeDraftSession(
      dto.puuid,
      dto.myChampion,
      dto.allyChampions,
      dto.enemyChampions,
      dto.patch,
    );
  }

  @Get('champion-stats/:puuid/:championName')
  @ApiOperation({ summary: 'Get aggregated champion stats for a player' })
  getChampionStats(
    @Param('puuid') puuid: string,
    @Param('championName') championName: string,
    @Query('patch') patch?: string,
  ) {
    return this.service.analyzePickForPlayer(puuid, championName, undefined, undefined, patch);
  }
}
