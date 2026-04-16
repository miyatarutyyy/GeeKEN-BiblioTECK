# GeeKEN BiblioTECK - User設計まとめ

---

## ■ Userの定義

- Userは以下の機能を持つアプリ利用主体である
  - ログイン
  - コメント投稿
  - 本の貸出

- `role = admin` の場合、管理操作が可能  
- `isActive = false` の場合、ログインおよび全機能を利用不可  

---

## ■ 識別子設計

- `id`
  - アプリ内部主キー

- `githubUserId`
  - GitHub OAuthによる外部識別子

- `id` と `githubUserId` は1対1対応  
- GitHubアカウントが変われば別人扱い  

---

## ■ ユーザー情報

- `githubUsername`
  - GitHubから取得
  - アプリ内で変更不可

- `displayName`（アプリ内ユーザー名）
  - ユーザーが設定
  - 後から変更可能

### フロント表示
- GitHubユーザー名として `githubUsername` を表示
- `displayName` は別途表示・利用

---

## ■ ユーザー作成

- 作成は初回ログイン時に実施

### 成立条件
- `displayName` 入力済み
- GitHub OAuth認証成功
- `githubUserId` が未登録
- DBにUserレコードが保存された時点

---

## ■ ログイン制御

- `isActive = false` の場合はログイン拒否

---

## ■ API設計

- 一般ユーザー取得: `GET /users/me`
- レスポンスに `githubUserId` は含めない

### 管理者変更可能項目
- `role`
- `isActive`

---

## ■ 履歴管理

- 退会・凍結ユーザーの履歴は削除しない
- 削除は運用上の必要に応じて限定的に実施

---

# ■ ユーザー作成フロー

1. ユーザーが `displayName` を入力  
2. 「GitHubでログイン」ボタン押下  
3. GitHub OAuth 認証実施  
4. サーバーが `githubUserId` / `githubUsername` を取得  
5. 既存ユーザー存在確認  
   - 存在しない → 新規作成  
   - 存在する → ログイン処理へ  
   - `isActive = false` → 拒否  
6. User作成またはログイン完了  

---

# ■ 検討事項（未確定）

## displayName仕様
- 初期値を `githubUsername` にするか  
- 初回必須入力にするか  

## displayName制約
- 文字数制限（例: 1〜30文字）
- 使用可能文字
- 重複可否（推奨: 重複可）

## OAuth前入力の保持方法
- フロントで一時保持（state / storage）
- サーバーセッション利用

## User作成処理主体
- サーバー主導で新規/既存を判定（推奨）
- フロントから作成APIを叩くかどうか

## 管理者向けAPI
- `GET /users/:id` の追加タイミング
- 管理画面の要否

## 履歴削除方針の詳細
- 削除対象（ログ vs 本体データ）
- 保存期間ポリシー

---

# ■ 推奨事項

- `displayName` は `githubUsername` を初期値にする  
- `displayName` は変更可能にする  
- 重複は許容する  
- User作成判定はサーバーで行う  
- APIはまず `GET /users/me` のみ実装する  
