# 実装状況報告（2026-04-18 09:15 JST 時点）

## 1. サマリー
- User機能の基盤として、開発用認証ガード（DevAuthGuard）導入が着手済み。
- `request.user` を共通型で扱うための型定義と、`APP_GUARD` 登録まで実装済み。
- Unit test / lint は通過、e2e はDB接続失敗により未通過。

## 2. 実装済み内容
### 2.1 認証ガード関連
- `backend/src/auth/dev-auth.guard.ts` を追加。
- `backend/src/auth/public.decorator.ts` を追加。
- `backend/src/auth/types/auth-user.type.ts` を追加。
- `backend/src/app.module.ts` に `APP_GUARD` として `DevAuthGuard` を登録。

### 2.2 Users 側の接続
- `backend/src/users/users.controller.ts` で `AuthUser` 共通型を利用する形に変更済み。
- `backend/src/users/dto/onboarding.dto.ts` の `@Transform` を型安全な書き方に更新済み。

### 2.3 テスト基盤の復旧
- `backend/src/users/users.controller.spec.ts` に `UsersService` モック注入を追加。
- `backend/src/users/users.service.spec.ts` に `UserEntityRepository` モック注入を追加。
- これにより、以前のDI解決エラーは解消済み。

## 3. 検証結果（同日朝の実行ログ）
- 実行時刻確認: `2026-04-18 09:15:54 JST`
- `npm run lint`（backend）: 成功
- `npm test`（backend）: 成功（3 suites / 3 tests pass）
- `npm run test:e2e`（backend）: 失敗
  - 主因: PostgreSQLへの接続失敗（`TypeOrmModule` の retry）
  - 結果: `test/app.e2e-spec.ts` の `beforeEach` がタイムアウト

## 4. 未完了・課題
- DevAuthGuard の `githubUsername` 取得ヘッダーが想定と不一致。
  - 現状: `x-dev-github-user-id` を再読して `githubUsername` に設定している
  - 想定: `x-dev-github-username` を読むべき
- `@Public()` は定義済みだが、適用先エンドポイントは未設定。
- Guard自体の単体テストは未作成。
- Users API の統合テスト（401/403/409/200）は未整備。
- `synchronize: true` のまま（migration運用方針との整合は今後対応）。

## 5. 変更ファイル状況（作業ツリー）
- 変更あり:
  - `backend/src/app.module.ts`
  - `backend/src/users/dto/onboarding.dto.ts`
  - `backend/src/users/users.controller.ts`
  - `backend/src/users/users.controller.spec.ts`
  - `backend/src/users/users.service.spec.ts`
- 新規追加:
  - `backend/src/auth/` 配下（guard/decorator/type）
  - `docs/dev-auth-guard-phase1-design.md`

## 6. 次アクション（優先順）
1. DevAuthGuardの `githubUsername` ヘッダー参照修正（`x-dev-github-username`）。
2. Guard単体テスト追加（正常系、ヘッダー欠落、空文字、Publicスキップ）。
3. Users API の認証付きAPIテストを追加（`/users/onboarding`, `/users/me`）。
4. e2e実行環境のDB接続前提を整備して `npm run test:e2e` を通す。
