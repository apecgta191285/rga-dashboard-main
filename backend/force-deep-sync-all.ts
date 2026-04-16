import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UnifiedSyncService } from './src/modules/sync/unified-sync.service';

async function bootstrap() {
  console.log("=== Starting Global Unified Sync for All Platforms ===");
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncService = app.get(UnifiedSyncService);

  try {
    const results = await syncService.syncAll();
    console.log("Sync Results:", JSON.stringify(results, null, 2));
  } catch (error: any) {
    console.error("Sync failed:", error.message);
  }

  console.log("=== All Syncs Completed ===");
  await app.close();
}

bootstrap();
