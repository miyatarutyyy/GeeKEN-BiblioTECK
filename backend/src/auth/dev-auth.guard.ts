import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthUser } from './types/auth-user.type';
import { IS_PUBLIC_KEY } from './public.decorator';

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();

    const githubUserId = this.pickHeader(
      req.headers['x-dev-github-user-id'],
    )?.trim();
    if (!githubUserId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'x-dev-github-user-id header is required',
        details: {},
      });
    }

    const githubUsername =
      this.pickHeader(req.headers['x-dev-github-user-id'])?.trim() ||
      'dev_user';
    req.user = { githubUserId, githubUsername };
    return true;
  }

  private pickHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
