import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service.js';
import { VIDEO_PIPELINE_QUEUE } from '../../queue/queue.constants.js';
import type { VideoPipelineJobData } from '../../workers/video-pipeline.processor.js';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(VIDEO_PIPELINE_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueue(sourceUrl: string, userId?: string) {
    const video = await this.prisma.video.create({
      data: { sourceUrl, userId, status: 'queued' },
    });

    await this.prisma.backgroundJob.create({
      data: {
        queue: VIDEO_PIPELINE_QUEUE,
        status: 'queued',
        payload: { videoId: video.id },
      },
    });

    await this.queue.add('process', { videoId: video.id } satisfies VideoPipelineJobData);

    return video;
  }

  findOne(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
      include: { clips: true },
    });
  }
}
