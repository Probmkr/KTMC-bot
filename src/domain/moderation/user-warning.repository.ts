import { GuildSetting, GuildSettingProps } from './guild-setting';
import { UserWarning } from './user-warning';

export interface WarningLog {
  id:          string;
  userId:      string;
  guildId:     string;
  action:      'add' | 'remove' | 'ban' | 'downgrade';
  reason:      string;
  moderatorId: string;
  createdAt:   Date;
}

export interface UserWarningRepository {
  findByUser(userId: string, guildId: string): Promise<UserWarning | null>;
  findAllByGuild(guildId: string): Promise<UserWarning[]>;
  save(warning: UserWarning): Promise<void>;
  delete(userId: string, guildId: string): Promise<void>;
  appendLog(log: Omit<WarningLog, 'id' | 'createdAt'>): Promise<void>;
  findLogs(userId: string, guildId: string): Promise<WarningLog[]>;
  findGuildSetting(guildId: string): Promise<GuildSetting | null>;
  saveGuildSetting(setting: GuildSettingProps): Promise<void>;
}
