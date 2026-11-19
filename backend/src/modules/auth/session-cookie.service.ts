import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseCookie, stringifySetCookie } from 'cookie';
import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE = 'youshorts_session';

@Injectable()
export class SessionCookieService {
  constructor(private readonly config: ConfigService) {}

  async signSessionToken(userId: string): Promise<string> {
    const secret = this.config.get<string>(
      'SESSION_SECRET',
      'development-only-change-me',
    );
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));
  }

  cookieHeader(token: string): string {
    return stringifySetCookie({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  clearCookieHeader(): string {
    return stringifySetCookie({
      name: SESSION_COOKIE,
      value: '',
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  readTokenFromHeader(cookieHeader: string | undefined): string | undefined {
    if (!cookieHeader) return undefined;
    return parseCookie(cookieHeader)[SESSION_COOKIE];
  }

  async verifySessionToken(token: string): Promise<{ userId: string }> {
    const secret = this.config.get<string>(
      'SESSION_SECRET',
      'development-only-change-me',
    );
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const userId = payload.userId;
    if (typeof userId !== 'string') {
      throw new Error('Invalid session payload');
    }
    return { userId };
  }
}
