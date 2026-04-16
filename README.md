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
