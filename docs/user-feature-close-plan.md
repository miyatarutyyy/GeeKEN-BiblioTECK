# User Feature クローズ計画（OAuth後回し）

## Summary
- `user-feature` は「認証済み前提で Users を安定動作させる土台」までで完了とする。
- GitHub OAuth 本実装は後続フェーズへ分離し、将来差し替え可能な認証境界を維持する。
- `Book` / `Loan` / `Comment` は別ブランチで実装する。

## ドメイン責務の整理
- `User`: その人は誰で、何ができるか（属性・状態・権限）を表す。
- `Book`: 本そのもの（貸出対象資産）を表す。
- `Loan`: 誰がどの本を借りているかという貸借関係を表す。
- `Comment`: 誰がどの本に何を書いたかを表す。

## user-feature の完了条件
1. `DevAuthGuard` の不整合修正
- `githubUsername` を `x-dev-github-username` から取得し、未指定時のみ `dev_user` を使う。

2. 認証ガードの単体テスト追加
- 正常系、必須ヘッダー欠落401、空文字401、`@Public()` スキップを検証する。

3. Users API 統合テスト追加
- `POST /users/onboarding`: 成功、重複409。
- `GET /users/me`: 成功、未作成404、inactive403、未認証401。

4. e2e 実行前提の明文化
- DB 起動手順（`docker compose up -d db`）を README か docs に明記する。
- DB 起動時に `npm run test:e2e` が通る検証手順を残す。

5. ブランチ整理
- `docs/locker_api_behavior.md` は `user-feature` の完了判定に含めない（別コミット/別ブランチで管理）。

## スコープ外
- GitHub OAuth 本実装。
- GeeKEN Organization 判定の実接続。
- `Book` / `Loan` / `Comment` の実装。

## Test Plan
- `backend` で `npm run lint` が成功する。
- `backend` で `npm test` が成功する。
- Users 関連の追加テスト（Guard 単体・Users 統合）が成功する。
- `npm run test:e2e` は DB 起動時に通り、未起動時の失敗理由が手順書と一致する。

## Assumptions
- OAuth/Organization 判定の本実装はこのブランチでは行わない。
- 現段階は「認証済みコンテキストが渡される」前提で Users を完成させる。
- 後続は `book-feature` / `loan-feature` / `comment-feature` のように責務単位で分割する。

## 参照ドキュメント
- [dev-auth-guard-phase1-design.md](./dev-auth-guard-phase1-design.md)
- [implementation-status-2026-04-18-0915.md](./implementation-status-2026-04-18-0915.md)
- [requirements-definition.md](./requirements-definition.md)
