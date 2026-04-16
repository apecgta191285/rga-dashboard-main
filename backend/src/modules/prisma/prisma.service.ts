import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    let url = process.env.DATABASE_URL || '';

    // ลบ sslmode ออกจาก URL เพื่อป้องกันการตีกันกับ ssl object ด้านล่าง
    const cleanUrl = url.replace('?sslmode=require', '').replace('&sslmode=require', '');

    // บังคับใช้ SSL ที่ Hostinger ยอมรับ
    const pool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
    });

    const adapter = new PrismaPg(pool as any);

    super({
      adapter,
      log: ['query', 'warn', 'error'], // เปิด log เพื่อดูการเรียก Query ชัดๆ
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
