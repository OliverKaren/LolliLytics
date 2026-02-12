import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RiotApiService } from './riot-api.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000 }),
    ConfigModule,
  ],
  providers: [RiotApiService],
  exports: [RiotApiService],
})
export class RiotApiModule {}
