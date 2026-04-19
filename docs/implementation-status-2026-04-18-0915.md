# 実装状況報告（2026-04-18 20:31 JST 時点）

## 1. サマリー
- `user-feature` のスコープを「Dev認証 + Users API基盤」に凍結済み。
- `DevAuthGuard`、`POST /users/onboarding`、`GET /users/me`、関連テストは実装済み。
- `backend` の DoD 検証コマンド（lint/test/e2e/build）は通過済み。

## 2. スコープ凍結（確定）
### In Scope
- 開発用認証ガード（`DevAuthGuard`）
- Users API（`/users/onboarding`, `/users/me`）
- Guard単体テスト・Users統合/e2eテスト
- クローズに必要な README / docs 整合

### Out of Scope
- GitHub OAuth 本実装
- GeeKEN Organization 判定の実接続
- TypeORM migration 基盤導入と `synchronize=false` 化
- `Book` / `Loan` / `Comment` / 通知機能

## 3. 実装済み内容
### 3.1 認証ガード
- `backend/src/auth/dev-auth.guard.ts`
  - `x-dev-github-user-id` 必須
  - `x-dev-github-username` は任意（未指定は `dev_user`）
- `backend/src/auth/public.decorator.ts` を追加済み
- `backend/src/auth/types/auth-user.type.ts` を追加済み
- `backend/src/app.module.ts` に `APP_GUARD` として `DevAuthGuard` を登録済み

### 3.2 Users API
- `backend/src/users/users.controller.ts`
  - `POST /users/onboarding`
  - `GET /users/me`
- `backend/src/users/users.service.ts`
  - `USER_ALREADY_EXISTS`（409）
  - `DUPLICATE_DISCORD_ID`（409）
  - `USER_NOT_FOUND`（404）
  - `USER_INACTIVE`（403）

### 3.3 テスト
- Guard単体テスト: `backend/src/auth/dev-auth.guard.spec.ts`
- Users統合/e2eテスト: `backend/test/users-auth.e2e-spec.ts`
- `user-feature` 対象外の `backend/test/app.e2e-spec.ts` は削除

## 4. 検証結果（2026-04-18 20:31 JST 実行）
- `npm run lint`（backend）: 成功
- `npm test`（backend）: 成功（4 suites / 8 tests pass）
- `npm run test:e2e`（backend）: 成功（1 suite / 8 tests pass）
- `npm run build`（backend）: 成功

## 5. 未完了・次ブランチ課題
1. TypeORM migration 基盤導入（DataSource + CLI + migrations）
2. `synchronize=true` の解消（`synchronize=false` へ切替）
3. OAuth / Organization 判定の本実装
4. Book / Loan / Comment / 通知の実装

## 6. 補足
- `docs/locker_api_behavior.md` は `user-feature` 完了判定に含めず、別ブランチで管理する。
