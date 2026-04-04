import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { GuildSetting, GuildSettingProps } from '../../domain/moderation/guild-setting';
import { WarningLog, UserWarningRepository } from '../../domain/moderation/user-warning.repository';
import { UserWarning } from '../../domain/moderation/user-warning';
import { db } from '../db';
import { guildModerationSettings, userWarnings, warningLogs } from '../db/schema/moderation';

export class DrizzleUserWarningRepository implements UserWarningRepository {
  async findByUser(userId: string, guildId: string): Promise<UserWarning | null> {
    const row = await db.select().from(userWarnings)
      .where(and(eq(userWarnings.userId, userId), eq(userWarnings.guildId, guildId)))
      .limit(1)
      .then(r => r[0] ?? null);
    if (!row) return null;
    return UserWarning.create({ userId: row.userId, guildId: row.guildId, count: row.count, updatedAt: row.updatedAt });
  }

  async findAllByGuild(guildId: string): Promise<UserWarning[]> {
    const rows = await db.select().from(userWarnings).where(eq(userWarnings.guildId, guildId));
    return rows.map(row => UserWarning.create({ userId: row.userId, guildId: row.guildId, count: row.count, updatedAt: row.updatedAt }));
  }

  async save(warning: UserWarning): Promise<void> {
    await db.insert(userWarnings)
      .values({ userId: warning.userId, guildId: warning.guildId, count: warning.count, updatedAt: warning.updatedAt })
      .onConflictDoUpdate({
        target: [userWarnings.userId, userWarnings.guildId],
        set: { count: warning.count, updatedAt: warning.updatedAt },
      });
  }

  async delete(userId: string, guildId: string): Promise<void> {
    await db.delete(userWarnings)
      .where(and(eq(userWarnings.userId, userId), eq(userWarnings.guildId, guildId)));
  }

  async appendLog(log: Omit<WarningLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(warningLogs).values({ id: randomUUID(), ...log });
  }

  async findLogs(userId: string, guildId: string): Promise<WarningLog[]> {
    return db.select().from(warningLogs)
      .where(and(eq(warningLogs.userId, userId), eq(warningLogs.guildId, guildId)))
      .orderBy(warningLogs.createdAt);
  }

  async findGuildSetting(guildId: string): Promise<GuildSetting | null> {
    const row = await db.select().from(guildModerationSettings)
      .where(eq(guildModerationSettings.guildId, guildId))
      .limit(1)
      .then(r => r[0] ?? null);
    if (!row) return null;
    return GuildSetting.create({ guildId: row.guildId, noticeRoleId: row.noticeRoleId, warningRoleId: row.warningRoleId });
  }

  async saveGuildSetting(setting: GuildSettingProps): Promise<void> {
    await db.insert(guildModerationSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: guildModerationSettings.guildId,
        set: { noticeRoleId: setting.noticeRoleId, warningRoleId: setting.warningRoleId, updatedAt: new Date() },
      });
  }
}
