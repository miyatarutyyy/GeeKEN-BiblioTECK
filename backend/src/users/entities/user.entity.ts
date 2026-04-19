// GeeKEN_BiblioTECK/backend/src/users/entities/user.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
}

@Entity({ name: 'users' })
@Unique('uq_users_github_user_id', ['githubUserId'])
@Unique('uq_users_discord_id', ['discordId'])
@Index('idx_users_role', ['role'])
@Index('idx_users_is_active', ['isActive'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'github_user_id', type: 'varchar', length: 32 })
  githubUserId!: string;

  @Column({ name: 'github_username', type: 'varchar', length: 39 })
  githubUsername!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 30 })
  displayName!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.MEMBER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'discord_id', type: 'varchar', length: 32 })
  discordId!: string;

  @Column({ name: 'discord_name', type: 'varchar', length: 100 })
  discordName!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  updatedAt!: Date;
}
