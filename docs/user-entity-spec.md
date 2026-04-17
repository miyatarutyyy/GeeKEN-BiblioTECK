# User Entity Spec (Phase 1)

## 方針
- Backend は NestJS + TypeORM を使用する
- DB カラム命名は `snake_case`
- TypeScript プロパティ命名は `camelCase`
- カラム対応は各項目で明示指定する
  - 例: `@Column({ name: 'github_user_id' }) githubUserId: string`
- DB スキーマ変更は migration のみで管理する（`synchronize` は全環境で `false`）
- TypeORM migration は `DataSource + CLI` 方式で実行する

## User テーブル定義（PostgreSQL）

### enum
- `user_role`: `member`, `admin`

### columns
- `id`: `UUID`, PK, default `gen_random_uuid()`
- `github_user_id`: `VARCHAR(32)`, NOT NULL, UNIQUE
- `github_username`: `VARCHAR(39)`, NOT NULL, UNIQUE なし
- `display_name`: `VARCHAR(30)`, NOT NULL, 重複可
- `role`: `user_role`, NOT NULL, default `member`
- `is_active`: `BOOLEAN`, NOT NULL, default `true`
- `discord_id`: `VARCHAR(32)`, NOT NULL, UNIQUE
- `created_at`: `TIMESTAMPTZ`, NOT NULL, default `now()`
- `updated_at`: `TIMESTAMPTZ`, NOT NULL, default `now()`

### constraints / indexes
- `uq_users_github_user_id` UNIQUE (`github_user_id`)
- `uq_users_discord_id` UNIQUE (`discord_id`)
- `ck_users_display_name_not_blank` CHECK (`char_length(trim(display_name)) >= 1`)
- `idx_users_role` (`role`)
- `idx_users_is_active` (`is_active`)

## API 契約（Phase 1）
- `GET /users/me` は「ログイン中の自分」の情報を返す
- レスポンスに `githubUserId` は含めない
- `me` は Guard が解決した `request.user.id` を参照して決定する
- 初期レスポンス項目:
  - `id`
  - `githubUsername`
  - `displayName`
  - `role`
  - `isActive`
  - `discordId`
- エラー契約:
  - 未認証は `401 Unauthorized`
  - `isActive = false` のユーザーは `403 Forbidden`

## 認証・運用前提
- 本番 OAuth 実装前は開発用仮ログインを使う
- 開発用ユーザーは初期 migration で 1 件投入する
- 開発用仮ログインは `x-dev-user-id` ヘッダーでユーザー切替可能とする
- `x-dev-user-id` 未指定時は初期投入ユーザーを適用する
- `x-dev-user-id` は `users.id`（UUID）を指定する
- `x-dev-user-id` が不正形式または未存在の場合は `401 Unauthorized`
- `displayName` は初回入力必須
- JST 固定運用は `TIMESTAMPTZ` + `Asia/Tokyo` 設定で実現する

## 実装ルール
- 認証 Guard はグローバル適用（`APP_GUARD`）とする
- 公開APIが必要な場合のみ `@Public()` で除外する
- TypeORM `synchronize` は全環境で `false` に固定する
- `updated_at` は Phase 1 ではサービス層で更新時に必ず更新する
- `updated_at` の DB トリガー化は将来の改善項目とする
- 文字列比較は大文字小文字を区別する（case-insensitive 制約は未導入）

## Migration 実行方針（TypeORM）
- `src/database/data-source.ts` を migration 実行の基点とする
- migration は CLI 経由で適用・巻き戻しを行う
- `users` 作成 migration で以下を同時に適用する
  - `pgcrypto` 拡張（`gen_random_uuid()` 用）
  - `user_role` enum
  - `users` テーブル、UNIQUE/CHECK 制約、index
  - 開発用初期ユーザー 1 件の投入
