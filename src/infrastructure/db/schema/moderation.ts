import { integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

// サーバーごとのモデレーション設定
export const guildModerationSettings = pgTable('guild_moderation_settings', {
  guildId:       text('guild_id').primaryKey(),
  noticeRoleId:  text('notice_role_id').notNull(),
  warningRoleId: text('warning_role_id').notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

// 現在の警告状態（ユーザーごと）
export const userWarnings = pgTable('user_warnings', {
  userId:    text('user_id').notNull(),
  guildId:   text('guild_id').notNull(),
  count:     integer('count').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.guildId] }),
]);

// 操作履歴
export const warningLogs = pgTable('warning_logs', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),
  guildId:     text('guild_id').notNull(),
  action:      text('action', { enum: ['add', 'remove', 'ban', 'downgrade'] }).notNull(),
  reason:      text('reason').notNull(),
  moderatorId: text('moderator_id').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});
