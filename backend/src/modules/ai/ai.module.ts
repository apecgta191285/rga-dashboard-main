import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiAnalyticsService } from './ai-analytics.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AiController],
  providers: [AiService, AiAnalyticsService],
  exports: [AiService, AiAnalyticsService],
})
export class AiModule { }
