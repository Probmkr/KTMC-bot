# KTMC Bot

コミュニティ向け多機能 Discord Bot。入退室ログ、モデレーション、その他の機能を提供します。

---

## 目次

1. [用途](#用途)
2. [技術スタック](#技術スタック)
3. [開発環境](#開発環境)
4. [デプロイ](#デプロイ)

---

## 用途

KTMC Bot はコミュニティサーバーの運営を支援する多機能 Bot です。

- **入退室ログ**: メンバーの参加・退出を指定チャンネルに記録
- **モデレーション**: BAN・キックなどの管理機能（予定）
- その他の機能を順次追加予定

---

## 技術スタック

| 項目               | 採用技術       |
| ------------------ | -------------- |
| 言語               | TypeScript     |
| ランタイム         | Node.js        |
| Bot フレームワーク | discord.js v14 |
| ORM                | Drizzle        |
| データベース       | PostgreSQL     |
| デプロイ           | Fly.io         |

---

## 開発環境

### 必要なもの

- Node.js 20以上
- npm
- PostgreSQL
- Discord Bot トークン（[Discord Developer Portal](https://discord.com/developers/applications)）

### セットアップ

**1. リポジトリのクローン**

```bash
git clone https://github.com/Probmkr/KTMC-bot.git
// あるいは
// git clone gi@github.com:Probmkr/KTMC-bot.git
cd KTMC-bot
```

**2. 依存パッケージのインストール**

```bash
npm install
```

**3. 環境変数の設定**

```bash
cp .env.example .env
```

`.env` を編集します。

```env
BOT_TOKEN=    # Discord Bot のトークン
APP_ID=        # Bot のクライアント ID
GUILD_ID=         # 開発用サーバーの ID（開発時のみ）
DATABASE_URL=     # PostgreSQL の接続 URL（例: postgresql://user:password@localhost:5432/ktmc）
```

**4. データベースのマイグレーション**

```bash
npm run db:migrate
```

**5. コマンドの登録**

```bash
npm run deploy
```

`GUILD_ID` が設定されている場合はギルドコマンドとして即時登録されます。

**6. 起動**

```bash
npm run dev
```

### スクリプト一覧

| コマンド             | 内容                          |
| -------------------- | ----------------------------- |
| `npm run dev`        | 開発サーバーの起動（ts-node） |
| `npm run build`      | TypeScript のビルド           |
| `npm start`          | ビルド済みファイルの起動      |
| `npm run deploy`     | スラッシュコマンドの登録      |
| `npm run db:migrate` | マイグレーションの実行        |
| `npm run db:studio`  | Drizzle Studio の起動         |

---

## デプロイ

[Fly.io](https://fly.io) を使用します。

### 初回セットアップ

**1. Fly CLI のインストール**

```bash
curl -L https://fly.io/install.sh | sh
```

**2. ログイン**

```bash
fly auth login
```

**3. アプリの作成**

```bash
fly launch
```

**4. PostgreSQL の作成とアタッチ**

```bash
fly postgres create --name ktmc-bot-db
fly postgres attach ktmc-bot-db
```

`DATABASE_URL` が自動で環境変数に設定されます。

**5. その他の環境変数を設定**

```bash
fly secrets set DISCORD_TOKEN=your_token
fly secrets set CLIENT_ID=your_client_id
```

> `GUILD_ID` は本番環境では設定しません（グローバルコマンドとして登録するため）。

**6. デプロイ**

```bash
fly deploy
```

### 以降のデプロイ

```bash
fly deploy
```

### ログの確認

```bash
fly logs
```

---

## コミットメッセージ

基本形式：

```
[prefix]: [title/content]
<details>
```

大きな変更が複数ある場合は、複数のエントリを並べる：

```
[prefix]: [title/content]
<details>
[prefix]: [title/content]
<details>
...
```

- `[]` は必須の変数
- `<>` は任意の変数

### prefix 一覧

| prefix | 用途 |
|--------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `chore` | 雑務・設定変更など |
| `doc` | ドキュメント関連 |
| `plan` | 計画・設計メモ |
| `pkg` | パッケージ・依存関係の変更 |
| `hotfix` | 緊急のバグ修正 |
