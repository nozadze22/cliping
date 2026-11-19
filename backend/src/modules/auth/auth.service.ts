import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import type { LoginInput } from '../../common/schemas/validation.schemas.js';
import { SessionCookieService } from './session-cookie.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionCookieService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      create: { email: input.email },
      update: {},
    });

    const token = await this.sessions.signSessionToken(user.id);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { user, token };
  }

  async logout(cookieHeader: string | undefined) {
    const token = this.sessions.readTokenFromHeader(cookieHeader);
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await this.prisma.session.deleteMany({ where: { tokenHash } });
    }
  }

  async getUserFromCookie(cookieHeader: string | undefined) {
    const token = this.sessions.readTokenFromHeader(cookieHeader);
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    const { userId } = await this.sessions.verifySessionToken(token);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.session.findFirst({
      where: { tokenHash, userId, expiresAt: { gt: new Date() } },
    });
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }
}
