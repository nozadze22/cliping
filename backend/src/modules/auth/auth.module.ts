import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionCookieService } from './session-cookie.service.js';

@Module({
  controllers: [AuthController],
  providers: [SessionCookieService, AuthService],
  exports: [SessionCookieService, AuthService],
})
export class AuthModule {}
