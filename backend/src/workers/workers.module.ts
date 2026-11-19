import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module.js';
import { AlignmentModule } from '../ai/alignment/alignment.module.js';
import { MediaModule } from '../modules/media/media.module.js';
import { VIDEO_PIPELINE_QUEUE } from '../queue/queue.constants.js';
import { StorageModule } from '../storage/storage.module.js';
import { YoutubeModule } from '../modules/youtube/youtube.module.js';
import { VideoPipelineProcessor } from './video-pipeline.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: VIDEO_PIPELINE_QUEUE }),
    YoutubeModule,
    MediaModule,
    AiModule,
    AlignmentModule,
    StorageModule,
  ],
  providers: [VideoPipelineProcessor],
})
export class WorkersModule {}
