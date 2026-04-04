# コーディング規約
**Discord Bot — TypeScript × discord.js v14**

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| 言語 | TypeScript |
| ランタイム | Node.js |
| パッケージマネージャー | npm |
| Bot フレームワーク | discord.js v14 |
| ORM | Drizzle |
| データベース | PostgreSQL |
| デプロイ | Fly.io |

---

## ディレクトリ構成

```
src/
├── index.ts                    # エントリーポイント
├── deploy-commands.ts          # コマンド登録スクリプト
├── types.ts                    # 共通型定義
├── errors.ts                   # エラークラス定義
├── commands/
│   ├── index.ts                # コマンドローダー
│   └── {feature}/
│       └── {command}.ts
├── application/                # Service層
│   └── {feature}/
│       └── {name}.service.ts
├── domain/                     # ドメインオブジェクト
│   └── {feature}/
│       ├── {name}.ts
│       ├── {name}.repository.ts   # Repository インターフェース
│       └── {name}.port.ts         # 外部サービス（Discord 等）のポートインターフェース
├── infrastructure/             # Repository・Adapter 実装・外部接続
│   ├── db/
│   │   ├── index.ts            # Drizzle接続
│   │   └── schema/
│   │       └── {feature}.ts
│   ├── repository/
│   │   └── {name}.repository.ts
│   └── discord/
│       └── {name}.adapter.ts   # GuildPort 等の discord.js 実装
└── lib/                        # 汎用ユーティリティ
    └── reply.ts
```

---

## アーキテクチャ

### 層の責務

```
Command → Service → Repository（Interface）← Repository（Impl） → DB
               ↓
          GuildPort（Interface）← GuildAdapter（Impl） → Discord API
```

| 層 | 責務 | 禁止事項 |
|---|---|---|
| Command | Discord の入出力のみ（interaction の読み取りと reply） | ビジネスロジックを書かない |
| Service | ビジネスロジックのみ | `interaction` に依存しない、discord.js の型に直接依存しない |
| Domain | ドメインオブジェクト・Repository/Port インターフェース | 外部ライブラリに依存しない |
| Infrastructure | DB アクセス・Discord API 操作の実装 | ビジネスロジックを書かない |

### 依存の方向

Service は Repository・GuildPort の**インターフェース**にのみ依存し、実装（Drizzle・discord.js）には依存しない。

```ts
// ✅ 正しい — インターフェースに依存
constructor(private readonly banRepo: BanRepository) {}

// ❌ 誤り — 実装に直接依存
constructor(private readonly banRepo: PrismaBanRepository) {}
```

### ロジックが薄いコマンドの扱い

`/ping` のような DB やビジネスロジックが不要なコマンドは Service を作らなくてよい。
「DB や複数ステップのロジックが絡む場合」に Service を作ること。

---

## コマンド

### インターフェース（types.ts）

```ts
import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
```

### コマンドファイルの書き方

- 1ファイル1コマンドとする
- `execute` 内には Discord の入出力のみを書く
- ビジネスロジックは Service に委譲する

```ts
// commands/moderation/ban.ts
import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { BanService } from '../../application/moderation/ban.service';

const banService = new BanService(/* repository */);

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ユーザーをBANします')
    .addUserOption(opt =>
      opt.setName('user').setDescription('対象ユーザー').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('理由')
    ),

  async execute(interaction) {
    const user   = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? '理由なし';

    await banService.execute({
      userId:      user.id,
      requesterId: interaction.user.id,
      guildId:     interaction.guildId!,
      reason,
    });

    await interaction.reply({ content: `${user.tag} をBANしました`, ephemeral: true });
  },
};

export default command;
```

### サブコマンド

- サブコマンドとオプションを同一コマンドに混在させない
- グループのネストは2階層まで（Discordの制限）
- `getSubcommandGroup(false)` で null を許容する

```ts
const group = interaction.options.getSubcommandGroup(false); // null の可能性あり
const sub   = interaction.options.getSubcommand();
```

---

## Service層

- `interaction` をはじめ discord.js の型に依存しない
- Discord API 操作が必要な場合は `GuildPort` 等のインターフェースを通じて行う
- 入力は Plain Object の DTO として受け取る（ポートはコンストラクタ注入）
- ビジネスルール違反は `DomainError` をスローする

```ts
// application/moderation/ban.service.ts
import { DomainError } from '../../errors';
import { BanRepository } from '../../domain/moderation/ban.repository';
import { Ban } from '../../domain/moderation/ban';

export interface BanDto {
  userId:      string;
  requesterId: string;
  guildId:     string;
  reason:      string;
}

export class BanService {
  constructor(private readonly banRepo: BanRepository) {}

  async execute(dto: BanDto): Promise<void> {
    if (dto.userId === dto.requesterId) {
      throw new DomainError('自分自身をBANすることはできません');
    }

    const existing = await this.banRepo.findByUserId(dto.userId, dto.guildId);
    if (existing) throw new DomainError('すでにBANされています');

    const ban = Ban.create(dto);
    await this.banRepo.save(ban);
  }
}
```

---

## Domainオブジェクト

- コンストラクタを `private` にし、`static create()` 経由で生成する
- バリデーションは `create()` 内で行い、違反は `DomainError` をスローする
- discord.js / Drizzle などの外部ライブラリに依存しない

```ts
// domain/moderation/ban.ts
import { DomainError } from '../../errors';

export interface BanProps {
  userId:    string;
  guildId:   string;
  reason:    string;
  createdAt: Date;
}

export class Ban {
  private constructor(private readonly props: BanProps) {}

  static create(input: Omit<BanProps, 'createdAt'>): Ban {
    if (!input.reason.trim()) throw new DomainError('理由は必須です');
    return new Ban({ ...input, createdAt: new Date() });
  }

  get userId()    { return this.props.userId; }
  get guildId()   { return this.props.guildId; }
  get reason()    { return this.props.reason; }
  get createdAt() { return this.props.createdAt; }
}
```

---

## Repository

### インターフェース（domain層）

```ts
// domain/moderation/ban.repository.ts
import { Ban } from './ban';

export interface BanRepository {
  save(ban: Ban): Promise<void>;
  findByUserId(userId: string, guildId: string): Promise<Ban | null>;
  deleteByUserId(userId: string, guildId: string): Promise<void>;
}
```

### 実装（infrastructure層）

- Drizzle の実装の詳細はこの層に閉じる
- インターフェースのメソッド以外を外部に公開しない

```ts
// infrastructure/repository/ban.repository.ts
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { bans } from '../db/schema/moderation';
import { Ban } from '../../domain/moderation/ban';
import { BanRepository } from '../../domain/moderation/ban.repository';

export class DrizzleBanRepository implements BanRepository {
  async save(ban: Ban): Promise<void> {
    await db.insert(bans).values({
      userId:    ban.userId,
      guildId:   ban.guildId,
      reason:    ban.reason,
      createdAt: ban.createdAt,
    });
  }

  async findByUserId(userId: string, guildId: string): Promise<Ban | null> {
    const row = await db.select().from(bans)
      .where(and(eq(bans.userId, userId), eq(bans.guildId, guildId)))
      .limit(1)
      .then(r => r[0] ?? null);

    if (!row) return null;
    return Ban.create({ userId: row.userId, guildId: row.guildId, reason: row.reason });
  }

  async deleteByUserId(userId: string, guildId: string): Promise<void> {
    await db.delete(bans)
      .where(and(eq(bans.userId, userId), eq(bans.guildId, guildId)));
  }
}
```

---

## Discord ポート

Discord API への操作（BAN・ロール変更・タイムアウト等）も Repository と同様に、インターフェースを domain 層に定義し、実装を infrastructure 層に置く。

### インターフェース（domain 層）

```ts
// domain/moderation/guild.port.ts
// discord.js を一切インポートしない
export interface GuildPort {
  banUser(userId: string, reason: string): Promise<void>;
  setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void>;
  timeoutMember(userId: string, durationMs: number, reason: string): Promise<void>;
}
```

### 実装（infrastructure 層）

```ts
// infrastructure/discord/guild.adapter.ts
import { Guild } from 'discord.js';
import { GuildPort } from '../../domain/moderation/guild.port';

export class DiscordGuildAdapter implements GuildPort {
  constructor(private readonly guild: Guild) {}

  async banUser(userId: string, reason: string): Promise<void> {
    await this.guild.bans.create(userId, { reason });
  }

  async setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void> {
    const member = await this.guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    if (rolesToAdd.length)    await member.roles.add(rolesToAdd);
    if (rolesToRemove.length) await member.roles.remove(rolesToRemove);
  }

  async timeoutMember(userId: string, durationMs: number, reason: string): Promise<void> {
    const member = await this.guild.members.fetch(userId).catch(() => null);
    await member?.timeout(durationMs, reason);
  }
}
```

### Service での利用

```ts
// Service はインターフェースにのみ依存
export class ModerationService {
  constructor(
    private readonly repo:      UserWarningRepository,
    private readonly guildPort: GuildPort,
  ) {}
}

// Command でアダプターを生成して注入
const service = new ModerationService(repo, new DiscordGuildAdapter(interaction.guild!));
```

---

## エラーハンドリング

### エラークラス（errors.ts）

```ts
// ユーザーに見せて良いエラー
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
```

### エントリーポイントで一元管理

- すべてのエラーはエントリーポイントでキャッチする
- `DomainError` はメッセージをそのままユーザーに返す
- それ以外は詳細を隠し、コンソールにのみ出力する
- 返信は必ず Ephemeral にする

```ts
// lib/reply.ts
import { ChatInputCommandInteraction } from 'discord.js';

export async function replyError(
  interaction: ChatInputCommandInteraction,
  message: string
): Promise<void> {
  const payload = { content: message, ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}
```

```ts
// index.ts（抜粋）
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    if (error instanceof DomainError) {
      await replyError(interaction, error.message);
    } else {
      console.error(error);
      await replyError(interaction, '予期せぬエラーが発生しました');
    }
  }
});
```

---

## Drizzle スキーマ

- スキーマはフィーチャーごとにファイルを分ける
- カラム名はスネークケース
- `guildId` は必ずすべてのテーブルに含める（マルチサーバー対応）

```ts
// infrastructure/db/schema/moderation.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const bans = pgTable('bans', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull(),
  guildId:   text('guild_id').notNull(),
  reason:    text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| ファイル名 | kebab-case | `ban.service.ts` |
| クラス名 | PascalCase | `BanService` |
| インターフェース名 | PascalCase（I プレフィックスなし） | `BanRepository` |
| 変数・関数名 | camelCase | `banService` |
| DBカラム名 | snake_case | `guild_id` |
| コマンド名 | kebab-case | `member-info` |

---

## テスト（推奨）

- Service 層は discord.js に直接依存しないため、単体テストを書きやすい
- Repository・GuildPort はどちらもインメモリ実装に差し替えてテストする
- テストフレームワークは **Vitest** を推奨

```ts
// application/moderation/ban.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BanService } from './ban.service';
import { BanRepository } from '../../domain/moderation/ban.repository';
import { Ban } from '../../domain/moderation/ban';
import { DomainError } from '../../errors';

class InMemoryBanRepository implements BanRepository {
  private store = new Map<string, Ban>();
  async save(ban: Ban) { this.store.set(ban.userId, ban); }
  async findByUserId(userId: string) { return this.store.get(userId) ?? null; }
  async deleteByUserId(userId: string) { this.store.delete(userId); }
}

describe('BanService', () => {
  let service: BanService;

  beforeEach(() => {
    service = new BanService(new InMemoryBanRepository());
  });

  it('自分自身はBANできない', async () => {
    await expect(
      service.execute({ userId: 'u1', requesterId: 'u1', guildId: 'g1', reason: '理由' })
    ).rejects.toThrow(DomainError);
  });
});
```

---

## コマンド登録

- 開発中はギルドコマンド（即時反映）
- 本番はグローバルコマンド（最大1時間）
- `GUILD_ID` 環境変数の有無で自動切り替えする

```ts
if (process.env.GUILD_ID) {
  await rest.put(Routes.applicationGuildCommands(clientId, process.env.GUILD_ID), { body: commands });
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}
```

---

## 環境変数

```env
BOT_TOKEN=
APP_ID=
GUILD_ID=          # 開発時のみ設定、本番では削除
DATABASE_URL=
```
