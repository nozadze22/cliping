import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { QueueModule } from '../../queue/queue.module.js';
import { VideosController } from './videos.controller.js';
import { VideosService } from './videos.service.js';

@Module({
  imports: [QueueModule, AuthModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
