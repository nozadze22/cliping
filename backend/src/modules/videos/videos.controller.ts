import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createVideoJobSchema,
  type CreateVideoJobInput,
} from '../../common/schemas/validation.schemas.js';
import { AuthService } from '../auth/auth.service.js';
import { VideosService } from './videos.service.js';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videos: VideosService,
    private readonly auth: AuthService,
  ) {}

  @Post('jobs')
  async createJob(
    @Body(new ZodValidationPipe(createVideoJobSchema)) body: CreateVideoJobInput,
    @Headers('cookie') cookie: string | undefined,
  ) {
    let userId: string | undefined;
    try {
      const user = await this.auth.getUserFromCookie(cookie);
      userId = user.id;
    } catch {
      userId = undefined;
    }

    const video = await this.videos.enqueue(body.sourceUrl, userId);
    return { id: video.id, status: video.status };
  }

  @Get(':id')
  getVideo(@Param('id') id: string) {
    return this.videos.findOne(id);
  }
}
