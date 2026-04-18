// GeeKEN_BiblioTECK/backend/src/users/users.controller.ts

/*
 * OnboardingDto で displayName と discord を検証
 * 検証通過後に usersService.onboarding(...) を呼ぶ
 * GET /users/me の流れ
 * req.user.githubUserId をサービスに渡す。
 */
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { OnboardingDto } from './dto/onboarding.dto';
import { Request } from 'express';

import { UsersService } from './users.service';
import { AuthUser } from '../auth/types/auth-user.type';

type AuthenticatedRequest = Request & { user: AuthUser };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboarding')
  async onboarding(
    @Req() req: AuthenticatedRequest,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.onboarding(req.user, dto);
  }

  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.githubUserId);
  }
}
