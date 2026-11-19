import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TimestampAlignmentService } from '../ai/alignment/timestamp-alignment.service.js';
import { OpenAiService } from '../ai/openai.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { FfmpegService } from '../modules/media/ffmpeg.service.js';
import { VIDEO_PIPELINE_QUEUE } from '../queue/queue.constants.js';
import { R2Service } from '../storage/r2.service.js';
import { YoutubeService } from '../modules/youtube/youtube.service.js';

export type VideoPipelineJobData = {
  videoId: string;
};

@Processor(VIDEO_PIPELINE_QUEUE)
export class VideoPipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoPipelineProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtube: YoutubeService,
    private readonly ffmpeg: FfmpegService,
    private readonly openai: OpenAiService,
    private readonly alignment: TimestampAlignmentService,
    private readonly r2: R2Service,
  ) {
    super();
  }

  async process(job: Job<VideoPipelineJobData>): Promise<void> {
    const { videoId } = job.data;
    const video = await this.prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    });

    try {
      await this.setStatus(videoId, 'downloading');
      const sourcePath = await this.youtube.downloadVideo(
        video.sourceUrl,
        videoId,
      );
      const r2KeyOriginal = `videos/${videoId}/original`;
      await this.r2.uploadFromPath(r2KeyOriginal, sourcePath, 'video/mp4');

      await this.setStatus(videoId, 'extracting_audio');
      const audioPath = await this.ffmpeg.extractAudio(sourcePath, videoId);
      const r2KeyAudio = `videos/${videoId}/audio.mp3`;
      await this.r2.uploadFromPath(r2KeyAudio, audioPath, 'audio/mpeg');

      await this.setStatus(videoId, 'transcribing');
      const segments = await this.openai.transcribeGeorgian(audioPath);

      await this.setStatus(videoId, 'analyzing');
      const analysis = await this.openai.detectClips(segments);
      const aligned = this.alignment.alignClips(segments, analysis);

      await this.setStatus(videoId, 'rendering');
      for (const clip of aligned) {
        const created = await this.prisma.clip.create({
          data: {
            videoId,
            startMs: clip.startMs,
            endMs: clip.endMs,
            title: clip.title,
            summary: clip.summary,
          },
        });

        const clipPath = await this.ffmpeg.renderClip(
          sourcePath,
          videoId,
          created.id,
          clip.startMs,
          clip.endMs,
        );
        const r2Key = `videos/${videoId}/clips/${created.id}.mp4`;
        await this.r2.uploadFromPath(r2Key, clipPath, 'video/mp4');
        await this.prisma.clip.update({
          where: { id: created.id },
          data: { r2Key },
        });
      }

      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'done',
          r2KeyOriginal,
          r2KeyAudio,
          transcript: segments,
          errorMessage: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Pipeline failed for ${videoId}: ${message}`);
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'failed', errorMessage: message },
      });
      throw error;
    }
  }

  private setStatus(videoId: string, status: string) {
    return this.prisma.video.update({ where: { id: videoId }, data: { status } });
  }
}
