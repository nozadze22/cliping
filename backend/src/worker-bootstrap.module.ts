import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './database/prisma.module.js';
import { WorkersModule } from './workers/workers.module.js';
import { redisConnectionFromEnv } from './queue/redis.connection.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: redisConnectionFromEnv(),
    }),
    PrismaModule,
    WorkersModule,
  ],
})
export class WorkerBootstrapModule {}
