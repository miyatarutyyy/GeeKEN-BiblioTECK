import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { DevAuthGuard } from './dev-auth.guard';
import { AuthUser } from './types/auth-user.type';

type RequestWithUser = Request & { user?: AuthUser };

describe('DevAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn<boolean | undefined, [string, unknown[]]>(),
  };

  let guard: DevAuthGuard;

  const createContext = (req: RequestWithUser): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new DevAuthGuard(reflector as unknown as Reflector);
  });

  it('sets request.user when required headers are valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      headers: {
        'x-dev-github-user-id': '12345',
        'x-dev-github-username': 'geeken-user',
      },
    } as unknown as RequestWithUser;
    const context = createContext(req);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.user).toEqual({
      githubUserId: '12345',
      githubUsername: 'geeken-user',
    });
  });

  it('throws 401 when x-dev-github-user-id is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      headers: {
        'x-dev-github-username': 'geeken-user',
      },
    } as unknown as RequestWithUser;
    const context = createContext(req);

    try {
      guard.canActivate(context);
      throw new Error('Expected UnauthorizedException');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      const response = (error as UnauthorizedException).getResponse();
      expect(response).toEqual({
        code: 'UNAUTHORIZED',
        message: 'x-dev-github-user-id header is required',
        details: {},
      });
    }
  });

  it('throws 401 when x-dev-github-user-id is blank', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      headers: {
        'x-dev-github-user-id': '   ',
      },
    } as unknown as RequestWithUser;
    const context = createContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('uses default username when x-dev-github-username is missing or blank', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    const reqWithoutUsername = {
      headers: {
        'x-dev-github-user-id': '12345',
      },
    } as unknown as RequestWithUser;
    const contextWithoutUsername = createContext(reqWithoutUsername);
    guard.canActivate(contextWithoutUsername);
    expect(reqWithoutUsername.user?.githubUsername).toBe('dev_user');

    const reqWithBlankUsername = {
      headers: {
        'x-dev-github-user-id': '12345',
        'x-dev-github-username': '   ',
      },
    } as unknown as RequestWithUser;
    const contextWithBlankUsername = createContext(reqWithBlankUsername);
    guard.canActivate(contextWithBlankUsername);
    expect(reqWithBlankUsername.user?.githubUsername).toBe('dev_user');
  });

  it('skips auth checks for @Public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const req = {
      headers: {},
    } as unknown as RequestWithUser;
    const context = createContext(req);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.user).toBeUndefined();
  });
});
