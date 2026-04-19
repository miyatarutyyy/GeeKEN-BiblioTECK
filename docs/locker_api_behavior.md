# INIAD ロッカーAPI挙動まとめ

## 1. 目的
このドキュメントは、学内で提供されるロッカー関連APIの「実際の挙動」を、配布仕様と `iniad_api.js` の実装をもとに整理したものです。

## 2. 前提条件
- Base URL: `https://edu-iot.iniad.org/api/v1`
- アクセス可能ネットワーク: INIAD Wi-Fi
- 認証方式: BASIC認証

## 3. 認証の仕組み（重要）
### 3.1 BASIC認証ヘッダの生成
`iniad_api.js` の `makeBasicAuth(userid, userpw)` は以下を行います。
1. `userid:userpw` という文字列を作る
2. `btoa(...)` で Base64 変換する
3. `Authorization: Basic <Base64文字列>` として送る

### 3.2 なぜパラメータなしで「自分のロッカー」が開くのか
`POST /locker/open` はボディやクエリを要求しませんが、サーバは `Authorization` を見て利用者を特定します。

想定フロー:
1. サーバが Authorization を検証
2. ユーザーIDを特定
3. `ユーザー -> 割当ロッカー` をサーバ側DBで引く
4. 該当ロッカーのみ開錠する

つまり、ロッカー番号をクライアントが送らなくても、本人のロッカーに解決できます。

## 4. APIごとの挙動
### 4.1 `GET /locker`
- 意味: 自分のロッカー情報取得
- 代表レスポンス例: `{"name":"326605","floor":3}`
- 配布ラッパー (`callLockerPositionAPI`) では:
  - 成功時: `lockerAddress`, `lockerFloor` をUIへ返す
  - 失敗時: `status: "fail"` とエラーメッセージ

### 4.2 `POST /locker/open`
- 意味: 自分のロッカーを開ける
- パラメータ: なし
- レスポンス: 開けたロッカー情報（`name`, `floor`）
- 注意: 「閉じる」専用エンドポイントは配布仕様には明示されていない

### 4.3 `GET /iccards`
- 意味: 自分のICカード登録情報取得
- 配布ラッパー (`callRegisteredIccardAPI`) では `json[0]` を参照して `uid`, `comment` を返す

### 4.4 `POST /iccards`
- 意味: ICカード登録追加
- 仕様上パラメータ:
  - `uid` (カードID, 大文字16進数)
  - `comment`
- 配布ラッパー (`callIccardAPI`) では `application/x-www-form-urlencoded` で送信

### 4.5 `DELETE /iccards`
- 意味: ICカード登録削除
- 仕様書上は `DELETE /iccards`
- 配布ラッパー実装では `DELETE` 時に `.../iccards/1` に書き換えるコードがあるため、授業配布コードと仕様書で差異がある点に注意

### 4.6 `GET /sensors/<room_number>`
- 意味: 教室センサ情報取得
- ロッカー開錠とは直接関係しないが同一API群として提供される

## 5. `iniad_api.js` の実装上の共通挙動
### 5.1 エラーハンドリング
- `handleErrors` は HTTP `5xx` のみ例外化
- それ以外の業務エラーは JSON の `status: "error"` を見て処理

### 5.2 コールバック返却形式
各関数は最終的に `callback(result)` を呼び、`result.status` が `success` / `fail` で返る構造。

### 5.3 503時のダミー応答
配布ラッパーでは `503` のときにテスト用ダミーデータを `success` として返す処理が含まれる。
そのため、実機動作確認では `description` の文言も確認すること。

## 6. 実装時の実務メモ
- ロッカー操作の本質は「ICカードそのもの」ではなく「サーバ側認証とユーザー紐付け」
- `POST /locker/open` が使える環境では、ICカード未使用でも開錠は可能（仕様に従う範囲）
- 認証情報は必ず安全に扱い、ソースコードへ平文固定値を書かない
- 検証は授業で許可された対象範囲（自分のアカウント・自分のロッカー）に限定する
