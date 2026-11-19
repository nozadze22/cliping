import { Injectable } from '@nestjs/common';
import type { AiOutput } from '../../common/schemas/validation.schemas.js';

export type TranscriptSegment = {
  startMs: number;
  endMs: number;
  text: string;
};

export type AlignedClip = {
  startMs: number;
  endMs: number;
  title: string;
  summary?: string;
};

@Injectable()
export class TimestampAlignmentService {
  /** Snaps clip boundaries to nearest transcript segment edges for clean cuts/subtitles. */
  alignClips(
    segments: TranscriptSegment[],
    analysis: AiOutput,
  ): AlignedClip[] {
    if (segments.length === 0) {
      return analysis.clips.map((clip) => ({
        startMs: clip.startMs,
        endMs: clip.endMs,
        title: clip.title,
        summary: clip.summary,
      }));
    }

    return analysis.clips.map((clip) => ({
      startMs: this.snapToSegment(clip.startMs, segments, 'start'),
      endMs: this.snapToSegment(clip.endMs, segments, 'end'),
      title: clip.title,
      summary: clip.summary,
    }));
  }

  private snapToSegment(
    ms: number,
    segments: TranscriptSegment[],
    edge: 'start' | 'end',
  ): number {
    let best = ms;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const segment of segments) {
      const candidate = edge === 'start' ? segment.startMs : segment.endMs;
      const distance = Math.abs(candidate - ms);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }

    return best;
  }
}
