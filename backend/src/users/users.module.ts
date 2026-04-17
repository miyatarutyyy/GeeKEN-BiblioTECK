// GeeKEN_BiblioTECK/backend/src/users/users.module.ts

/*
 * Userのルーティング設定
 * UserController と UserService を読み込む
 */
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
