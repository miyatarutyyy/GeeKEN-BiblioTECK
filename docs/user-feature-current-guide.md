# User機能 開発参加ガイド（現行実装ベース）

最終更新: 2026-04-19

このドキュメントは「いま動いている User 機能」を、初見の開発者が短時間で把握し、そのまま開発に参加できる状態にするためのガイドです。

## 1. この機能で今できること

現在の User 機能は、以下 2 API を中心とした「ユーザー基盤の最小実装」です。

- `POST /users/onboarding`
  - 初回ユーザー登録を行う
- `GET /users/me`
  - ログイン中（開発用ヘッダーで擬似認証した）自分の情報を取得する

認証は GitHub OAuth 本実装ではなく、開発用ヘッダー認証（`DevAuthGuard`）です。

## 2. スコープ（実装済み / 未実装）

実装済み:

- 開発用認証ガード（`x-dev-github-user-id` 必須）
- Onboarding API
- Me API
- User エンティティ（TypeORM）
- Guard 単体テスト、Users API 統合/e2e テスト

未実装（別スコープ）:

- GitHub OAuth 本実装
- GeeKEN Organization 判定
- Migration 基盤（現状 `synchronize: true`）
- Book / Loan / Comment / 通知機能

## 3. まず何を読めばよいか（コードマップ）

最短導線は次の順です。

1. `backend/src/auth/dev-auth.guard.ts`
2. `backend/src/users/users.controller.ts`
3. `backend/src/users/users.service.ts`
4. `backend/src/users/entities/user.entity.ts`
5. `backend/src/users/dto/onboarding.dto.ts`
6. `backend/test/users-auth.e2e-spec.ts`

## 4. アーキテクチャ概要

### 4.1 リクエストの流れ

1. すべての API リクエストで `DevAuthGuard` が先に実行される（`APP_GUARD`）。
2. Guard が `request.user` に `{ githubUserId, githubUsername }` を注入する。
3. `UsersController` が `request.user` を `UsersService` に渡す。
4. `UsersService` が DB（`users` テーブル）に対して参照/保存し、レスポンス整形する。

### 4.2 認証方式（開発用）

必須ヘッダー:

- `x-dev-github-user-id`

任意ヘッダー:

- `x-dev-github-username`（未指定または空白は `dev_user`）

エラー:

- `x-dev-github-user-id` がない、または空白のみの場合 `401 UNAUTHORIZED`

## 5. データモデル（UserEntity）

`users` テーブルの主な属性:

- `id`（UUID）
- `githubUserId`（UNIQUE）
- `githubUsername`
- `displayName`（1〜30 文字を DTO で検証）
- `discordId`（UNIQUE、17〜20 桁数字を DTO で検証）
- `discordName`
- `role`（`member` / `admin`、初期値 `member`）
- `isActive`（初期値 `true`）
- `createdAt`, `updatedAt`

補足:

- UNIQUE 制約名は `uq_users_github_user_id` / `uq_users_discord_id`。
- `displayName` の空白禁止は現在 DB 制約ではなく DTO バリデーションで担保。

## 6. API 仕様（現行）

共通:

- 認証必須（`DevAuthGuard`）
- `githubUserId` はレスポンスに含めない

### 6.1 `POST /users/onboarding`

目的:

- ユーザー未作成状態で初回登録する

入力:

- Body
  - `displayName: string`（trim 後 1〜30）
  - `discordId: string`（`^\\d{17,20}$`）

処理:

1. `githubUserId` で既存ユーザー確認
2. 既存なら `409 USER_ALREADY_EXISTS`
3. `discordId` 重複確認
4. 重複なら `409 DUPLICATE_DISCORD_ID`
5. `discordName = "mock_" + discordId の末尾4桁` で生成
6. `role=member`, `isActive=true` で保存

成功レスポンス（201）例:

```json
{
  "id": "u-1",
  "githubUsername": "alice",
  "displayName": "Alice",
  "discordId": "123456789012345678",
  "discordName": "mock_5678",
  "role": "member",
  "isActive": true,
  "createdAt": "2026-04-19T00:00:00.000Z",
  "updatedAt": "2026-04-19T00:00:00.000Z"
}
```

主なエラー:

- `400` バリデーションエラー（空白 displayName、discordId 形式不正、不要フィールド混入など）
- `401 UNAUTHORIZED`（認証ヘッダー不足）
- `409 USER_ALREADY_EXISTS`
- `409 DUPLICATE_DISCORD_ID`

### 6.2 `GET /users/me`

目的:

- ヘッダー認証された `githubUserId` に紐づくユーザーを返す

処理:

1. `githubUserId` でユーザー検索
2. 未存在なら `404 USER_NOT_FOUND`
3. `isActive=false` なら `403 USER_INACTIVE`
4. それ以外はユーザー情報を返却

成功レスポンス（200）:

- `POST /users/onboarding` のレスポンス項目と同一

主なエラー:

- `401 UNAUTHORIZED`
- `404 USER_NOT_FOUND`
- `403 USER_INACTIVE`

## 7. ローカルでの確認手順

### 7.1 起動

```bash
cp .env.example .env
docker compose up -d db
cd backend
npm install
npm run start:dev
```

注意:

- Backend は起動時に DB 接続するため、DB 未起動だと起動失敗する。

### 7.2 動作確認（curl）

Onboarding:

```bash
curl -i -X POST http://localhost:3000/users/onboarding \
  -H 'content-type: application/json' \
  -H 'x-dev-github-user-id: 12345' \
  -H 'x-dev-github-username: alice' \
  -d '{"displayName":"Alice","discordId":"123456789012345678"}'
```

Me:

```bash
curl -i http://localhost:3000/users/me \
  -H 'x-dev-github-user-id: 12345' \
  -H 'x-dev-github-username: alice'
```

## 8. テスト戦略

主なテスト:

- `backend/src/auth/dev-auth.guard.spec.ts`
  - ヘッダー必須/省略時の挙動
  - デフォルト username 補完
  - `@Public()` のバイパス
- `backend/test/users-auth.e2e-spec.ts`
  - `/users/onboarding` と `/users/me` の正常/異常系
  - エラーコード契約（401/403/404/409/400）

実行コマンド（backend）:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

## 9. 開発参加時にハマりやすい点

- `DevAuthGuard` はグローバル。新規 API もデフォルトで認証必須になる。
- `ValidationPipe` が `forbidNonWhitelisted: true` のため、DTO未定義フィールドは 400。
- `GET /users/me` の検索キーは `user.id` ではなく `githubUserId`。
- `discordName` は現状モック生成。本物の外部連携ではない。
- TypeORM は `synchronize: true`。本番運用前に migration 化が必要。

## 10. 次に拡張するときの推奨順序

1. 認証基盤を OAuth 本実装に差し替え（`AuthUser` 型を維持して切替）
2. `synchronize: false` + migration 基盤導入
3. User API に更新系（displayName 更新、管理者向け制御）を追加
4. Book/Loan 機能側で `isActive`・貸出可否条件を利用

## 11. 参照ドキュメント

- `docs/implementation-status-2026-04-18-0915.md`（直近の実装状況）
- `docs/user-feature-close-plan.md`（クローズ時の合意スコープ）
- `docs/requirements-definition.md`（将来要件）

