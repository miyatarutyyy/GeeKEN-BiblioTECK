// GeeKEN_BiblioTECK/backend/src/users/users.service.ts

/*
 *
 */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { OnboardingDto } from './dto/onboarding.dto';
import { UserEntity, UserRole } from './entities/user.entity';

type PgError = { code?: string; constraint?: string; detail?: string };
type PgQueryFailed = QueryFailedError & { driverError?: PgError };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onboarding(
    authUser: { githubUserId: string; githubUsername: string },
    dto: OnboardingDto,
  ) {
    // もしそのユーザーが存在するならエラーを返す
    const existingUser = await this.userRepository.findOne({
      where: { githubUserId: authUser.githubUserId },
    });
    if (existingUser) {
      throw new ConflictException({
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
        details: {},
      });
    }

    // そのdiscordIdがすでに存在するならエラー
    const duplicateDiscordId = await this.userRepository.findOne({
      where: { discordId: dto.discordId },
    });
    if (duplicateDiscordId) {
      throw new ConflictException({
        code: 'DUPLICATE_DISCORD_ID',
        message: 'discordId is already used',
        details: { field: 'discordId' },
      });
    }
    // 例: discordName自動取得（モック）
    const discordName = `mock_${dto.discordId.slice(-4)}`;

    // user を作成
    const user = this.userRepository.create({
      githubUserId: authUser.githubUserId,
      githubUsername: authUser.githubUsername,
      displayName: dto.displayName,
      discordId: dto.discordId,
      discordName,
      role: UserRole.MEMBER,
      isActive: true,
    });

    try {
      const saved = await this.userRepository.save(user);
      return this.toUserResponse(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.mapUniqueConflict(error);
      }
      throw error;
    }
  }

  //
  async getMe(githubUserId: string) {
    const user = await this.userRepository.findOne({ where: { githubUserId } });

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

    return this.toUserResponse(user);
  }

  private isUniqueViolation(error: unknown): error is PgQueryFailed {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    return (error as PgQueryFailed).driverError?.code === '23505';
  }

  private mapUniqueConflict(error: PgQueryFailed): never {
    const constraint = error.driverError?.constraint;
    if (constraint === 'uq_users_github_user_id') {
      throw new ConflictException({
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
        details: {},
      });
    }
    if (constraint === 'uq_users_discord_id') {
      throw new ConflictException({
        code: 'DUPLICATE_DISCORD_ID',
        message: 'discordId is already used',
        details: { field: 'discordId' },
      });
    }
    throw new ConflictException({
      code: 'DUPLICATE_RESOURCE',
      message: 'Unique constraint violated',
      details: {},
    });
  }

  private toUserResponse(user: UserEntity) {
    return {
      id: user.id,
      githubUsername: user.githubUsername,
      displayName: user.displayName,
      discordId: user.discordId,
      discordName: user.discordName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
