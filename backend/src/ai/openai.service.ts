import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import OpenAI from 'openai';
import { z } from 'zod';
import {
  aiOutputSchema,
  type AiOutput,
} from '../common/schemas/validation.schemas.js';
import type { TranscriptSegment } from './alignment/timestamp-alignment.service.js';

const whisperSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

const whisperVerboseSchema = z.object({
  segments: z.array(whisperSegmentSchema).optional(),
  text: z.string().optional(),
});

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribeGeorgian(audioPath: string): Promise<TranscriptSegment[]> {
    const transcription = await this.client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: 'whisper-1',
      language: 'ka',
      response_format: 'verbose_json',
    });

    const parsed = whisperVerboseSchema.parse(transcription);
    const segments = parsed.segments ?? [];

    if (segments.length > 0) {
      return segments.map((s) => ({
        startMs: Math.round(s.start * 1000),
        endMs: Math.round(s.end * 1000),
        text: s.text.trim(),
      }));
    }

    return [
      {
        startMs: 0,
        endMs: 0,
        text: parsed.text?.trim() ?? '',
      },
    ];
  }

  async detectClips(segments: TranscriptSegment[]): Promise<AiOutput> {
    const transcript = segments
      .map((s) => `[${s.startMs}-${s.endMs}] ${s.text}`)
      .join('\n');

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You identify meaningful short-form clips from Georgian video transcripts. Respond with JSON matching schema: { "clips": [{ "startMs": number, "endMs": number, "title": string, "summary"?: string }] }',
        },
        { role: 'user', content: transcript },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('OpenAI returned empty analysis');
    }

    return aiOutputSchema.parse(JSON.parse(raw));
  }
}
