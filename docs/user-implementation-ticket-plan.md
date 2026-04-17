# NestJS User機能 実行チケット計画（OAuthは設計のみ・モック運用）

## Summary
- 合意済みの最小APIセットを維持しつつ、GitHub OAuthは本実装しない。
- 開発中はモック認証で「OAuth済み相当ユーザー」を生成し、`/users/onboarding` と `/users/me` を成立させる。
- Organization判定もモック化し、将来OAuth実装へ差し替え可能な構造にする。

## Key Changes / Ticket Backlog

### T01: API契約とエラーコードを固定（OpenAPI草案）
- 対象API: `GET /auth/github/login`, `GET /auth/github/callback`, `GET /auth/me`, `POST /users/onboarding`, `GET /users/me`
- エラー形式を統一: `code/message/details`
- `githubUserId` をレスポンス非公開に固定
- 完了条件: API仕様mdまたはOpenAPIがレビュー可能状態

### T02: ドメインモデル定義（User集約 + ドメインエラー）
- `User` 属性: `id, githubUserId, githubUsername, displayName, discordId, discordName, role, isActive, createdAt, updatedAt`
- 状態は `Active/Inactive` のみ
- ドメインエラー定義（`UserInactive`, `UserNotFound`, `DuplicateDiscordId`, `InvalidDisplayName` など）
- 完了条件: 型/仕様がT01と矛盾なし

### T03: DB設計とMigration実装
- `users` テーブル作成、UNIQUE/CHECK/INDEX作成
- `synchronize=false` へ変更
- 開発用初期データ（必要最小限）投入
- 完了条件: migration up/down 成功、スキーマが仕様一致

### T04: 認証コンテキストの抽象化（OAuth差し替え前提）
- `AuthContext` インターフェース作成（`githubUserId/githubUsername/orgMember` 等）
- Guardが`request.user`へ載せる共通形を定義
- 完了条件: User層はOAuth実装有無を意識せず利用可能

### T05: モック認証実装（開発用）
- `GET /auth/github/login` はモック開始処理（実際は擬似ログイン開始）
- `GET /auth/github/callback` はモックユーザー確立（セッション/クッキー）
- `GET /auth/me` は `authenticated`, `onboardingCompleted`, `userId` を返却
- Org判定はモックフラグで制御（非所属時は `403`）
- 完了条件: フロントがOAuth風フローを通せる

### T06: Users Onboarding実装
- `POST /users/onboarding` 実装
- 入力検証（`displayName`, `discordId`）
- `discordName` 自動取得はモックアダプタ経由で実装（将来Discord API差し替え）
- 重複・再登録・非認証の例外マッピング
- 完了条件: 初回登録成功、再登録409、不正入力400

### T07: Users Me実装
- `GET /users/me` 実装
- `isActive=false` は `403`
- レスポンス整形（機微情報非公開）
- 完了条件: 認証済みで自分情報取得可、未作成時の扱いが仕様通り

### T08: 例外ハンドリング統一
- ドメインエラー→HTTP変換フィルタ/マッパを実装
- レスポンスフォーマット統一
- 完了条件: 主要エラーで`code`が安定返却

### T09: テスト整備（unit + e2e）
- ドメイン単体: バリデーション/重複/状態判定
- e2e: auth→onboarding→me の正常系
- e2e: org非所属403、inactive403、再登録409、不正入力400
- 完了条件: CIでテスト緑、主要シナリオ網羅

### T10: 実装ガイドと切替手順
- README更新: モック運用手順、環境変数、将来OAuth差し替え点
- 「モック→実OAuth」時の差し替え対象を明記
- 完了条件: 新規開発者が手順だけで起動・検証可能

## Test Plan

### 正常系
1. モックログイン成功
2. `/auth/me` で未オンボーディング判定
3. `/users/onboarding` 成功
4. `/auth/me` と `/users/me` で登録済み判定

### 異常系
1. Org非所属モックで `403`
2. `displayName` 不正で `400`
3. `discordId` 重複で `409`
4. `isActive=false` ユーザーで `/users/me` が `403`
5. 未認証で `401`

## Assumptions / Defaults
- OAuth本実装は後続。現フェーズはモック認証で代替。
- Organization判定はモック設定で再現（true/false切替）。
- `discordName` は外部連携の代わりにモック取得アダプタで返す。
- reminder関連機能はMVPスコープ外（DB/APIとも未実装）。
