import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

@Injectable()
export class FfmpegService {
  private readonly ffmpegPath: string;
  private readonly workDir: string;

  constructor(config: ConfigService) {
    this.ffmpegPath = config.get<string>('FFMPEG_PATH', 'ffmpeg');
    this.workDir = config.get<string>('WORK_DIR', join(process.cwd(), 'tmp'));
  }

  async extractAudio(videoPath: string, videoId: string): Promise<string> {
    const outputPath = join(this.workDir, videoId, 'audio.mp3');
    await mkdir(dirname(outputPath), { recursive: true });

    await this.run(this.ffmpegPath, [
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-q:a',
      '2',
      outputPath,
    ]);

    return outputPath;
  }

  async renderClip(
    videoPath: string,
    videoId: string,
    clipId: string,
    startMs: number,
    endMs: number,
  ): Promise<string> {
    const outputPath = join(this.workDir, videoId, `clip-${clipId}.mp4`);
    await mkdir(dirname(outputPath), { recursive: true });

    const start = (startMs / 1000).toFixed(3);
    const duration = ((endMs - startMs) / 1000).toFixed(3);

    await this.run(this.ffmpegPath, [
      '-y',
      '-ss',
      start,
      '-i',
      videoPath,
      '-t',
      duration,
      '-c',
      'copy',
      outputPath,
    ]);

    return outputPath;
  }

  private run(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit' });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} exited with code ${code}`));
      });
    });
  }
}
