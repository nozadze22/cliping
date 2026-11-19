import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { VideosModule } from './modules/videos/videos.module.js';
import { redisConnectionFromEnv } from './queue/redis.connection.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BullModule.forRoot({
      connection: redisConnectionFromEnv(),
    }),
    PrismaModule,
    QueueModule,
    VideosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
