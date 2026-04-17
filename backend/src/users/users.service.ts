// GeeKEN_BiblioTECK/backend/src/users/users.service.ts

/*
 *
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class UsersService {
  async onboarding(
    authUser: { githubUserId: string; githubUsername: string },
    dto: OnboardingDto,
  ) {
    // 例: 既存チェック
    const alreadyExists = false; // repositoryで判定
    if (alreadyExists) {
      throw new ConflictException({
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
        details: {},
      });
    }

    // 例: discordId重複
    const duplicateDiscordId = false; // repositoryで判定
    if (duplicateDiscordId) {
      throw new ConflictException({
        code: 'DUPLICATE_DISCORD_ID',
        message: 'discordId is already used',
        details: { field: 'discordId' },
      });
    }

    // 例: discordName自動取得（モック）
    const discordName = `mock_${dto.discordId.slice(-4)}`;

    // repository保存...
    return {
      id: 'uuid',
      githubUsername: authUser.githubUsername,
      displayName: dto.displayName,
      discordId: dto.discordId,
      discordName,
      role: 'member',
      isActive: true,
    };
  }

  async getMe(githubUserId: string) {
    const user = null as any; // repositoryで取得
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: {},
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'USER_INACTIVE',
        message: 'User is inactive',
        details: { userId: user.id },
      });
    }

    return {
      id: user.id,
      githubUsername: user.githubUsername,
      displayName: user.displayName,
      discordId: user.discordId,
      discordName: user.discordName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
