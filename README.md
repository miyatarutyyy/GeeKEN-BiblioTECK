# GeeKEN BiblioTECK

GeeKEN の技術書貸出・返却を管理するための Web アプリケーションです。  
現在は MVP 開発の初期構成（Frontend/Backend/DB）を整備しています。

## 技術構成

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: NestJS + TypeORM
- Database: PostgreSQL（Docker Compose）

## ディレクトリ構成

- `frontend/`: フロントエンド
- `backend/`: バックエンド API
- `docs/`: 要件・設計メモ
- `docker-compose.yml`: ローカル DB 起動定義

## ローカル起動（最小）

1. 環境変数を作成

```bash
cp .env.example .env
```

2. DB を起動

```bash
docker compose up -d db
```

3. Backend を起動

```bash
cd backend
npm install
npm run start:dev
```

4. Frontend を起動

```bash
cd frontend
npm install
npm run dev
```

## Backend テスト実行

e2e テストは Nest アプリ起動時に DB 接続を行うため、先に DB を起動してください。

```bash
docker compose up -d db
cd backend
npm run lint
npm test
npm run test:e2e
npm run build
```

## User API（開発用認証ヘッダー）

`/users/onboarding` と `/users/me` は開発用ヘッダー認証を前提とします。

- 必須: `x-dev-github-user-id`
- 任意: `x-dev-github-username`（未指定時は `dev_user`）

## 環境変数

バックエンドはリポジトリルートの `.env` を参照します（`backend/src/app.module.ts` で `../.env` を指定）。
`.env.example` をコピーして作成してください。

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`

## License

MIT
