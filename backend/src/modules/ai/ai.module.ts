import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiWebhookController } from './ai-webhook.controller';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: parseInt(process.env.N8N_REQUEST_TIMEOUT_MS || '120000', 10),
      maxRedirects: 5,
    }),
  ],
  controllers: [AiController, AiWebhookController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule { }
