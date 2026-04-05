import { Guild } from 'discord.js';
import { GuildPort } from '../../domain/moderation/guild.port';

export class DiscordGuildAdapter implements GuildPort {
  constructor(private readonly guild: Guild) {}

  async banUser(userId: string, reason: string): Promise<void> {
    await this.guild.bans.create(userId, { reason });
  }

  async setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void> {
    const member = await this.guild.members.fetch(userId).catch((e) => { console.error('members.fetch failed:', e); return null; });
    console.log('setMemberRoles', { userId, member: !!member, rolesToAdd, rolesToRemove });
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
