import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { loginSchema, type LoginInput } from '../../common/schemas/validation.schemas.js';
import { AuthService } from './auth.service.js';
import { SessionCookieService } from './session-cookie.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionCookieService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(body);
    res.setHeader('Set-Cookie', this.sessions.cookieHeader(token));
    return { id: user.id, email: user.email };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(cookie);
    res.setHeader('Set-Cookie', this.sessions.clearCookieHeader());
  }

  @Get('me')
  async me(@Headers('cookie') cookie: string | undefined) {
    const user = await this.auth.getUserFromCookie(cookie);
    return { id: user.id, email: user.email };
  }
}
