// GeeKEN_BiblioTECK/backend/src/main.ts
// 学習のためコメントする形でメモを残しております
// 可読性が低下しますがご容赦ください。
/*
 * main.ts
 * NestJSアプリケーションの初期化と起動を担当
 */

import { ValidationPipe } from '@nestjs/common'; // リクエストで受け取ったデータを検証・整形する仕組み
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // bootstrap 関数はアプリを起動するためのメイン関数
  const app = await NestFactory.create(AppModule); // Nestアプリを生成

  /*
   * 全てのリクエストに対してValidationPipeを適用する設定
   * 各APIで受け取るDTOに対して、入力チェックを自動で行う
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOに定義されていないプロパティを自動で取り除く
      forbidNonWhitelisted: true, // 取り除くだけでなくエラーを返す
      transform: true, // DTOの方に合わせて変換
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

/*
 * bootstrap()の実行
 */
bootstrap().catch((error: unknown) => {
  console.error('Failed to bootstrap Nest application:', error);
  process.exit(1);
});
