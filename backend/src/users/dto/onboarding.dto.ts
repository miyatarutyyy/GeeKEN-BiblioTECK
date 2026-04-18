// GeeKEN_BiblioTECK/backend/src/users/dto/onboarding.dto.ts
/*
 * displayName と discordId のDTO設定
 */
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class OnboardingDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(1, 30)
  displayName!: string;

  @IsString()
  @Matches(/^\d{17,20}$/) // 例: Discord Snowflake
  discordId!: string;
}
