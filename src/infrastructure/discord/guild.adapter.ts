import { Guild } from 'discord.js';
import { GuildPort } from '../../domain/moderation/guild.port';
import { logger } from '../../lib/logger';

export class DiscordGuildAdapter implements GuildPort {
  constructor(private readonly guild: Guild) {}

  async banUser(userId: string, reason: string): Promise<void> {
    await this.guild.bans.create(userId, { reason });
  }

  async setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void> {
    const member = await this.guild.members.fetch(userId).catch((e) => { logger.error({ err: e }, 'members.fetch failed'); return null; });
    logger.debug({ userId, member: !!member, rolesToAdd, rolesToRemove }, 'setMemberRoles');
    if (!member) return;
    const currentIds = member.roles.cache.map(r => r.id);
    const finalIds   = [...currentIds.filter(id => !rolesToRemove.includes(id)), ...rolesToAdd];
    await member.roles.set(finalIds);
  }

  async timeoutMember(userId: string, durationMs: number, reason: string): Promise<void> {
    const member = await this.guild.members.fetch(userId).catch(() => null);
    await member?.timeout(durationMs, reason);
  }
}
