import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

@Injectable()
export class YoutubeService {
  private readonly ytDlpPath: string;
  private readonly workDir: string;

  constructor(config: ConfigService) {
    this.ytDlpPath = config.get<string>('YT_DLP_PATH', 'yt-dlp');
    this.workDir = config.get<string>('WORK_DIR', join(process.cwd(), 'tmp'));
  }

  async downloadVideo(sourceUrl: string, videoId: string): Promise<string> {
    const outputPath = join(this.workDir, videoId, 'source.%(ext)s');
    await mkdir(dirname(outputPath), { recursive: true });

    await this.run(this.ytDlpPath, [
      '--no-playlist',
      '-f',
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '-o',
      outputPath,
      sourceUrl,
    ]);

    const dir = join(this.workDir, videoId);
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(dir);
    const source = files.find((f) => f.startsWith('source.'));
    if (!source) {
      throw new Error('yt-dlp did not produce a source file');
    }
    return join(dir, source);
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
