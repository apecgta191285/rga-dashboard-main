import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiWebhookController } from './ai-webhook.controller';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AiController, AiWebhookController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule { }
