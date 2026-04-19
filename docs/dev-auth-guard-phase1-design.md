# Devヘッダー認証ガード導入設計（Phase 1: Users API安定化）

## 1. 概要
- 開発用ヘッダー方式の認証Guardを導入し、`POST /users/onboarding` と `GET /users/me` を `401/403/200` で安定動作させる。
- 認証責務をGuardに集約し、Controllerは `request.user` 前提で安全に処理する。
- 本フェーズでは OAuth 本実装・`/auth/*` 実装は対象外とする。

## 2. 目的
- 認証チェックの重複を排除する。
- `request.user` が未設定で落ちる `500` を防止し、意図した `401/403` を返す。
- 将来のOAuth差し替え時に、Guard差し替え中心で移行できる構造にする。

## 3. 対象範囲
### 3.1 In Scope
- 認証コンテキスト型の定義
- DevAuthGuard 実装
- `APP_GUARD` によるグローバル適用
- `@Public()` デコレータの導入
- Users API（onboarding/me）のGuard前提調整
- 単体テスト・最小e2eテストの更新

### 3.2 Out of Scope
- GitHub OAuth本実装
- セッション認証/JWT認証
- `/auth/github/login`, `/auth/github/callback`, `/auth/me` の実装
- migration化と `synchronize=false` への切替

## 4. 認証方式（開発用ヘッダー）
### 4.1 使用ヘッダー
- 必須: `x-dev-github-user-id`
- 任意: `x-dev-github-username`

### 4.2 判定ルール
- `x-dev-github-user-id` が存在し、空白除去後に空でないこと。
- `x-dev-github-username` 未指定時は固定値（例: `dev_user`）を補完する。
- 不備時は `401 Unauthorized` を返す。

### 4.3 request.user への注入
- Guardで以下を `request.user` に設定する。
  - `githubUserId`
  - `githubUsername`

## 5. リクエスト処理フロー
1. リクエスト受信
2. `APP_GUARD` として DevAuthGuard 実行
3. `@Public()` 指定ルートなら認証スキップ
4. ヘッダー検証
5. 正常なら `request.user` 設定してControllerへ
6. DTOバリデーション（ValidationPipe）
7. Serviceで業務処理
8. レスポンス返却（正常 or 例外）

## 6. Users API の振る舞い
### 6.1 `POST /users/onboarding`
- `request.user.githubUserId/githubUsername` と DTO を使ってUser作成。
- 再登録は `409 USER_ALREADY_EXISTS`。
- `discordId` 重複は `409 DUPLICATE_DISCORD_ID`。

### 6.2 `GET /users/me`
- 当面は `request.user.githubUserId` を検索キーとして自分を取得。
- ユーザー未作成は `404 USER_NOT_FOUND`。
- `isActive=false` は `403 USER_INACTIVE`。

## 7. エラー契約
- エラー形式は `code/message/details` で統一する。
- 本フェーズで扱う主なHTTPステータス:
  - `401 Unauthorized`（認証情報不備）
  - `403 Forbidden`（inactive）
  - `404 Not Found`（未作成）
  - `409 Conflict`（重複）

## 8. 実装タスク
1. 認証コンテキスト型を定義する。
2. `@Public()` デコレータを追加する。
3. DevAuthGuard（`CanActivate`）を追加する。
4. `APP_GUARD` としてモジュールへ組み込む。
5. UsersController/UsersService をGuard前提で整える。
6. 既存テストのDIエラーを解消する。
7. Guard単体テストとUsersの最小e2eを追加/更新する。

## 9. テスト計画
### 9.1 Unit
1. 有効ヘッダーで `request.user` が設定される。
2. ヘッダー欠落で `401`。
3. 空文字ヘッダーで `401`。
4. `@Public()` ルートは認証スキップされる。

### 9.2 API統合
1. onboarding成功
2. 同一 `githubUserId` 再登録で `409`
3. `discordId` 重複で `409`
4. me成功
5. inactiveで `403`
6. ヘッダーなしで `401`

## 10. 前提・デフォルト
- 認証方式は開発用ヘッダーに固定する。
- `GET /users/me` はPhase 1では `githubUserId` 基準で取得する。
- OAuthや本番認証への移行は次フェーズで実施する。
