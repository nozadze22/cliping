import { z } from 'zod';

export const createJobSchema = z.object({
  type: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const aiClipSchema = z.object({
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  title: z.string().min(1).max(200),
  summary: z.string().max(2_000).optional(),
});

export const aiOutputSchema = z.object({
  clips: z.array(aiClipSchema).min(1).max(20),
});

export const loginSchema = z.object({
  email: z.string().email().max(320),
});

export const createVideoJobSchema = z.object({
  sourceUrl: z.string().url().max(2_048),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type AiOutput = z.infer<typeof aiOutputSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVideoJobInput = z.infer<typeof createVideoJobSchema>;
