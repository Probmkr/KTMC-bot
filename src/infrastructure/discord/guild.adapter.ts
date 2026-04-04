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
