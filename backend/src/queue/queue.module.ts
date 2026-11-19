import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VIDEO_PIPELINE_QUEUE } from './queue.constants.js';
import { QueueService } from './queue.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'default' }),
    BullModule.registerQueue({ name: VIDEO_PIPELINE_QUEUE }),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
