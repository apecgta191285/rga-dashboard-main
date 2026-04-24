import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService);
  
  console.log('--- Config Verification ---');
  console.log('GOOGLE_ADS_DEVELOPER_TOKEN:', config.get('GOOGLE_ADS_DEVELOPER_TOKEN'));
  console.log('GOOGLE_CLIENT_ID:', config.get('GOOGLE_CLIENT_ID'));
  
  await app.close();
}

bootstrap();
