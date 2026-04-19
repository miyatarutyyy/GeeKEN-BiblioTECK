import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';

import { DevAuthGuard } from '../src/auth/dev-auth.guard';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { UserEntity, UserRole } from '../src/users/entities/user.entity';

describe('Users API (integration)', () => {
  let app: INestApplication<App>;

  const userRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        Reflector,
        { provide: APP_GUARD, useClass: DevAuthGuard },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 401 when auth header is missing', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401).expect({
      code: 'UNAUTHORIZED',
      message: 'x-dev-github-user-id header is required',
      details: {},
    });
  });

  it('returns 404 when user is not found', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('x-dev-github-user-id', '12345')
      .expect(404)
      .expect({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: {},
      });
  });

  it('returns 403 when user is inactive', async () => {
    userRepositoryMock.findOne.mockResolvedValue({
      id: 'u-1',
      githubUserId: '12345',
      githubUsername: 'alice',
      displayName: 'Alice',
      discordId: '123456789012345678',
      discordName: 'mock_5678',
      role: UserRole.MEMBER,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('x-dev-github-user-id', '12345')
      .expect(403)
      .expect({
        code: 'USER_INACTIVE',
        message: 'User is inactive',
        details: { userId: 'u-1' },
      });
  });

  it('returns 201 for onboarding success', async () => {
    const saved = {
      id: 'u-1',
      githubUserId: '12345',
      githubUsername: 'alice',
      displayName: 'Alice',
      discordId: '123456789012345678',
      discordName: 'mock_5678',
      role: UserRole.MEMBER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // onboarding内で findOne が2回呼ばれる（githubUserId /discordId）
    userRepositoryMock.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    userRepositoryMock.create.mockReturnValue(saved);
    userRepositoryMock.save.mockResolvedValue(saved);

    await request(app.getHttpServer())
      .post('/users/onboarding')
      .set('x-dev-github-user-id', '12345')
      .set('x-dev-github-username', 'alice')
      .send({
        displayName: 'Alice',
        discordId: '123456789012345678',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: 'u-1',
          githubUsername: 'alice',
          displayName: 'Alice',
          discordId: '123456789012345678',
          discordName: 'mock_5678',
          role: UserRole.MEMBER,
          isActive: true,
        });
      });
  });

  it('returns 409 when user already exists', async () => {
    userRepositoryMock.findOne.mockResolvedValueOnce({
      id: 'u-existing',
      githubUserId: '12345',
    });

    await request(app.getHttpServer())
      .post('/users/onboarding')
      .set('x-dev-github-user-id', '12345')
      .set('x-dev-github-username', 'alice')
      .send({
        displayName: 'Alice',
        discordId: '123456789012345678',
      })
      .expect(409)
      .expect({
        code: 'USER_ALREADY_EXISTS',
        message: 'User already exists',
        details: {},
      });
  });

  it('returns 409 when discordId is duplicated', async () => {
    userRepositoryMock.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'u-dup',
        discordId: '123456789012345678',
      });

    await request(app.getHttpServer())
      .post('/users/onboarding')
      .set('x-dev-github-user-id', '12345')
      .set('x-dev-github-username', 'alice')
      .send({
        displayName: 'Alice',
        discordId: '123456789012345678',
      })
      .expect(409)
      .expect({
        code: 'DUPLICATE_DISCORD_ID',
        message: 'discordId is already used',
        details: { field: 'discordId' },
      });
  });

  it('returns 400 when displayName is blank after trim', async () => {
    await request(app.getHttpServer())
      .post('/users/onboarding')
      .set('x-dev-github-user-id', '12345')
      .set('x-dev-github-username', 'alice')
      .send({
        displayName: '   ',
        discordId: '123456789012345678',
      })
      .expect(400);
  });

  it('returns 400 when discordId format is invalid', async () => {
    await request(app.getHttpServer())
      .post('/users/onboarding')
      .set('x-dev-github-user-id', '12345')
      .set('x-dev-github-username', 'alice')
      .send({
        displayName: 'Alice',
        discordId: 'invalid-id',
      })
      .expect(400);
  });
});
