# User Feature クローズ計画（2026-04-18 凍結版）

## Summary
- `user-feature` は「Dev認証前提で Users API を安定提供する基盤」までで完了とする。
- 本日クローズ優先のため、migration と OAuth 本実装は次ブランチへ送る。
- `Book` / `Loan` / `Comment` / 通知機能は本ブランチの対象外とする。

## In Scope
- 開発用認証ガード（`DevAuthGuard`）の運用。
- `POST /users/onboarding` と `GET /users/me` の安定動作。
- Users関連テスト（Guard単体 + Users統合/e2e）。
- User機能クローズに必要な README / docs の整合。

## Out of Scope
- GitHub OAuth 本実装。
- GeeKEN Organization 判定の実接続。
- TypeORM migration 基盤導入と `synchronize=false` 化。
- `Book` / `Loan` / `Comment` / 通知機能の実装。
- `docs/locker_api_behavior.md` の取り込み（別ブランチ管理）。

## Definition of Done
1. 認証ヘッダー仕様
- 必須: `x-dev-github-user-id`
- 任意: `x-dev-github-username`（未指定時は `dev_user`）

2. API挙動
- `POST /users/onboarding`
  - 成功: `201`
  - 既存ユーザー: `409 USER_ALREADY_EXISTS`
  - `discordId` 重複: `409 DUPLICATE_DISCORD_ID`
  - 入力不正: `400`
- `GET /users/me`
  - 未認証: `401 UNAUTHORIZED`
  - 未作成: `404 USER_NOT_FOUND`
  - inactive: `403 USER_INACTIVE`
  - 正常: `200`

3. 検証コマンド（backend）
- `npm run lint`
- `npm test`
- `npm run test:e2e`
- `npm run build`

4. ドキュメント整合
- 実装状況報告が現実装と一致している。
- e2e前提（DB起動手順）が README に明記されている。

## Assumptions
- `synchronize=true` は本ブランチでは暫定維持し、次ブランチ先頭で migration 化を実施する。
- 本ブランチの完了判定は「User基盤の安定提供」に限定する。

## 参照ドキュメント
- [dev-auth-guard-phase1-design.md](./dev-auth-guard-phase1-design.md)
- [implementation-status-2026-04-18-0915.md](./implementation-status-2026-04-18-0915.md)
- [requirements-definition.md](./requirements-definition.md)
