import { DomainError } from '../../errors';
import { GuildPort } from '../../domain/moderation/guild.port';
import { GuildSettingProps } from '../../domain/moderation/guild-setting';
import { UserWarning } from '../../domain/moderation/user-warning';
import { UserWarningRepository, WarningLog } from '../../domain/moderation/user-warning.repository';

export interface AddWarningDto {
  userId:      string;
  guildId:     string;
  moderatorId: string;
  reason:      string;
  timeoutMs?:  number;
  guild:       GuildPort;
}

export interface RemoveWarningDto {
  userId:      string;
  guildId:     string;
  moderatorId: string;
  guild:       GuildPort;
}

export interface BanDto {
  userId:      string;
  guildId:     string;
  moderatorId: string;
  reason:      string;
  guild:       GuildPort;
}

export interface GetWarningsDto {
  userId:  string;
  guildId: string;
}

export interface WarningStatus {
  count: number;
  logs:  WarningLog[];
}

export class ModerationService {
  constructor(private readonly repo: UserWarningRepository) {}

  async setupGuild(setting: GuildSettingProps): Promise<void> {
    await this.repo.saveGuildSetting(setting);
  }

  async addWarning(dto: AddWarningDto): Promise<{ banned: boolean }> {
    const setting = await this.repo.findGuildSetting(dto.guildId);
    if (!setting) throw new DomainError('モデレーション設定が未登録です。先に `/warn setup` を実行してください');

    const existing = await this.repo.findByUser(dto.userId, dto.guildId);
    const newCount = (existing?.count ?? 0) + 1;

    const warning = UserWarning.create({ userId: dto.userId, guildId: dto.guildId, count: newCount, updatedAt: new Date() });

    if (warning.shouldBeBanned()) {
      await this.executeBan({ userId: dto.userId, guildId: dto.guildId, moderatorId: dto.moderatorId, reason: dto.reason, guild: dto.guild });
      return { banned: true };
    }

    await this.repo.save(warning);
    await this.applyWarningRoles(dto.guild, dto.userId, newCount, setting.noticeRoleId, setting.warningRoleId);

    if (dto.timeoutMs) {
      await dto.guild.timeoutMember(dto.userId, dto.timeoutMs, dto.reason);
    }

    await this.repo.appendLog({ userId: dto.userId, guildId: dto.guildId, action: 'add', reason: dto.reason, moderatorId: dto.moderatorId });

    return { banned: false };
  }

  async removeWarning(dto: RemoveWarningDto): Promise<void> {
    const setting = await this.repo.findGuildSetting(dto.guildId);
    if (!setting) throw new DomainError('モデレーション設定が未登録です。先に `/warn setup` を実行してください');

    const existing = await this.repo.findByUser(dto.userId, dto.guildId);
    if (!existing || existing.count === 0) throw new DomainError('このユーザーには警告がありません');

    const newCount = existing.count - 1;
    const updated = UserWarning.create({ userId: dto.userId, guildId: dto.guildId, count: newCount, updatedAt: new Date() });
    await this.repo.save(updated);

    await this.applyWarningRoles(dto.guild, dto.userId, newCount, setting.noticeRoleId, setting.warningRoleId);
    await this.repo.appendLog({ userId: dto.userId, guildId: dto.guildId, action: 'remove', reason: '警告取り消し', moderatorId: dto.moderatorId });
  }

  async getWarnings(dto: GetWarningsDto): Promise<WarningStatus> {
    const existing = await this.repo.findByUser(dto.userId, dto.guildId);
    const logs     = await this.repo.findLogs(dto.userId, dto.guildId);
    return { count: existing?.count ?? 0, logs };
  }

  async executeBan(dto: BanDto): Promise<void> {
    const setting = await this.repo.findGuildSetting(dto.guildId);
    if (!setting) throw new DomainError('モデレーション設定が未登録です。先に `/warn setup` を実行してください');

    await dto.guild.setMemberRoles(dto.userId, [], [setting.noticeRoleId, setting.warningRoleId]);
    await dto.guild.banUser(dto.userId, dto.reason);
    await this.repo.delete(dto.userId, dto.guildId);
    await this.repo.appendLog({ userId: dto.userId, guildId: dto.guildId, action: 'ban', reason: dto.reason, moderatorId: dto.moderatorId });
  }

  async runDegradationCheck(guildId: string, botId: string, guild: GuildPort): Promise<void> {
    const setting = await this.repo.findGuildSetting(guildId);
    if (!setting) return;

    const allWarnings = await this.repo.findAllByGuild(guildId);
    const now = new Date();

    for (const warning of allWarnings) {
      if (!warning.shouldDowngrade(now)) continue;

      const newCount = warning.count - 1;
      const updated  = UserWarning.create({ userId: warning.userId, guildId, count: newCount, updatedAt: now });
      await this.repo.save(updated);

      await this.applyWarningRoles(guild, warning.userId, newCount, setting.noticeRoleId, setting.warningRoleId);
      await this.repo.appendLog({ userId: warning.userId, guildId, action: 'downgrade', reason: '1年経過による自動降格', moderatorId: botId });
    }
  }

  private async applyWarningRoles(guild: GuildPort, userId: string, count: number, noticeRoleId: string, warningRoleId: string): Promise<void> {
    const rolesToAdd:    string[] = [];
    const rolesToRemove: string[] = [];

    if (count >= 2) {
      rolesToAdd.push(warningRoleId);
      rolesToRemove.push(noticeRoleId);
    } else if (count === 1) {
      rolesToAdd.push(noticeRoleId);
      rolesToRemove.push(warningRoleId);
    } else {
      rolesToRemove.push(noticeRoleId, warningRoleId);
    }

    await guild.setMemberRoles(userId, rolesToAdd, rolesToRemove);
  }
}
