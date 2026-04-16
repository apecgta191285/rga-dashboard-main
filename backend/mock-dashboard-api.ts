import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DashboardService } from './src/modules/dashboard/dashboard.service';
import { UserRole } from '@prisma/client';
import { PeriodEnum } from './src/modules/dashboard/dto/dashboard-overview.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(DashboardService);

  const tenantId = '76d08743-44ef-47be-9109-a1db4852d164';
  const role = UserRole.CLIENT;

  console.log(`=== Mocking Dashboard API for tenant ${tenantId} ===`);
  
  try {
      const result = await service.getOverview(
          { tenantId, role },
          { period: PeriodEnum.LAST_MONTH }
      );
      
      console.log("Success:", result.success);
      console.log("Summary Cost:", result.data.summary.totalCost);
      console.log("Recent Campaigns Count:", result.data.recentCampaigns.length);
      result.data.recentCampaigns.forEach((c: any) => {
          console.log(`  - [${c.platform}] ${c.name} | Spending: ${c.spending}`);
      });
  } catch (err: any) {
      console.error("API Call Failed:", err.message);
  }

  await app.close();
}

bootstrap();
