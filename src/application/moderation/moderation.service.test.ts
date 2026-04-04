import { describe, it, expect, beforeEach } from 'vitest';
import { ModerationService } from './moderation.service';
import { UserWarningRepository, WarningLog } from '../../domain/moderation/user-warning.repository';
import { UserWarning } from '../../domain/moderation/user-warning';
import { GuildSetting, GuildSettingProps } from '../../domain/moderation/guild-setting';
import { GuildPort } from '../../domain/moderation/guild.port';
import { DomainError } from '../../errors';

// ---- インメモリ実装 ----

class InMemoryUserWarningRepository implements UserWarningRepository {
  private warnings = new Map<string, UserWarning>();
  private logs:     WarningLog[] = [];
  private settings = new Map<string, GuildSetting>();

  private key(userId: string, guildId: string) { return `${guildId}:${userId}`; }

  async findByUser(userId: string, guildId: string): Promise<UserWarning | null> {
    return this.warnings.get(this.key(userId, guildId)) ?? null;
  }
  async findAllByGuild(guildId: string): Promise<UserWarning[]> {
    return [...this.warnings.values()].filter(w => w.guildId === guildId);
  }
  async save(warning: UserWarning): Promise<void> {
    this.warnings.set(this.key(warning.userId, warning.guildId), warning);
  }
  async delete(userId: string, guildId: string): Promise<void> {
    this.warnings.delete(this.key(userId, guildId));
  }
  async appendLog(log: Omit<WarningLog, 'id' | 'createdAt'>): Promise<void> {
    this.logs.push({ id: String(this.logs.length), createdAt: new Date(), ...log });
  }
  async findLogs(userId: string, guildId: string): Promise<WarningLog[]> {
    return this.logs.filter(l => l.userId === userId && l.guildId === guildId);
  }
  async findGuildSetting(guildId: string): Promise<GuildSetting | null> {
    return this.settings.get(guildId) ?? null;
  }
  async saveGuildSetting(setting: GuildSettingProps): Promise<void> {
    this.settings.set(setting.guildId, GuildSetting.create(setting));
  }
}

class InMemoryGuildPort implements GuildPort {
  banned:  string[] = [];
  roles  = new Map<string, { add: string[]; remove: string[] }>();
  timeouts = new Map<string, number>();

  async banUser(userId: string): Promise<void> {
    this.banned.push(userId);
  }
  async setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void> {
    this.roles.set(userId, { add: rolesToAdd, remove: rolesToRemove });
  }
  async timeoutMember(userId: string, durationMs: number): Promise<void> {
    this.timeouts.set(userId, durationMs);
  }
}

// ---- テスト ----

describe('ModerationService', () => {
  let repo:      InMemoryUserWarningRepository;
  let guildPort: InMemoryGuildPort;
  let service:   ModerationService;

  const guildId     = 'guild-1';
  const moderatorId = 'mod-1';
  const botId       = 'bot-id';

  beforeEach(async () => {
    repo      = new InMemoryUserWarningRepository();
    guildPort = new InMemoryGuildPort();
    service   = new ModerationService(repo);
    await repo.saveGuildSetting({ guildId, noticeRoleId: 'role-notice', warningRoleId: 'role-warning' });
  });

  it('警告未設定のサーバーでは addWarning が DomainError', async () => {
    const emptyRepo = new InMemoryUserWarningRepository();
    const s = new ModerationService(emptyRepo);
    await expect(s.addWarning({ userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort })).rejects.toThrow(DomainError);
  });

  it('1回目の警告は banned: false を返す', async () => {
    const result = await service.addWarning({ userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort });
    expect(result.banned).toBe(false);
  });

  it('警告3回目で banned: true を返す', async () => {
    const dto = { userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort };
    await service.addWarning(dto);
    await service.addWarning(dto);
    const result = await service.addWarning(dto);
    expect(result.banned).toBe(true);
  });

  it('警告3回目でユーザーがDBから削除される', async () => {
    const dto = { userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort };
    await service.addWarning(dto);
    await service.addWarning(dto);
    await service.addWarning(dto);
    expect(await repo.findByUser('u1', guildId)).toBeNull();
  });

  it('警告3回目で banUser が呼ばれる', async () => {
    const dto = { userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort };
    await service.addWarning(dto);
    await service.addWarning(dto);
    await service.addWarning(dto);
    expect(guildPort.banned).toContain('u1');
  });

  it('removeWarning は警告回数を1減らす', async () => {
    await service.addWarning({ userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort });
    await service.removeWarning({ userId: 'u1', guildId, moderatorId, guild: guildPort });
    const status = await service.getWarnings({ userId: 'u1', guildId });
    expect(status.count).toBe(0);
  });

  it('警告ゼロのユーザーへの removeWarning は DomainError', async () => {
    await expect(service.removeWarning({ userId: 'u1', guildId, moderatorId, guild: guildPort })).rejects.toThrow(DomainError);
  });

  it('getWarnings はログも返す', async () => {
    await service.addWarning({ userId: 'u1', guildId, moderatorId, reason: '理由', guild: guildPort });
    const status = await service.getWarnings({ userId: 'u1', guildId });
    expect(status.logs).toHaveLength(1);
    expect(status.logs[0].action).toBe('add');
  });

  it('shouldDowngrade が true のユーザーは runDegradationCheck で降格する', async () => {
    const oldDate = new Date(Date.now() - 366 * 86400000);
    await repo.save(UserWarning.create({ userId: 'u1', guildId, count: 1, updatedAt: oldDate }));
    await service.runDegradationCheck(guildId, botId, guildPort);
    const status = await service.getWarnings({ userId: 'u1', guildId });
    expect(status.count).toBe(0);
  });
});
