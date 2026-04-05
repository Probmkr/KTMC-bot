# Logger 実装計画

## 背景

コードベース全体で `console.log` / `console.error` が散在しており、ログレベルの区別・色付け・構造化ログがない。
本番では JSON ログ、開発では pino-pretty でカラー人間可読フォーマットを実現する。

## 方針

- **ライブラリ**: `pino`（本番 JSON）+ `pino-pretty`（開発 colorize）
- **配置**: `src/lib/logger.ts`
- `NODE_ENV === 'production'` のとき pino デフォルト（JSON）、それ以外は pino-pretty transport で色付き出力
- `pino` は `dependency`、`pino-pretty` は `devDependency`

## ログレベルと色（pino-pretty デフォルト）

| Level | 色     |
|-------|--------|
| debug | green  |
| info  | blue   |
| warn  | yellow |
| error | red    |

## 変更ファイル

| ファイル | 操作 |
|---------|------|
| `package.json` | `pino` を dependency 追加、`pino-pretty` を devDependency 追加 |
| `src/lib/logger.ts` | **新規作成** |
| `src/index.ts` | console → logger 置き換え（4箇所）|
| `src/deploy-commands.ts` | console → logger 置き換え（2箇所）|
| `src/infrastructure/discord/guild.adapter.ts` | console → logger 置き換え（2箇所）|
